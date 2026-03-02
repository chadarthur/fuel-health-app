import { NextRequest, NextResponse } from "next/server";
import { getWhoopData, getLast30DaysRange } from "@/lib/api/whoop";
import { requireUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const { startDate: defaultStart, endDate: defaultEnd } = getLast30DaysRange();

    const startDate = searchParams.get("startDate") || defaultStart;
    const endDate = searchParams.get("endDate") || defaultEnd;

    const data = await getWhoopData(userId, startDate, endDate);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Whoop GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
