import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWhoopData, getLast30DaysRange } from "@/lib/api/whoop";

const USER_ID = "demo-user";

export async function POST() {
  try {
    const { startDate, endDate } = getLast30DaysRange();
    const data = await getWhoopData(USER_ID, startDate, endDate);

    let synced = 0;
    for (const day of data) {
      const date = new Date(day.date);
      await prisma.whoopDailyData.upsert({
        where: { userId_date: { userId: USER_ID, date } },
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
          userId: USER_ID,
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
