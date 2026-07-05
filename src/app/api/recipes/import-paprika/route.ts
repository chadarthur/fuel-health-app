import { NextRequest, NextResponse } from "next/server";
import { gunzipSync } from "zlib";
import JSZip from "jszip";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { RecipeIngredient } from "@/types/recipe";

export const maxDuration = 60;

// Paprika's export: a .paprikarecipes file is a ZIP of .paprikarecipe entries,
// each of which is a gzipped JSON document.
interface PaprikaRecipe {
  name?: string;
  ingredients?: string;
  directions?: string;
  description?: string;
  notes?: string;
  nutritional_info?: string;
  servings?: string;
  total_time?: string;
  prep_time?: string;
  cook_time?: string;
  source?: string;
  source_url?: string;
  image_url?: string;
  categories?: string[];
}

const KNOWN_UNITS = new Set([
  "cup", "cups", "c",
  "tbsp", "tablespoon", "tablespoons",
  "tsp", "teaspoon", "teaspoons",
  "oz", "ounce", "ounces",
  "lb", "lbs", "pound", "pounds",
  "g", "gram", "grams", "kg",
  "ml", "l", "liter", "liters", "litre", "litres",
  "clove", "cloves", "can", "cans", "slice", "slices",
  "pinch", "handful", "bunch", "stick", "sticks", "package", "packages",
]);

function parseFraction(str: string): number {
  // handles "1", "1.5", "1/2", "1 1/2"
  let total = 0;
  for (const part of str.trim().split(/\s+/)) {
    if (part.includes("/")) {
      const [num, den] = part.split("/").map(Number);
      if (den) total += num / den;
    } else {
      const n = parseFloat(part);
      if (!isNaN(n)) total += n;
    }
  }
  return total;
}

function parseIngredientLine(line: string): RecipeIngredient | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // Skip section headers like "For the sauce:"
  if (/^[A-Za-z ].*:$/.test(trimmed) && trimmed.length < 40) return null;

  const match = trimmed.match(/^([\d¼½¾⅓⅔⅛.\/\s]+)?\s*([A-Za-z.]+)?\s*(.*)$/);
  let amount = 0;
  let unit = "";
  let name = trimmed;

  if (match) {
    const qty = match[1]?.trim();
    const maybeUnit = match[2]?.toLowerCase().replace(/\.$/, "");
    if (qty) {
      const normalized = qty
        .replace(/¼/g, "1/4").replace(/½/g, "1/2").replace(/¾/g, "3/4")
        .replace(/⅓/g, "1/3").replace(/⅔/g, "2/3").replace(/⅛/g, "1/8");
      amount = parseFraction(normalized);
      if (maybeUnit && KNOWN_UNITS.has(maybeUnit)) {
        unit = maybeUnit;
        name = match[3]?.trim() || trimmed;
      } else {
        name = `${match[2] ?? ""} ${match[3] ?? ""}`.trim() || trimmed;
      }
    }
  }

  return { name, amount, unit, original: trimmed };
}

function parseMinutes(...times: (string | undefined)[]): number | null {
  for (const t of times) {
    if (!t) continue;
    const hours = t.match(/(\d+)\s*h/i);
    const mins = t.match(/(\d+)\s*m/i);
    if (hours || mins) {
      return (hours ? parseInt(hours[1]) * 60 : 0) + (mins ? parseInt(mins[1]) : 0);
    }
    const plain = parseInt(t);
    if (!isNaN(plain) && plain > 0) return plain;
  }
  return null;
}

function mapRecipe(p: PaprikaRecipe, userId: string) {
  if (!p.name) return null;

  const ingredients = (p.ingredients ?? "")
    .split("\n")
    .map(parseIngredientLine)
    .filter((i): i is RecipeIngredient => i !== null);

  const servingsMatch = p.servings?.match(/\d+/);

  return {
    userId,
    title: p.name,
    summary: p.description || p.notes?.slice(0, 500) || null,
    sourceUrl: p.source_url || null,
    image: p.image_url || null,
    readyInMinutes: parseMinutes(p.total_time, p.cook_time, p.prep_time),
    servings: servingsMatch ? parseInt(servingsMatch[0]) : null,
    instructions: p.directions || null,
    ingredients: JSON.stringify(ingredients),
    nutrition: JSON.stringify({ calories: 0, protein: 0, carbs: 0, fat: 0 }),
    cuisines: p.categories?.length ? JSON.stringify(p.categories) : null,
    diets: null,
    isAiGenerated: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    // The file is uploaded directly from the browser to Vercel Blob (see
    // src/app/api/blob/upload/route.ts) to avoid the ~4.5MB request body
    // limit on serverless functions — Paprika exports routinely exceed that.
    // We're just given the resulting blob URL to fetch and process.
    const { blobUrl } = await req.json();
    if (!blobUrl || typeof blobUrl !== "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let buffer: Buffer;
    try {
      const blobRes = await fetch(blobUrl);
      if (!blobRes.ok) throw new Error(`blob fetch ${blobRes.status}`);
      buffer = Buffer.from(await blobRes.arrayBuffer());
    } catch (e) {
      console.error("[paprika] failed to fetch blob:", e);
      return NextResponse.json({ error: "Failed to read the uploaded file. Try again." }, { status: 400 });
    } finally {
      del(blobUrl).catch((e) => console.error("[paprika] failed to delete blob:", e));
    }

    const raw: PaprikaRecipe[] = [];

    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
    const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;

    if (isZip) {
      const zip = await JSZip.loadAsync(buffer);
      for (const entry of Object.values(zip.files)) {
        if (entry.dir || !entry.name.endsWith(".paprikarecipe")) continue;
        try {
          const gz = await entry.async("nodebuffer");
          raw.push(JSON.parse(gunzipSync(gz).toString("utf-8")));
        } catch (e) {
          console.error("[paprika] failed to parse entry", entry.name, e);
        }
      }
    } else if (isGzip) {
      raw.push(JSON.parse(gunzipSync(buffer).toString("utf-8")));
    } else {
      return NextResponse.json(
        { error: "Unrecognized file. Export from Paprika via Settings → Export → Paprika Recipe Format (.paprikarecipes)." },
        { status: 400 }
      );
    }

    if (raw.length === 0) {
      return NextResponse.json({ error: "No recipes found in that file." }, { status: 400 });
    }

    // Skip recipes already imported (same title from a previous run)
    const existing = await prisma.savedRecipe.findMany({
      where: { userId },
      select: { title: true },
    });
    const existingTitles = new Set(existing.map((r) => r.title.toLowerCase()));

    const toCreate = raw
      .map((p) => mapRecipe(p, userId))
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter((r) => !existingTitles.has(r.title.toLowerCase()));

    if (toCreate.length > 0) {
      await prisma.savedRecipe.createMany({ data: toCreate });
    }

    return NextResponse.json({
      imported: toCreate.length,
      skipped: raw.length - toCreate.length,
    });
  } catch (err) {
    console.error("[paprika] import error:", err);
    return NextResponse.json({ error: "Import failed. Make sure it's a Paprika export file." }, { status: 500 });
  }
}
