import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "demo-user";

export async function GET() {
  try {
    const goals = await prisma.macroGoal.findUnique({ where: { userId: USER_ID } });
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
    const body = await req.json();
    const goals = await prisma.macroGoal.upsert({
      where: { userId: USER_ID },
      update: body,
      create: { userId: USER_ID, ...body },
    });
    return NextResponse.json(goals);
  } catch (err) {
    console.error("Settings PUT error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
