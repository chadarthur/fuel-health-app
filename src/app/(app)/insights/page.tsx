"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhoopMetrics {
  recoveryScore: number;
  hrv: number;
  restingHr: number;
  strain: number;
  sleepHours: number;
}

// Shape returned by the /api/whoop endpoint (array of daily records)
interface WhoopDailyMetrics {
  id: string;
  date: string;
  recoveryScore: number;
  hrvRmssd: number;
  restingHr: number;
  strainScore: number;
  sleepScore: number;
  sleepHours: number;
  caloriesBurned: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRecoveryColor(score: number): string {
  if (score >= 67) return "#00D4AA";
  if (score >= 34) return "#FECA57";
  return "#FF6B6B";
}

function getRecoveryLabel(score: number): string {
  if (score >= 67) return "Green — Optimal";
  if (score >= 34) return "Yellow — Moderate";
  return "Red — Rest Day";
}

// ─── SWR fetcher ─────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("not ok");
    return res.json();
  });

// ─── Mock data for metric cards (fallback) ────────────────────────────────────

const MOCK_WHOOP_TODAY: WhoopMetrics = {
  recoveryScore: 72,
  hrv: 58,
  restingHr: 52,
  strain: 12.4,
  sleepHours: 7.2,
};

// ─── 30-day inline mock data for chart ───────────────────────────────────────

interface DayData {
  date: string;
  recovery: number;
  calories: number;
  protein: number;
  strain: number;
}

const MOCK_30_DAYS: DayData[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const label = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
  return {
    date: label,
    recovery: Math.min(100, Math.max(5, Math.round(45 + Math.sin(i * 0.4) * 25 + (i % 3) * 3))),
    calories: Math.round(1700 + Math.cos(i * 0.3) * 250 + (i % 5) * 40),
    protein: Math.round(110 + Math.sin(i * 0.5) * 35 + (i % 4) * 8),
    strain: parseFloat(
      Math.min(21, Math.max(1, 7 + Math.cos(i * 0.45) * 6 + (i % 3) * 1.5)).toFixed(1)
    ),
  };
});

// ─── Insight cards ────────────────────────────────────────────────────────────

const INSIGHTS = [
  {
    emoji: "💪",
    text: "Your recovery averages 12% higher on days with 150g+ protein",
    color: "#54A0FF",
  },
  {
    emoji: "😴",
    text: "You sleep 0.8 hours more when daily strain is below 10",
    color: "#00D4AA",
  },
  {
    emoji: "⚡️",
    text: "HRV peaks when calories stay within 200 of your goal",
    color: "#FF9F43",
  },
];

// ─── Recovery Gauge (semicircular SVG arc) ────────────────────────────────────

