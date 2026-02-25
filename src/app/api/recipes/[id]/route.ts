import { NextRequest, NextResponse } from "next/server";
import { getRecipeById } from "@/lib/api/spoonacular";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }
    const recipe = await getRecipeById(id);
    return NextResponse.json(recipe);
  } catch (err) {
    console.error("Recipe detail error:", err);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}
