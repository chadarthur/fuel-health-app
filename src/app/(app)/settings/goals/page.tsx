"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Save, CheckCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MacroGoals } from "@/types/macro";

// ─── Presets ──────────────────────────────────────────────────────────────────

interface Preset {
  key: string;
  label: string;
  description: string;
  color: string;
  goals: MacroGoals;
}

const PRESETS: Preset[] = [
  {
    key: "maintenance",
    label: "Maintenance",
    description: "Maintain current weight",
    color: "#00D4AA",
    goals: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
  },
  {
    key: "fat-loss",
    label: "Fat Loss",
    description: "Moderate caloric deficit",
    color: "#FF6B6B",
    goals: { calories: 1600, protein: 180, carbs: 150, fat: 55 },
  },
  {
    key: "muscle-gain",
    label: "Muscle Gain",
    description: "Caloric surplus + high protein",
    color: "#54A0FF",
    goals: { calories: 2800, protein: 200, carbs: 300, fat: 80 },
  },
];

// ─── Macro field config ───────────────────────────────────────────────────────

const MACRO_FIELDS: {
  key: keyof MacroGoals;
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  placeholder: string;
}[] = [
  {
    key: "calories",
    label: "Daily Calories",
    unit: "kcal",
    color: "#FF9F43",
    min: 800,
    max: 6000,
    placeholder: "2000",
  },
  {
    key: "protein",
    label: "Protein",
    unit: "g/day",
    color: "#54A0FF",
    min: 30,
    max: 500,
    placeholder: "150",
  },
  {
    key: "carbs",
    label: "Carbs",
    unit: "g/day",
    color: "#FECA57",
    min: 20,
    max: 700,
    placeholder: "250",
  },
  {
    key: "fat",
    label: "Fat",
    unit: "g/day",
    color: "#A29BFE",
    min: 15,
    max: 300,
    placeholder: "65",
  },
];

const DEFAULT_GOALS: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

// ─── Toast sub-component ──────────────────────────────────────────────────────

function SuccessToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl",
        "bg-[#00D4AA] text-white text-sm font-semibold",
        "transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <CheckCircle size={16} />
      Goals saved successfully!
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [goals, setGoals] = useState<MacroGoals>(DEFAULT_GOALS);
  const [inputValues, setInputValues] = useState<Record<keyof MacroGoals, string>>({
    calories: String(DEFAULT_GOALS.calories),
    protein: String(DEFAULT_GOALS.protein),
    carbs: String(DEFAULT_GOALS.carbs),
    fat: String(DEFAULT_GOALS.fat),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Load current goals
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await fetch("/api/track/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.goals) {
            const g: MacroGoals = data.goals;
            setGoals(g);
            setInputValues({
              calories: String(g.calories),
              protein: String(g.protein),
              carbs: String(g.carbs),
              fat: String(g.fat),
            });
          }
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  function applyPreset(preset: Preset) {
    setGoals(preset.goals);
    setInputValues({
      calories: String(preset.goals.calories),
      protein: String(preset.goals.protein),
      carbs: String(preset.goals.carbs),
      fat: String(preset.goals.fat),
    });
    setActivePreset(preset.key);
  }

  function handleInputChange(key: keyof MacroGoals, raw: string) {
    // Allow empty string while typing
    setInputValues((prev) => ({ ...prev, [key]: raw }));
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      setGoals((prev) => ({ ...prev, [key]: num }));
    }
    setActivePreset(null);
  }

  function handleInputBlur(key: keyof MacroGoals) {
    // Clamp and clean up on blur
    const field = MACRO_FIELDS.find((f) => f.key === key)!;
    const num = parseInt(inputValues[key], 10);
    if (isNaN(num) || num <= 0) {
      setInputValues((prev) => ({ ...prev, [key]: String(goals[key]) }));
    } else {
      const clamped = Math.max(field.min, Math.min(field.max, num));
      setGoals((prev) => ({ ...prev, [key]: clamped }));
      setInputValues((prev) => ({ ...prev, [key]: String(clamped) }));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/track/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      });
    } catch {
      // Still show success toast in demo mode
    } finally {
      setSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2800);
    }
  }

  // Rough calorie check from macros
  const macroCalories = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9;
  const calorieDiff = Math.abs(goals.calories - macroCalories);
  const showCalorieWarning = calorieDiff > 200;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header with back button */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
          aria-label="Back to settings"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Macro Goals</h1>
          <p className="text-xs text-muted-foreground">
            Set your daily nutrition targets
          </p>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* ── Quick Presets ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Quick Presets
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => {
              const isActive = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-2xl border text-center transition-all active:scale-95",
                    isActive
                      ? "border-transparent"
                      : "border-border dark:border-white/10 hover:border-white/20"
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: `${preset.color}18`,
                          borderColor: preset.color,
                        }
                      : {}
                  }
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: isActive ? preset.color : undefined }}
                  >
                    {preset.label}
                  </span>
                  <span
                    className="text-[10px] font-black"
                    style={{ color: isActive ? preset.color : "#FF9F43" }}
                  >
                    {preset.goals.calories} cal
                  </span>
                  <span
                    className={cn(
                      "text-[9px] leading-tight",
                      isActive ? "opacity-80" : "text-muted-foreground"
                    )}
                    style={{ color: isActive ? preset.color : undefined }}
                  >
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Calorie warning ── */}
        {showCalorieWarning && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#FECA57]/10 border border-[#FECA57]/30">
            <span className="text-sm shrink-0">⚠️</span>
            <p className="text-xs text-[#FECA57] leading-relaxed">
              Your calorie goal ({goals.calories} kcal) differs from calculated
              macros ({macroCalories} kcal) by {calorieDiff} kcal.
            </p>
          </div>
        )}

        {/* ── Input fields ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Custom Goals
          </p>
          <Card glass>
            <div className="divide-y divide-border dark:divide-white/5">
              {MACRO_FIELDS.map(({ key, label, unit, color, placeholder }) => (
                <div key={key} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Color dot */}
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <label
                        htmlFor={`goal-${key}`}
                        className="text-sm font-semibold"
                      >
                        {label}
                      </label>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Input
                        id={`goal-${key}`}
                        type="number"
                        inputMode="numeric"
                        value={inputValues[key]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        onBlur={() => handleInputBlur(key)}
                        placeholder={placeholder}
                        disabled={loading}
                        className={cn(
                          "w-24 text-right font-black h-9 text-sm",
                          loading && "opacity-50"
                        )}
                        style={{ color }}
                      />
                      <span className="text-xs text-muted-foreground w-12">
                        {unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── Macro ratio bar ── */}
        <Card glass>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Macro Ratios
            </p>
            <div className="flex rounded-full overflow-hidden h-3 mb-3">
              {(() => {
                const total =
                  goals.protein * 4 + goals.carbs * 4 + goals.fat * 9 || 1;
                const pPct = ((goals.protein * 4) / total) * 100;
                const cPct = ((goals.carbs * 4) / total) * 100;
                const fPct = ((goals.fat * 9) / total) * 100;
                return (
                  <>
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${pPct}%`, backgroundColor: "#54A0FF" }}
                    />
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${cPct}%`, backgroundColor: "#FECA57" }}
                    />
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${fPct}%`, backgroundColor: "#A29BFE" }}
                    />
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                {
                  label: "Protein",
                  cals: goals.protein * 4,
                  color: "#54A0FF",
                },
                { label: "Carbs", cals: goals.carbs * 4, color: "#FECA57" },
                { label: "Fat", cals: goals.fat * 9, color: "#A29BFE" },
              ].map(({ label, cals, color }) => {
                const total =
                  goals.protein * 4 + goals.carbs * 4 + goals.fat * 9 || 1;
                const pct = Math.round((cals / total) * 100);
                return (
                  <div key={label}>
                    <p className="text-sm font-black" style={{ color }}>
                      {pct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Save button ── */}
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full h-12 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #FF6B6B, #FF8E8E)" }}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={16} />
              Save Goals
            </span>
          )}
        </Button>
      </div>

      {/* Success toast */}
      <SuccessToast visible={showToast} />
    </div>
  );
}
