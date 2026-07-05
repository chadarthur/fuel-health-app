import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const MAX_MEMBERS = 2;

/** Accept or decline an incoming invite: { inviteId, action: "accept" | "decline" } */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { inviteId, action } = await req.json();
    if (!inviteId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "inviteId and action required" }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, householdId: true },
    });
    if (!me?.email) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const invite = await prisma.householdInvite.findUnique({ where: { id: inviteId } });
    if (
      !invite ||
      invite.status !== "pending" ||
      invite.invitedEmail !== me.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (action === "decline") {
      await prisma.householdInvite.update({
        where: { id: invite.id },
        data: { status: "declined" },
      });
      return NextResponse.json({ ok: true });
    }

    // Accept
    if (me.householdId) {
      return NextResponse.json(
        { error: "You're already in a household. Leave it first." },
        { status: 400 }
      );
    }

    const inviter = await prisma.user.findUnique({
      where: { id: invite.invitedById },
      select: { id: true, householdId: true },
    });
    if (!inviter) {
      return NextResponse.json({ error: "The inviter's account no longer exists" }, { status: 404 });
    }

    let householdId = inviter.householdId;
    if (householdId) {
      const memberCount = await prisma.user.count({ where: { householdId } });
      if (memberCount >= MAX_MEMBERS) {
        return NextResponse.json({ error: "That household is already full" }, { status: 400 });
      }
    } else {
      const household = await prisma.household.create({ data: {} });
      householdId = household.id;
      await prisma.user.update({
        where: { id: inviter.id },
        data: { householdId },
      });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { householdId } }),
      prisma.householdInvite.update({
        where: { id: invite.id },
        data: { status: "accepted", householdId },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Household invite error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
