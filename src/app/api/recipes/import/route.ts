import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getAIProvider } from "@/lib/ai/provider";
import { RECIPE_URL_IMPORT_PROMPT } from "@/lib/ai/prompts";

// Strip HTML tags and normalize whitespace for AI parsing
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 12000); // Keep first 12k chars — enough for any recipe
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL. Please enter a valid recipe URL." }, { status: 400 });
    }

    // Fetch the webpage content
    let html: string;
    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Could not fetch that URL (${response.status}). Make sure the page is publicly accessible.` },
          { status: 400 }
        );
      }

      html = await response.text();
    } catch (fetchErr: unknown) {
      const e = fetchErr as { name?: string };
      if (e.name === "TimeoutError") {
        return NextResponse.json({ error: "The page took too long to load. Try a different URL." }, { status: 400 });
      }
      console.error("[recipe-import] fetch error:", fetchErr);
      return NextResponse.json({ error: "Could not reach that URL. Make sure it's publicly accessible." }, { status: 400 });
    }

    // Extract readable text from HTML
    const pageText = extractTextFromHtml(html);

    if (pageText.length < 100) {
      return NextResponse.json({ error: "Could not read content from that page." }, { status: 400 });
    }

    // Check if AI is available
    const hasApiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    if (!hasApiKey) {
      return NextResponse.json({ error: "AI not configured. Please add an API key." }, { status: 503 });
    }

    // Ask AI to extract the recipe
    const provider = getAIProvider("anthropic");
    let result;
    try {
      result = await provider.complete({
        messages: [
          { role: "system", content: RECIPE_URL_IMPORT_PROMPT },
          {
            role: "user",
            content: `Extract the recipe from this webpage content:\n\nURL: ${parsedUrl.toString()}\n\nCONTENT:\n${pageText}`,
          },
        ],
        maxTokens: 2000,
        temperature: 0.2, // Low temp for accurate extraction
      });
    } catch (aiErr: unknown) {
      const e = aiErr as { message?: string };
      console.error("[recipe-import] AI error:", e.message);
      return NextResponse.json({ error: "AI failed to extract recipe. Try again." }, { status: 500 });
    }

    // Parse AI response
    let recipe;
    try {
      // Strip markdown code fences if present
      const cleaned = result.content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      recipe = JSON.parse(cleaned);
    } catch {
      console.error("[recipe-import] JSON parse failed:", result.content.slice(0, 200));
      return NextResponse.json({ error: "Could not parse recipe from that page. Try a different URL." }, { status: 400 });
    }

    if (recipe.error) {
      return NextResponse.json({ error: recipe.error }, { status: 400 });
    }

    // Validate essential fields
    if (!recipe.title || !Array.isArray(recipe.ingredients)) {
      return NextResponse.json({ error: "No recipe found on that page. Try a URL that links directly to a recipe." }, { status: 400 });
    }

    return NextResponse.json({ recipe });
  } catch (err) {
    console.error("[recipe-import] error:", err);
    return NextResponse.json({ error: "Import failed. Please try again." }, { status: 500 });
  }
}
