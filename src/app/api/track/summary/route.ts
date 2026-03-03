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
      const dailyBreakdown = [];

      for (let i = days - 1; i >= 0; i--) {
        // Step back i days from the anchor date using UTC to avoid DST issues
        const anchorMs = new Date(`${date}T00:00:00.000Z`).getTime();
        const dayMs = anchorMs - i * 24 * 60 * 60 * 1000;
        const d = new Date(dayMs);
        const dayStr = d.toISOString().split("T")[0];

        const { start, end } = getUtcDayRange(dayStr, tzOffset);

        const meals = await prisma.mealEntry.findMany({
          where: { userId, loggedAt: { gte: start, lte: end } },
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

        dailyBreakdown.push({ date: dayStr, ...totals });
      }

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
