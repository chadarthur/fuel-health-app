"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Camera, PenLine, MessageCircle, Search } from "lucide-react";
import { MealType } from "@/lib/constants";

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ────────────────────────────────────────────────────────────────────

interface DaySummary {
  date: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  goals: { calories: number; protein: number; carbs: number; fat: number };
  meals: {
    id: string;
    name: string;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    source: string;
    loggedAt: string;
  }[];
}

interface WeeklySummary {
  goals: { calories: number };
  dailyBreakdown: { date: string; calories: number }[];
}

interface WhoopMetrics {
  recoveryScore: number;
  strainScore: number;
  sleepHours: number;
  hrvRmssd: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning, let's fuel up! 👋";
  if (hour < 17) return "Good afternoon, keep crushing it! 👋";
  return "Good evening, time to recover! 👋";
}

function getRecoveryColor(score: number): string {
  if (score >= 67) return "#00D4AA";
  if (score >= 34) return "#FECA57";
  return "#FF6B6B";
}

function getMacroPercentage(consumed: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(Math.round((consumed / goal) * 100), 100);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MacroRingProps {
  label: string;
  consumed: number;
  goal: number;
  unit: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

function MacroRing({
  label,
  consumed,
  goal,
  unit,
  color,
  size = 80,
  strokeWidth = 7,
}: MacroRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = getMacroPercentage(consumed, goal);
  const offset = circumference - (pct / 100) * circumference;
  const cx = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold leading-none" style={{ color }}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground/90">{label}</p>
        <p className="text-xs text-muted-foreground">
          {Math.round(consumed)}
          <span className="opacity-60">/{goal}</span>
          <span className="ml-0.5 opacity-60">{unit}</span>
        </p>
      </div>
    </div>
  );
}

const mealTypeBadgeColors: Record<MealType, string> = {
  breakfast: "bg-[#FF9F43]/20 text-[#FF9F43]",
  lunch: "bg-[#54A0FF]/20 text-[#54A0FF]",
  dinner: "bg-[#A29BFE]/20 text-[#A29BFE]",
  snack: "bg-[#00D4AA]/20 text-[#00D4AA]",
};

const sourceBadgeColors: Record<string, string> = {
  photo: "bg-[#FF6B6B]/15 text-[#FF6B6B]",
  chat: "bg-[#00D4AA]/15 text-[#00D4AA]",
  manual: "bg-white/10 text-white/60",
  text: "bg-[#FECA57]/15 text-[#FECA57]",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = getToday();
  const { startDate, endDate } = getDateRange(7);

  // Real data
  const { data: summary } = useSWR<DaySummary>(
    `/api/track/summary?date=${today}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: weekly } = useSWR<WeeklySummary>(
    `/api/track/summary?period=week&date=${today}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: whoopRaw } = useSWR<WhoopMetrics[]>(
    `/api/whoop?startDate=${startDate}&endDate=${endDate}`,
    fetcher,
    { onErrorRetry: () => {} }
  );

  // Derived values
  const totals = summary?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goals = summary?.goals ?? { calories: 2000, protein: 150, carbs: 250, fat: 65 };
  const meals = summary?.meals ?? [];

  const weeklyData =
    weekly?.dailyBreakdown?.map((d) => ({
      day: DAY_LABELS[new Date(d.date + "T12:00:00").getDay()],
      calories: d.calories,
      goal: weekly.goals?.calories ?? goals.calories,
    })) ?? [];

  const maxCalories = Math.max(...weeklyData.map((d) => d.calories), goals.calories, 1);

  const whoop = Array.isArray(whoopRaw) && whoopRaw.length > 0
    ? whoopRaw[whoopRaw.length - 1]
    : null;

  const recoveryColor = getRecoveryColor(whoop?.recoveryScore ?? 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Header ── */}
      <div className="px-4 pt-8 pb-2">
        <p className="text-muted-foreground text-sm font-medium mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
      </div>

      {/* ── Hero Macro Rings ── */}
      <div className="mx-4 mt-4">
        <Card glass className="border-gradient overflow-hidden">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
              Today&apos;s Macros
            </p>
            <div className="grid grid-cols-4 gap-2">
              <MacroRing label="Calories" consumed={totals.calories} goal={goals.calories} unit="kcal" color="#FF9F43" />
              <MacroRing label="Protein" consumed={totals.protein} goal={goals.protein} unit="g" color="#54A0FF" />
              <MacroRing label="Carbs" consumed={totals.carbs} goal={goals.carbs} unit="g" color="#FECA57" />
              <MacroRing label="Fat" consumed={totals.fat} goal={goals.fat} unit="g" color="#A29BFE" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Whoop Snapshot ── */}
      <div className="mx-4 mt-3">
        <Card glass className="overflow-hidden">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Whoop
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D4AA]/15 text-[#00D4AA] font-medium">
                {whoop ? "Live" : "Demo"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04]">
                <span className="text-3xl font-black tabular-nums" style={{ color: recoveryColor }}>
                  {whoop?.recoveryScore ?? "–"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-medium">Recovery</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04]">
                <span className="text-3xl font-black tabular-nums text-foreground">
                  {whoop ? whoop.strainScore.toFixed(1) : "–"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-medium">Strain</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04]">
                <span className="text-3xl font-black tabular-nums text-foreground">
                  {whoop ? whoop.sleepHours.toFixed(1) : "–"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-medium">Sleep hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Add Bar ── */}
      <div className="mx-4 mt-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Camera, label: "Photo", href: "/track/photo", color: "#FF6B6B" },
            { icon: PenLine, label: "Text", href: "/track", color: "#54A0FF" },
            { icon: MessageCircle, label: "Chat", href: "/track/chat", color: "#00D4AA" },
            { icon: Search, label: "Recipes", href: "/recipes", color: "#FECA57" },
          ].map(({ icon: Icon, label, href, color }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card border border-border dark:border-white/5 hover:border-white/10 transition-colors tap-scale">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Weekly Trend ── */}
      <div className="mx-4 mt-3">
        <Card glass>
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              7-Day Calories
            </p>
            {weeklyData.length > 0 ? (
              <>
                <div className="flex items-end gap-1.5 h-20">
                  {weeklyData.map(({ day, calories, goal }, i) => {
                    const heightPct = (calories / maxCalories) * 100;
                    const overGoal = calories > goal;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end h-14 relative">
                          <div
                            className="absolute w-full border-t border-dashed border-white/20"
                            style={{ bottom: `${(goal / maxCalories) * 100}%` }}
                          />
                          {calories > 0 && (
                            <div
                              className={cn(
                                "w-full rounded-t-md transition-all",
                                overGoal
                                  ? "bg-[#FF6B6B]/70"
                                  : "bg-gradient-to-t from-[#FF9F43]/80 to-[#FF9F43]/40"
                              )}
                              style={{ height: `${Math.max(heightPct, 4)}%` }}
                            />
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground font-medium">{day}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF9F43]/80" />
                    <span className="text-[10px] text-muted-foreground">Consumed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B6B]/70" />
                    <span className="text-[10px] text-muted-foreground">Over goal</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-3 border-t border-dashed border-white/30" />
                    <span className="text-[10px] text-muted-foreground">Goal</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Start logging meals to see your weekly trend
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Meals ── */}
      <div className="mx-4 mt-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Recent Meals
          </p>
          <Link href="/track/history" className="text-xs text-[#FF6B6B] font-medium hover:opacity-80">
            See all
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {meals.length === 0 ? (
            <Card glass>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No meals logged today</p>
                <Link href="/track" className="text-xs text-[#FF6B6B] font-medium mt-1 block hover:opacity-80">
                  Log your first meal →
                </Link>
              </CardContent>
            </Card>
          ) : (
            meals.slice(0, 5).map((meal) => (
              <Card key={meal.id} glass className="overflow-hidden">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">{meal.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", mealTypeBadgeColors[meal.mealType])}>
                            {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                          </span>
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", sourceBadgeColors[meal.source])}>
                            {meal.source}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-base font-black" style={{ color: "#FF9F43" }}>
                        {Math.round(meal.calories)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-0.5">kcal</span>
                      <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>P {Math.round(meal.protein)}g</span>
                        <span>C {Math.round(meal.carbs)}g</span>
                        <span>F {Math.round(meal.fat)}g</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
