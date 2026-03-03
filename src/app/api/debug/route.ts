import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      createdAt: true,
      _count: {
        select: { mealEntries: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}
