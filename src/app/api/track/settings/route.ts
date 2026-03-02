import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const goals = await prisma.macroGoal.findUnique({ where: { userId } });
    return NextResponse.json(
      goals ?? { calories: 2000, protein: 150, carbs: 250, fat: 65 }
    );
  } catch (err) {
    console.error("Settings GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    const goals = await prisma.macroGoal.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });
    return NextResponse.json(goals);
  } catch (err) {
    console.error("Settings PUT error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
