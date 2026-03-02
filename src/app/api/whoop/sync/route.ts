import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWhoopData, getLast30DaysRange } from "@/lib/api/whoop";
import { requireUser } from "@/lib/session";

export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { startDate, endDate } = getLast30DaysRange();
    const data = await getWhoopData(userId, startDate, endDate);

    let synced = 0;
    for (const day of data) {
      const date = new Date(day.date);
      await prisma.whoopDailyData.upsert({
        where: { userId_date: { userId, date } },
        update: {
          recoveryScore: day.recoveryScore,
          hrvRmssd: day.hrvRmssd,
          restingHr: day.restingHr,
          strainScore: day.strainScore,
          sleepScore: day.sleepScore,
          sleepHours: day.sleepHours,
          caloriesBurned: day.caloriesBurned,
        },
        create: {
          userId,
          date,
          recoveryScore: day.recoveryScore,
          hrvRmssd: day.hrvRmssd,
          restingHr: day.restingHr,
          strainScore: day.strainScore,
          sleepScore: day.sleepScore,
          sleepHours: day.sleepHours,
          caloriesBurned: day.caloriesBurned,
        },
      });
      synced++;
    }

    return NextResponse.json({ synced });
  } catch (err) {
    console.error("Whoop sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
