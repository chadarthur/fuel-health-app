"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Camera, PenLine, MessageCircle, Search } from "lucide-react";
import { MealType } from "@/lib/constants";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockSummary = {
  date: new Date().toISOString().split("T")[0],
  totals: { calories: 1240, protein: 88, carbs: 142, fat: 38 },
  goals: { calories: 2000, protein: 150, carbs: 220, fat: 65 },
  meals: [
    {
      id: "1",
      name: "Greek Yogurt Parfait",
      mealType: "breakfast" as MealType,
      calories: 380,
      protein: 28,
      carbs: 46,
      fat: 8,
      source: "manual" as const,
      loggedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Grilled Chicken & Quinoa Bowl",
      mealType: "lunch" as MealType,
      calories: 620,
      protein: 48,
      carbs: 72,
      fat: 18,
      source: "photo" as const,
      loggedAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Protein Shake",
      mealType: "snack" as MealType,
      calories: 240,
      protein: 30,
      carbs: 24,
      fat: 4,
      source: "chat" as const,
      loggedAt: new Date().toISOString(),
    },
  ],
};

const mockWhoop = {
  recoveryScore: 78,
  strain: 14.2,
  sleepHours: 7.4,
  hrv: 62,
};

const mockWeeklyCalories = [
  { day: "Mon", calories: 1850, goal: 2000 },
  { day: "Tue", calories: 2100, goal: 2000 },
  { day: "Wed", calories: 1760, goal: 2000 },
  { day: "Thu", calories: 1980, goal: 2000 },
  { day: "Fri", calories: 2200, goal: 2000 },
  { day: "Sat", calories: 1640, goal: 2000 },
  { day: "Sun", calories: 1240, goal: 2000 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
          {consumed}
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
  const { totals, goals, meals } = mockSummary;
  const recoveryColor = getRecoveryColor(mockWhoop.recoveryScore);
  const maxCaloriesInWeek = Math.max(...mockWeeklyCalories.map((d) => d.calories));

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
              <MacroRing
                label="Calories"
                consumed={totals.calories}
                goal={goals.calories}
                unit="kcal"
                color="#FF9F43"
              />
              <MacroRing
                label="Protein"
                consumed={totals.protein}
                goal={goals.protein}
                unit="g"
                color="#54A0FF"
              />
              <MacroRing
                label="Carbs"
                consumed={totals.carbs}
                goal={goals.carbs}
                unit="g"
                color="#FECA57"
              />
              <MacroRing
                label="Fat"
                consumed={totals.fat}
                goal={goals.fat}
                unit="g"
                color="#A29BFE"
              />
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
                Demo
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* Recovery */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04]">
                <span
                  className="text-3xl font-black tabular-nums"
                  style={{ color: recoveryColor }}
                >
                  {mockWhoop.recoveryScore}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Recovery
                </span>
              </div>
              {/* Strain */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04]">
                <span className="text-3xl font-black tabular-nums text-foreground">
                  {mockWhoop.strain.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Strain
                </span>
              </div>
              {/* Sleep */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.04]">
                <span className="text-3xl font-black tabular-nums text-foreground">
                  {mockWhoop.sleepHours.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Sleep hrs
                </span>
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
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
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
            <div className="flex items-end gap-1.5 h-20">
              {mockWeeklyCalories.map(({ day, calories, goal }) => {
                const heightPct = (calories / maxCaloriesInWeek) * 100;
                const overGoal = calories > goal;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end h-14 relative">
                      {/* Goal line marker */}
                      <div
                        className="absolute w-full border-t border-dashed border-white/20"
                        style={{ bottom: `${(goal / maxCaloriesInWeek) * 100}%` }}
                      />
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all",
                          overGoal
                            ? "bg-[#FF6B6B]/70"
                            : "bg-gradient-to-t from-[#FF9F43]/80 to-[#FF9F43]/40"
                        )}
                        style={{ height: `${heightPct}%` }}
                      />
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
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Meals ── */}
      <div className="mx-4 mt-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Recent Meals
          </p>
          <Link
            href="/track/history"
            className="text-xs text-[#FF6B6B] font-medium hover:opacity-80"
          >
            See all
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {meals.map((meal) => (
            <Card key={meal.id} glass className="overflow-hidden">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">{meal.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            mealTypeBadgeColors[meal.mealType]
                          )}
                        >
                          {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            sourceBadgeColors[meal.source]
                          )}
                        >
                          {meal.source}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-base font-black" style={{ color: "#FF9F43" }}>
                      {meal.calories}
                    </span>
                    <span className="text-xs text-muted-foreground ml-0.5">kcal</span>
                    <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span>P {meal.protein}g</span>
                      <span>C {meal.carbs}g</span>
                      <span>F {meal.fat}g</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
