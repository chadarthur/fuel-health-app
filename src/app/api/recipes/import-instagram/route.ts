import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getAIProvider } from "@/lib/ai/provider";
import { INSTAGRAM_CAPTION_IMPORT_PROMPT } from "@/lib/ai/prompts";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2019;/g, "’")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/** Pull the caption out of an Instagram post/reel page via its og: meta tags. */
async function fetchInstagramCaption(url: URL): Promise<string | null> {
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (!response.ok) return null;

    const html = await response.text();
    // Caption lives in og:description (and sometimes the meta description)
    const og =
      html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i) ??
      html.match(/<meta\s+content="([^"]*)"\s+property="og:description"/i) ??
      html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);

    if (!og?.[1]) return null;
    const caption = decodeHtmlEntities(og[1]).trim();
    // A blocked/login page yields a generic short description
    if (caption.length < 40) return null;
    return caption;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    let caption: string | undefined =
      typeof body.caption === "string" ? body.caption.trim() : undefined;
    const urlInput: string | undefined =
      typeof body.url === "string" ? body.url.trim() : undefined;
    let sourceUrl: string | null = null;

    if (!caption && urlInput) {
      let parsed: URL;
      try {
        parsed = new URL(urlInput);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
      if (!/(^|\.)instagram\.com$/.test(parsed.hostname)) {
        return NextResponse.json(
          { error: "That's not an Instagram URL. Use the regular URL import for other sites." },
          { status: 400 }
        );
      }

      sourceUrl = parsed.toString();
      const fetched = await fetchInstagramCaption(parsed);
      if (!fetched) {
        return NextResponse.json(
          {
            error:
              "Couldn't read that post — Instagram blocks some requests. Copy the caption text and paste it instead.",
            needsCaption: true,
          },
          { status: 422 }
        );
      }
      caption = fetched;
    }

    if (!caption || caption.length < 20) {
      return NextResponse.json(
        { error: "Paste an Instagram post URL or the caption text." },
        { status: 400 }
      );
    }

    const hasApiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    if (!hasApiKey) {
      return NextResponse.json({ error: "AI not configured. Please add an API key." }, { status: 503 });
    }

    const provider = getAIProvider("anthropic");
    let result;
    try {
      result = await provider.complete({
        messages: [
          { role: "system", content: INSTAGRAM_CAPTION_IMPORT_PROMPT },
          { role: "user", content: `Extract the recipe from this Instagram caption:\n\n${caption.slice(0, 8000)}` },
        ],
        maxTokens: 2000,
        temperature: 0.2,
      });
    } catch (aiErr: unknown) {
      const e = aiErr as { message?: string };
      console.error("[instagram-import] AI error:", e.message);
      return NextResponse.json({ error: "AI failed to extract the recipe. Try again." }, { status: 500 });
    }

    let recipe;
    try {
      const cleaned = result.content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      recipe = JSON.parse(cleaned);
    } catch {
      console.error("[instagram-import] JSON parse failed:", result.content.slice(0, 200));
      return NextResponse.json({ error: "Couldn't parse a recipe from that caption." }, { status: 400 });
    }

    if (recipe.error) {
      return NextResponse.json({ error: recipe.error }, { status: 400 });
    }
    if (!recipe.title || !Array.isArray(recipe.ingredients)) {
      return NextResponse.json({ error: "No recipe found in that caption." }, { status: 400 });
    }

    if (sourceUrl) recipe.sourceUrl = sourceUrl;
    return NextResponse.json({ recipe });
  } catch (err) {
    console.error("[instagram-import] error:", err);
    return NextResponse.json({ error: "Import failed. Please try again." }, { status: 500 });
  }
}
