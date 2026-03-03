import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getUtcDayRange } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tzOffset = parseInt(searchParams.get("tz") ?? "0", 10);

    let where: { userId: string; loggedAt?: { gte: Date; lte: Date } } = { userId };

    if (date) {
      const { start, end } = getUtcDayRange(date, tzOffset);
      where.loggedAt = { gte: start, lte: end };
    } else if (startDate && endDate) {
      const { start } = getUtcDayRange(startDate, tzOffset);
      const { end } = getUtcDayRange(endDate, tzOffset);
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
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    const meal = await prisma.mealEntry.create({
      data: {
        userId,
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
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.mealEntry.updateMany({ where: { id, userId }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Meals PUT error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.mealEntry.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Meals DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
