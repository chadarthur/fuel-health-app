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

export async function GET(req: NextRequest) {
  try {
    await ensureDemoUser();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let where: { userId: string; loggedAt?: { gte: Date; lte: Date } } = { userId: USER_ID };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.loggedAt = { gte: start, lte: end };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.loggedAt = { gte: start, lte: end };
    }

    const meals = await prisma.mealEntry.findMany({
      where,
      orderBy: { loggedAt: "desc" },
    });

    return NextResponse.json(
      meals.map((m) => ({
        ...m,
        loggedAt: m.loggedAt.toISOString(),
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("Meals GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDemoUser();
    const body = await req.json();
    const meal = await prisma.mealEntry.create({
      data: {
        userId: USER_ID,
        name: body.name,
        description: body.description ?? null,
        mealType: body.mealType || "snack",
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fat: body.fat,
        fiber: body.fiber ?? null,
        sugar: body.sugar ?? null,
        imageUrl: body.imageUrl ?? null,
        source: body.source || "manual",
        confidence: body.confidence ?? null,
        loggedAt: body.loggedAt ? new Date(body.loggedAt) : new Date(),
      },
    });
    return NextResponse.json(meal);
  } catch (err) {
    console.error("Meals POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.mealEntry.updateMany({ where: { id, userId: USER_ID }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Meals PUT error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.mealEntry.deleteMany({ where: { id, userId: USER_ID } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Meals DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
