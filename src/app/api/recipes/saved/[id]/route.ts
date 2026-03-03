import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const recipe = await prisma.savedRecipe.findFirst({
      where: { id: params.id, userId },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients || "[]"),
      nutrition: JSON.parse(recipe.nutrition || "{}"),
      cuisines: recipe.cuisines ? JSON.parse(recipe.cuisines) : [],
      diets: recipe.diets ? JSON.parse(recipe.diets) : [],
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("Saved recipe GET [id] error:", err);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    await prisma.savedRecipe.deleteMany({ where: { id: params.id, userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Saved recipe DELETE [id] error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
