import { NextRequest, NextResponse } from "next/server";
import { getWhoopData, getLast30DaysRange } from "@/lib/api/whoop";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { startDate: defaultStart, endDate: defaultEnd } = getLast30DaysRange();

    const startDate = searchParams.get("startDate") || defaultStart;
    const endDate = searchParams.get("endDate") || defaultEnd;

    const data = await getWhoopData("demo-user", startDate, endDate);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Whoop GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
