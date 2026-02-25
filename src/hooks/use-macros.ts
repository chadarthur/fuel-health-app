"use client";

import useSWR, { mutate } from "swr";
import type { DailySummary, MealEntryInput } from "@/types/macro";
import { getToday } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDailyMacros(date?: string) {
  const d = date || getToday();
  const { data, error, isLoading } = useSWR<DailySummary>(
    `/api/track/summary?date=${d}`,
    fetcher
  );
  return { summary: data, error, isLoading };
}

export function useWeeklyMacros(date?: string) {
  const d = date || getToday();
  const { data, error, isLoading } = useSWR<DailySummary[]>(
    `/api/track/summary?period=week&date=${d}`,
    fetcher
  );
  return { weeks: data, error, isLoading };
}

export async function logMeal(meal: MealEntryInput & { mealType: "breakfast"|"lunch"|"dinner"|"snack" }) {
  const res = await fetch("/api/track/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meal),
  });
  if (!res.ok) throw new Error("Failed to log meal");
  await mutate((key: string) => key.startsWith("/api/track/"), undefined, { revalidate: true });
  return res.json();
}

export async function deleteMeal(id: string) {
  const res = await fetch(`/api/track/meals?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete meal");
  await mutate((key: string) => key.startsWith("/api/track/"), undefined, { revalidate: true });
}
