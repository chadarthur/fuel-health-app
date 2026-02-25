import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "demo-user";

async function ensureDemoUser() {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: { id: USER_ID, name: "Demo User", email: "demo@fuel.app" },
  });
}

export async function GET() {
  try {
    await ensureDemoUser();
    const recipes = await prisma.savedRecipe.findMany({
      where: { userId: USER_ID },
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
    await ensureDemoUser();
    const body = await req.json();

    const recipe = await prisma.savedRecipe.create({
      data: {
        userId: USER_ID,
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.savedRecipe.deleteMany({ where: { id, userId: USER_ID } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete recipe error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