function RecoveryGauge({ score }: { score: number }) {
  const color = getRecoveryColor(score);
  const radius = 54;
  const strokeWidth = 10;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const startX = cx - radius;
  const endX = cx + radius;
  const arcY = cy;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="82" viewBox="0 0 140 82">
        {/* Track arc */}
        <path
          d={`M ${startX} ${arcY} A ${radius} ${radius} 0 0 1 ${endX} ${arcY}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${startX} ${arcY} A ${radius} ${radius} 0 0 1 ${endX} ${arcY}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        {/* Score number */}
        <text
          x={cx}
          y={arcY - 6}
          textAnchor="middle"
          fill={color}
          fontSize="26"
          fontWeight="900"
        >
          {score}
        </text>
        <text
          x={cx}
          y={arcY + 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize="10"
        >
          Recovery Score
        </text>
      </svg>
      <span className="text-xs font-bold mt-1" style={{ color }}>
        {getRecoveryLabel(score)}
      </span>
    </div>
  );
}

// ─── Custom Recharts tooltip ──────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: p.color }} className="font-bold">
            {p.name}:{" "}
            {typeof p.value === "number" && !Number.isInteger(p.value)
              ? p.value.toFixed(1)
              : Math.round(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Toggle options ───────────────────────────────────────────────────────────

type ChartMetric = "Recovery" | "Calories" | "Protein" | "Strain";

const METRIC_CONFIG: Record<ChartMetric, { key: keyof DayData; color: string }> = {
  Recovery: { key: "recovery", color: "#00D4AA" },
  Calories: { key: "calories", color: "#FF9F43" },
  Protein: { key: "protein", color: "#54A0FF" },
  Strain: { key: "strain", color: "#FECA57" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("Recovery");

  // Date range for API fetch (last 7 days)
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];

  const { data: whoopRaw } = useSWR<WhoopDailyMetrics[]>(
    `/api/whoop?startDate=${startDate}&endDate=${endDate}`,
    fetcher,
    { onErrorRetry: () => {} }
  );

  // API returns an array of daily records; take the most recent one
  const todayRaw = Array.isArray(whoopRaw) && whoopRaw.length > 0
    ? whoopRaw[whoopRaw.length - 1]
    : null;

  const metrics: WhoopMetrics = todayRaw
    ? {
        recoveryScore: todayRaw.recoveryScore,
        hrv: todayRaw.hrvRmssd,
        restingHr: todayRaw.restingHr,
        strain: todayRaw.strainScore,
        sleepHours: todayRaw.sleepHours,
      }
    : MOCK_WHOOP_TODAY;
  const recoveryColor = getRecoveryColor(metrics.recoveryScore);

  // Build chart data — always two lines: Recovery + selected metric
  const chartData = MOCK_30_DAYS.map((d) => ({
    date: d.date,
    Recovery: d.recovery,
    Calories: d.calories,
    Protein: d.protein,
    Strain: d.strain,
  }));

  const toggleMetrics: ChartMetric[] = ["Recovery", "Calories", "Protein", "Strain"];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Insights</h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FECA57]/15 text-[#FECA57]">
          Demo Data
        </span>
      </div>

      <div className="px-4 space-y-4">
        {/* Recovery Score — big card */}
        <Card glass>
          <CardContent className="pt-5 pb-5 flex flex-col items-center">
            <RecoveryGauge score={metrics.recoveryScore} />
          </CardContent>
        </Card>

        {/* Metric row: HRV, Resting HR, Strain, Sleep */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "HRV", value: metrics.hrv, unit: "ms", color: "#54A0FF" },
            { label: "Resting HR", value: metrics.restingHr, unit: "bpm", color: "#FF6B6B" },
            { label: "Strain", value: metrics.strain, unit: "", color: "#FECA57" },
            { label: "Sleep", value: metrics.sleepHours, unit: "h", color: "#A29BFE" },
          ].map(({ label, value, unit, color }) => (
            <Card key={label} glass>
              <CardContent className="pt-4 pb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                  {label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tabular-nums" style={{ color }}>
                    {typeof value === "number" && !Number.isInteger(value)
                      ? value.toFixed(1)
                      : value}
                  </span>
                  {unit && (
                    <span className="text-xs text-muted-foreground">{unit}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 30-Day Trends chart */}
        <Card glass>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                30-Day Trends
              </p>
              {/* 4 toggle buttons */}
              <div className="flex gap-1.5 flex-wrap">
                {toggleMetrics.map((metric) => {
                  const { color } = METRIC_CONFIG[metric];
                  const isActive = activeMetric === metric;
                  return (
                    <button
                      key={metric}
                      onClick={() => setActiveMetric(metric)}
                      className={cn(
                        "text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all",
                        isActive
                          ? "text-background"
                          : "bg-transparent text-muted-foreground border-border dark:border-white/10 hover:border-white/20"
                      )}
                      style={
                        isActive
                          ? { backgroundColor: color, borderColor: color }
                          : {}
                      }
                    >
                      {metric}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    interval={5}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* Always show selected metric as solid line */}
                  <Line
                    type="monotone"
                    dataKey={activeMetric}
                    stroke={METRIC_CONFIG[activeMetric].color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: METRIC_CONFIG[activeMetric].color }}
                  />
                  {/* Show Recovery as dashed when not active */}
                  {activeMetric !== "Recovery" && (
                    <Line
                      type="monotone"
                      dataKey="Recovery"
                      stroke="#00D4AA"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="4 3"
                      activeDot={{ r: 3, fill: "#00D4AA" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-0.5 rounded"
                  style={{ backgroundColor: METRIC_CONFIG[activeMetric].color }}
                />
                <span className="text-[10px] text-muted-foreground">{activeMetric}</span>
              </div>
              {activeMetric !== "Recovery" && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-0.5 rounded"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, #00D4AA 0px, #00D4AA 4px, transparent 4px, transparent 7px)",
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">Recovery</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Insight cards */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
            AI Insights
          </p>
          {INSIGHTS.map((insight) => (
            <Card key={insight.emoji} glass>
              <CardContent className="py-3.5 px-4">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0 mt-0.5">{insight.emoji}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
