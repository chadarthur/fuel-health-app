import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals = 0): string {
  return num.toFixed(decimals);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMacroPercentage(consumed: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(Math.round((consumed / goal) * 100), 100);
}

export function getRecoveryColor(score: number): string {
  if (score >= 67) return "#00D4AA";
  if (score >= 34) return "#FECA57";
  return "#FF6B6B";
}

export function getRecoveryLabel(score: number): string {
  if (score >= 67) return "Green";
  if (score >= 34) return "Yellow";
  return "Red";
}
