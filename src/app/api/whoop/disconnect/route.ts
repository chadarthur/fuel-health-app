import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function POST() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { userId } = auth;

  await prisma.whoopToken.deleteMany({ where: { userId } });

  return NextResponse.json({ disconnected: true });
}
