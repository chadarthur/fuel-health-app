import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const token = await prisma.whoopToken.findUnique({ where: { userId } });

  return NextResponse.json({
    connected: !!token,
    expiresAt: token?.expiresAt ?? null,
  });
}
