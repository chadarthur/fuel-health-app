import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "demo-user";

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const period = searchParams.get("period");

    // Get user's macro goals
    const goalsRow = await prisma.macroGoal.findUnique({ where: { userId: USER_ID } });
    const goals = goalsRow
      ? { calories: goalsRow.calories, protein: goalsRow.protein, carbs: goalsRow.carbs, fat: goalsRow.fat }
      : DEFAULT_GOALS;

    if (period === "week" || period === "month") {
      const days = period === "week" ? 7 : 30;
      const dailyBreakdown = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(date);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];

        const start = new Date(dayStr); start.setHours(0, 0, 0, 0);
        const end = new Date(dayStr); end.setHours(23, 59, 59, 999);

        const meals = await prisma.mealEntry.findMany({
          where: { userId: USER_ID, loggedAt: { gte: start, lte: end } },
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

    // Single day summary
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const meals = await prisma.mealEntry.findMany({
      where: { userId: USER_ID, loggedAt: { gte: start, lte: end } },
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
