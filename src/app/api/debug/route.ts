import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const sessionEmail = session?.user?.email;

  let mealCount = 0;
  if (sessionUserId) {
    mealCount = await prisma.mealEntry.count({ where: { userId: sessionUserId } });
  }

  return NextResponse.json({ sessionUserId, sessionEmail, mealCount });
}

// DELETE: wipe all meal entries for the current session user
export async function DELETE() {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { count } = await prisma.mealEntry.deleteMany({ where: { userId: sessionUserId } });
  return NextResponse.json({ deleted: count });
}
