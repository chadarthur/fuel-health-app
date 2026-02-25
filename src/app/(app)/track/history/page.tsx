"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MealEntryData } from "@/types/macro";
import { type MealType } from "@/lib/constants";

// ─── Mock data fallback ───────────────────────────────────────────────────────

function getMockMealsForDate(date: Date): MealEntryData[] {
  const day = date.getDay();
  const d = new Date(date);
  const base: MealEntryData[] = [
    {
      id: "h-1",
      name: "Oatmeal with Berries",
      mealType: "breakfast",
      calories: 340,
      protein: 12,
      carbs: 58,
      fat: 7,
      source: "manual",
      loggedAt: new Date(new Date(d).setHours(8, 30, 0, 0)).toISOString(),
    },
    {
      id: "h-2",
      name: "Grilled Chicken Caesar Salad",
      mealType: "lunch",
      calories: 480,
      protein: 42,
      carbs: 18,
      fat: 22,
      source: "photo",
      loggedAt: new Date(new Date(d).setHours(12, 45, 0, 0)).toISOString(),
    },
    {
      id: "h-3",
      name: "Protein Bar",
      mealType: "snack",
      calories: 200,
      protein: 20,
      carbs: 22,
      fat: 6,
      source: "manual",
      loggedAt: new Date(new Date(d).setHours(15, 0, 0, 0)).toISOString(),
    },
    {
      id: "h-4",
      name: "Salmon with Roasted Vegetables",
      mealType: "dinner",
      calories: 620,
      protein: 48,
      carbs: 35,
      fat: 28,
      source: "chat",
      loggedAt: new Date(new Date(d).setHours(19, 0, 0, 0)).toISOString(),
    },
  ];
  // Weekends skip dinner for variety
  return day === 0 || day === 6 ? base.slice(0, 3) : base;
}

// ─── SWR fetcher ─────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("not ok");
    return res.json();
  });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateHeader(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - today.getTime()) / 86400000;
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const mealTypeConfig: Record<
  MealType,
  { label: string; emoji: string; color: string }
> = {
  breakfast: { label: "Breakfast", emoji: "🌅", color: "#FF9F43" },
  lunch: { label: "Lunch", emoji: "🥗", color: "#54A0FF" },
  dinner: { label: "Dinner", emoji: "🍽️", color: "#A29BFE" },
  snack: { label: "Snacks", emoji: "🍎", color: "#00D4AA" },
};

const sourceBadgeConfig: Record<
  MealEntryData["source"],
  { label: string; bg: string; text: string }
> = {
  photo: { label: "photo", bg: "#FF6B6B15", text: "#FF6B6B" },
  chat: { label: "chat", bg: "#00D4AA15", text: "#00D4AA" },
  text: { label: "text", bg: "#FECA5715", text: "#FECA57" },
  manual: { label: "manual", bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.5)" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = currentDate.getTime() === today.getTime();
  const isFuture = currentDate.getTime() > today.getTime();

  const dateStr = toDateString(currentDate);

  const { data, isLoading } = useSWR(
    `/api/track/meals?date=${dateStr}`,
    fetcher,
    {
      onErrorRetry: () => {},
    }
  );

  // Use API data if available, otherwise fall back to mock data
  const meals: MealEntryData[] =
    data?.meals ?? getMockMealsForDate(new Date(currentDate));

  const groupedMeals = MEAL_ORDER.reduce<Record<MealType, MealEntryData[]>>(
    (acc, type) => {
      acc[type] = meals.filter((m) => m.mealType === type);
      return acc;
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] }
  );

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky date navigation */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border dark:border-white/5 px-4 py-4">
        <h1 className="text-xl font-bold mb-3">Meal History</h1>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentDate((d) => addDays(d, -1))}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-sm font-bold">{formatDateHeader(currentDate)}</span>
            {!isToday && (
              <span className="text-xs text-muted-foreground">
                {currentDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>

          <button
            onClick={() => setCurrentDate((d) => addDays(d, 1))}
            disabled={isFuture}
            aria-label="Next day"
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              isFuture
                ? "opacity-30 cursor-not-allowed"
                : "bg-muted hover:bg-muted/80 active:scale-95"
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Loading spinner */}
      {isLoading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-[#FF6B6B] border-t-transparent animate-spin" />
        </div>
      ) : meals.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-3xl">
            📋
          </div>
          <h3 className="text-lg font-bold mb-2">No meals logged</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isToday
              ? "Start tracking your meals today!"
              : "Nothing was logged for this day."}
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">
          {/* Day macro totals */}
          <Card glass className="border-gradient">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Day Total
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Calories", value: totals.calories, unit: "kcal", color: "#FF9F43" },
                  { label: "Protein", value: totals.protein, unit: "g", color: "#54A0FF" },
                  { label: "Carbs", value: totals.carbs, unit: "g", color: "#FECA57" },
                  { label: "Fat", value: totals.fat, unit: "g", color: "#A29BFE" },
                ].map(({ label, value, unit, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center py-3 px-2 rounded-xl"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <span
                      className="text-lg font-black tabular-nums leading-none"
                      style={{ color }}
                    >
                      {value}
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-1">{unit}</span>
                    <span className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meal groups */}
          {MEAL_ORDER.map((mealType) => {
            const typeMeals = groupedMeals[mealType];
            if (typeMeals.length === 0) return null;

            const { label, emoji, color } = mealTypeConfig[mealType];
            const groupCalories = typeMeals.reduce((sum, m) => sum + m.calories, 0);

            return (
              <div key={mealType} className="space-y-2">
                {/* Group header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <span className="text-sm font-bold">{label}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {groupCalories} kcal
                  </span>
                </div>

                {/* Meal entry cards */}
                {typeMeals.map((meal) => {
                  const src = sourceBadgeConfig[meal.source];
                  return (
                    <Card key={meal.id} glass>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate mb-1.5">
                              {meal.name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Source badge */}
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: src.bg,
                                  color: src.text,
                                }}
                              >
                                {src.label}
                              </span>
                              {/* Time */}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(meal.loggedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Macro values */}
                          <div className="text-right shrink-0">
                            <div className="flex items-baseline gap-0.5 justify-end">
                              <span
                                className="text-base font-black tabular-nums"
                                style={{ color: "#FF9F43" }}
                              >
                                {meal.calories}
                              </span>
                              <span className="text-xs text-muted-foreground">kcal</span>
                            </div>
                            <div className="flex gap-2 mt-0.5 text-[10px]">
                              <span style={{ color: "#54A0FF" }}>P {meal.protein}g</span>
                              <span style={{ color: "#FECA57" }}>C {meal.carbs}g</span>
                              <span style={{ color: "#A29BFE" }}>F {meal.fat}g</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
