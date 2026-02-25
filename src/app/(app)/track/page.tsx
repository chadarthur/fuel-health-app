"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, MessageCircle, PenLine, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MealEntryData, DailySummary } from "@/types/macro";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SUMMARY: DailySummary = {
  date: new Date().toISOString().split("T")[0],
  totals: { calories: 1240, protein: 88, carbs: 142, fat: 38 },
  goals: { calories: 2000, protein: 150, carbs: 220, fat: 65 },
  meals: [
    {
      id: "1",
      name: "Greek Yogurt Parfait",
      mealType: "breakfast",
      calories: 380,
      protein: 28,
      carbs: 46,
      fat: 8,
      source: "manual",
      loggedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "2",
      name: "Grilled Chicken & Quinoa Bowl",
      mealType: "lunch",
      calories: 620,
      protein: 48,
      carbs: 72,
      fat: 18,
      source: "photo",
      loggedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      name: "Protein Shake",
      mealType: "snack",
      calories: 240,
      protein: 30,
      carbs: 24,
      fat: 4,
      source: "chat",
      loggedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
};

const MACRO_CONFIG = [
  { key: "calories" as const, label: "Calories", unit: "kcal", color: "#FF9F43" },
  { key: "protein" as const, label: "Protein", unit: "g", color: "#54A0FF" },
  { key: "carbs" as const, label: "Carbs", unit: "g", color: "#FECA57" },
  { key: "fat" as const, label: "Fat", unit: "g", color: "#A29BFE" },
];

const sourceBadge: Record<MealEntryData["source"], { label: string; color: string }> = {
  photo: { label: "📸 Photo", color: "#FF6B6B" },
  chat: { label: "💬 Chat", color: "#00D4AA" },
  text: { label: "✍️ Text", color: "#FECA57" },
  manual: { label: "✋ Manual", color: "rgba(255,255,255,0.4)" },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackPage() {
  const [summary, setSummary] = useState<DailySummary>(MOCK_SUMMARY);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textEntry, setTextEntry] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/track/summary?date=${new Date().toISOString().split("T")[0]}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch {}
    };
    fetchSummary();
  }, []);

  async function handleTextLog() {
    if (!textEntry.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/track/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textEntry }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary((prev) => ({
          ...prev,
          meals: [
            ...prev.meals,
            {
              id: Date.now().toString(),
              name: textEntry,
              mealType: "snack",
              calories: data.calories ?? 0,
              protein: data.protein ?? 0,
              carbs: data.carbs ?? 0,
              fat: data.fat ?? 0,
              source: "text",
              loggedAt: new Date().toISOString(),
            },
          ],
          totals: {
            calories: prev.totals.calories + (data.calories ?? 0),
            protein: prev.totals.protein + (data.protein ?? 0),
            carbs: prev.totals.carbs + (data.carbs ?? 0),
            fat: prev.totals.fat + (data.fat ?? 0),
          },
        }));
        setTextEntry("");
        setShowTextInput(false);
      }
    } catch {}
    setAnalyzing(false);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-2">
        <h1 className="text-2xl font-bold">Track</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Macro progress bars */}
      <div className="mx-4 mt-4">
        <Card glass>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Today&apos;s Macros
            </p>
            <div className="space-y-3.5">
              {MACRO_CONFIG.map(({ key, label, unit, color }) => {
                const consumed = summary.totals[key];
                const goal = summary.goals[key];
                const pct = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" style={{ color }}>
                        {label}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black tabular-nums" style={{ color }}>
                          {consumed}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {goal} {unit}
                        </span>
                        <span
                          className="text-[10px] font-bold ml-1 px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action cards */}
      <div className="mx-4 mt-4 grid grid-cols-1 gap-3">
        {/* Snap a Photo */}
        <Link href="/track/photo">
          <Card className="overflow-hidden tap-scale card-glow">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF6B6B40, #FF6B6B20)" }}
                >
                  <Camera size={22} style={{ color: "#FF6B6B" }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold">Snap a Photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI identifies food from your camera
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Chat with AI */}
        <Link href="/track/chat">
          <Card className="overflow-hidden tap-scale card-glow">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #00D4AA40, #00D4AA20)" }}
                >
                  <MessageCircle size={22} style={{ color: "#00D4AA" }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold">Chat with AI</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Describe what you ate in natural language
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Log by Text */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => setShowTextInput((s) => !s)}
              className="w-full flex items-center gap-4 p-4 tap-scale"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #54A0FF40, #54A0FF20)" }}
              >
                <PenLine size={22} style={{ color: "#54A0FF" }} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold">Log by Text</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Type your meal and AI calculates macros
                </p>
              </div>
              <ChevronRight
                size={16}
                className={cn(
                  "text-muted-foreground transition-transform",
                  showTextInput && "rotate-90"
                )}
              />
            </button>

            {showTextInput && (
              <div className="px-4 pb-4 space-y-2 border-t border-border dark:border-white/5">
                <textarea
                  value={textEntry}
                  onChange={(e) => setTextEntry(e.target.value)}
                  placeholder="E.g. 2 scrambled eggs with toast and a coffee with oat milk..."
                  rows={3}
                  className="w-full mt-3 px-3 py-2.5 rounded-xl bg-muted/50 text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-[#54A0FF]/40 border border-border dark:border-white/5"
                />
                <Button
                  onClick={handleTextLog}
                  disabled={!textEntry.trim() || analyzing}
                  className="w-full"
                  style={{ background: "linear-gradient(135deg, #54A0FF, #7B8DE8)" }}
                >
                  {analyzing ? "Analyzing..." : "Log Meal"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's meal log */}
      <div className="mx-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Today&apos;s Meals
          </p>
          <Link
            href="/track/history"
            className="text-xs text-[#FF6B6B] font-semibold hover:opacity-80"
          >
            History
          </Link>
        </div>

        {summary.meals.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No meals logged yet today. Start tracking!
          </div>
        ) : (
          <div className="space-y-2">
            {summary.meals.map((meal) => {
              const src = sourceBadge[meal.source];
              return (
                <Card key={meal.id} glass>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold truncate">{meal.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${src.color}20`, color: src.color }}
                          >
                            {src.label}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock size={9} />
                            {formatRelativeTime(meal.loggedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-base font-black" style={{ color: "#FF9F43" }}>
                          {meal.calories}
                        </span>
                        <span className="text-xs text-muted-foreground ml-0.5">kcal</span>
                        <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
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
        )}
      </div>
    </div>
  );
}
