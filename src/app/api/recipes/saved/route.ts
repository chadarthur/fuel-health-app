import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const recipes = await prisma.savedRecipe.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      recipes.map((r) => ({
        ...r,
        ingredients: JSON.parse(r.ingredients || "[]"),
        nutrition: JSON.parse(r.nutrition || "{}"),
        cuisines: r.cuisines ? JSON.parse(r.cuisines) : [],
        diets: r.diets ? JSON.parse(r.diets) : [],
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("Saved recipes GET error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();

    const recipe = await prisma.savedRecipe.create({
      data: {
        userId,
        spoonacularId: body.spoonacularId ?? null,
        title: body.title,
        image: body.image ?? null,
        summary: body.summary ?? null,
        sourceUrl: body.sourceUrl ?? null,
        readyInMinutes: body.readyInMinutes ?? null,
        servings: body.servings ?? null,
        instructions: body.instructions ?? null,
        ingredients: JSON.stringify(body.ingredients || []),
        nutrition: JSON.stringify(body.nutrition || {}),
        cuisines: body.cuisines ? JSON.stringify(body.cuisines) : null,
        diets: body.diets ? JSON.stringify(body.diets) : null,
        isAiGenerated: body.isAiGenerated ?? false,
      },
    });

    return NextResponse.json({ id: recipe.id });
  } catch (err) {
    console.error("Save recipe error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.savedRecipe.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete recipe error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
