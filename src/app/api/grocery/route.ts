import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeIngredient } from "@/lib/grocery-utils";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const items = await prisma.groceryItem.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(
      items.map((i) => ({
        ...i,
        quantity: i.quantity ?? undefined,
        unit: i.unit ?? undefined,
        recipeId: i.recipeId ?? undefined,
        recipeTitle: i.recipeTitle ?? undefined,
        createdAt: i.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("Grocery GET error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    const { name, quantity, unit, category } = body;

    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const cat = category || categorizeIngredient(name);
    const item = await prisma.groceryItem.create({
      data: { userId, name, quantity: quantity ?? null, unit: unit ?? null, category: cat },
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error("Grocery POST error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const item = await prisma.groceryItem.updateMany({
      where: { id, userId },
      data: updates,
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error("Grocery PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.groceryItem.deleteMany({ where: { id, userId } });
      return NextResponse.json({ success: true });
    }

    const body = await req.json().catch(() => ({}));
    if (body.clearChecked) {
      await prisma.groceryItem.deleteMany({ where: { userId, checked: true } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No target specified" }, { status: 400 });
  } catch (err) {
    console.error("Grocery DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
