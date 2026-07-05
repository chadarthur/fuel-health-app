import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { simpleMode: true },
    });

    return NextResponse.json({ simpleMode: user?.simpleMode ?? false });
  } catch (err) {
    console.error("Preferences GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    if (typeof body.simpleMode !== "boolean") {
      return NextResponse.json({ error: "simpleMode must be a boolean" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { simpleMode: body.simpleMode },
    });

    return NextResponse.json({ simpleMode: body.simpleMode });
  } catch (err) {
    console.error("Preferences PUT error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
