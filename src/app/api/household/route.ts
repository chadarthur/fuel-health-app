import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const MAX_MEMBERS = 2;

/** Household status: members plus pending invites in both directions. */
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, householdId: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [members, incoming, outgoing] = await Promise.all([
      user.householdId
        ? prisma.user.findMany({
            where: { householdId: user.householdId },
            select: { id: true, name: true, email: true },
          })
        : Promise.resolve([]),
      user.email
        ? prisma.householdInvite.findMany({
            where: { invitedEmail: user.email.toLowerCase(), status: "pending" },
            include: { invitedBy: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      prisma.householdInvite.findMany({
        where: { invitedById: userId, status: "pending" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      household: user.householdId
        ? { id: user.householdId, members }
        : null,
      incoming: incoming.map((i) => ({
        id: i.id,
        from: i.invitedBy.name || i.invitedBy.email,
        createdAt: i.createdAt.toISOString(),
      })),
      outgoing: outgoing.map((i) => ({
        id: i.id,
        email: i.invitedEmail,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Household GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** Invite another user by email. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const invitedEmail = email.toLowerCase().trim();

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, householdId: true },
    });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (me.email?.toLowerCase() === invitedEmail) {
      return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 });
    }

    if (me.householdId) {
      const memberCount = await prisma.user.count({ where: { householdId: me.householdId } });
      if (memberCount >= MAX_MEMBERS) {
        return NextResponse.json(
          { error: "Your household is full. Leave it before inviting someone else." },
          { status: 400 }
        );
      }
    }

    const target = await prisma.user.findUnique({ where: { email: invitedEmail } });
    if (!target) {
      return NextResponse.json(
        { error: "No account found with that email. Ask them to sign up first." },
        { status: 404 }
      );
    }
    if (target.householdId) {
      return NextResponse.json(
        { error: "That user is already sharing with someone." },
        { status: 400 }
      );
    }

    const existing = await prisma.householdInvite.findFirst({
      where: { invitedById: userId, invitedEmail, status: "pending" },
    });
    if (existing) {
      return NextResponse.json({ error: "Invite already pending for that email." }, { status: 409 });
    }

    const invite = await prisma.householdInvite.create({
      data: {
        invitedById: userId,
        invitedEmail,
        householdId: me.householdId,
      },
    });

    return NextResponse.json({ ok: true, inviteId: invite.id });
  } catch (err) {
    console.error("Household POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** Leave the current household (or cancel an outgoing invite via ?inviteId=). */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get("inviteId");

    if (inviteId) {
      await prisma.householdInvite.deleteMany({
        where: { id: inviteId, invitedById: userId, status: "pending" },
      });
      return NextResponse.json({ ok: true });
    }

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });
    if (!me?.householdId) {
      return NextResponse.json({ error: "You're not in a household" }, { status: 400 });
    }

    const householdId = me.householdId;
    await prisma.user.update({ where: { id: userId }, data: { householdId: null } });

    const remaining = await prisma.user.count({ where: { householdId } });
    if (remaining === 0) {
      await prisma.household.delete({ where: { id: householdId } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Household DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
