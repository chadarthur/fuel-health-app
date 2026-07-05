import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getUtcDayRange } from "@/lib/date-utils";

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const period = searchParams.get("period");
    // Client sends getTimezoneOffset() — positive = west of UTC (e.g. EST=300), negative = east
    const tzOffset = parseInt(searchParams.get("tz") ?? "0", 10);

    const goalsRow = await prisma.macroGoal.findUnique({ where: { userId } });
    const goals = goalsRow
      ? { calories: goalsRow.calories, protein: goalsRow.protein, carbs: goalsRow.carbs, fat: goalsRow.fat }
      : DEFAULT_GOALS;

    if (period === "week" || period === "month") {
      const days = period === "week" ? 7 : 30;
      const anchorMs = new Date(`${date}T00:00:00.000Z`).getTime();
      const dayMs = 24 * 60 * 60 * 1000;

      // One query covering the whole range, then bucket meals by local day
      const firstDayStr = new Date(anchorMs - (days - 1) * dayMs).toISOString().split("T")[0];
      const { start: rangeStart } = getUtcDayRange(firstDayStr, tzOffset);
      const { end: rangeEnd } = getUtcDayRange(date, tzOffset);

      const meals = await prisma.mealEntry.findMany({
        where: { userId, loggedAt: { gte: rangeStart, lte: rangeEnd } },
        select: { loggedAt: true, calories: true, protein: true, carbs: true, fat: true },
      });

      const buckets = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
      for (let i = 0; i < days; i++) {
        const dayStr = new Date(anchorMs - (days - 1 - i) * dayMs).toISOString().split("T")[0];
        buckets.set(dayStr, { calories: 0, protein: 0, carbs: 0, fat: 0 });
      }

      for (const m of meals) {
        // Shift the UTC timestamp back to the user's local day
        const localDayStr = new Date(m.loggedAt.getTime() - tzOffset * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const bucket = buckets.get(localDayStr);
        if (!bucket) continue;
        bucket.calories += m.calories;
        bucket.protein += m.protein;
        bucket.carbs += m.carbs;
        bucket.fat += m.fat;
      }

      const dailyBreakdown = Array.from(buckets.entries()).map(([dayStr, totals]) => ({
        date: dayStr,
        ...totals,
      }));

      return NextResponse.json({ period, date, goals, dailyBreakdown });
    }

    const { start, end } = getUtcDayRange(date, tzOffset);

    const meals = await prisma.mealEntry.findMany({
      where: { userId, loggedAt: { gte: start, lte: end } },
      orderBy: { loggedAt: "asc" },
    });

    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return NextResponse.json({
      date,
      totals,
      goals,
      meals: meals.map((m) => ({
        ...m,
        loggedAt: m.loggedAt.toISOString(),
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
