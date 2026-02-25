"use client";

import useSWR from "swr";
import type { WhoopDailyMetrics, WhoopCorrelationData } from "@/types/whoop";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useWhoopData(startDate?: string, endDate?: string) {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toISOString().split("T")[0];

  const start = startDate || thirtyDaysAgo;
  const end = endDate || today;

  const { data, error, isLoading, mutate } = useSWR<WhoopDailyMetrics[]>(
    `/api/whoop?startDate=${start}&endDate=${end}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  async function syncWhoop() {
    await fetch("/api/whoop/sync", { method: "POST" });
    mutate();
  }

  const latest = data?.[data.length - 1];

  return { data, latest, error, isLoading, syncWhoop };
}

// Combines Whoop data with macro data for correlation charts
export function useCorrelationData(): {
  data: WhoopCorrelationData[];
  isLoading: boolean;
} {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toISOString().split("T")[0];

  const { data: whoop, isLoading: wLoading } = useSWR<WhoopDailyMetrics[]>(
    `/api/whoop?startDate=${thirtyDaysAgo}&endDate=${today}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: macros, isLoading: mLoading } = useSWR<{ dailyBreakdown: { date: string; calories: number; protein: number; carbs: number; fat: number }[] }>(
    `/api/track/summary?period=month&date=${today}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!whoop || !macros?.dailyBreakdown) {
    return { data: [], isLoading: wLoading || mLoading };
  }

  const macroByDate = new Map(macros.dailyBreakdown.map((d) => [d.date, d]));

  const merged: WhoopCorrelationData[] = whoop.map((w) => {
    const dateStr = typeof w.date === "string" ? w.date.split("T")[0] : w.date;
    const m = macroByDate.get(dateStr) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      date: dateStr,
      recoveryScore: w.recoveryScore,
      strainScore: w.strainScore,
      sleepScore: w.sleepScore,
      hrvRmssd: w.hrvRmssd,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
    };
  });

  return { data: merged, isLoading: wLoading || mLoading };
}
