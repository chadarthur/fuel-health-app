import { NextRequest, NextResponse } from "next/server";
import { searchRecipes } from "@/lib/api/spoonacular";
import { recipeSearchSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = recipeSearchSchema.safeParse({
      q: searchParams.get("q"),
      diet: searchParams.get("diet"),
      cuisine: searchParams.get("cuisine"),
      offset: searchParams.get("offset"),
      number: searchParams.get("number"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const results = await searchRecipes(parsed.data);
    return NextResponse.json(results);
  } catch (err) {
    console.error("Recipe search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
