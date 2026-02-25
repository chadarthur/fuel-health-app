import type { WhoopDailyMetrics } from "@/types/whoop";

// Simple seeded pseudo-random number for deterministic mock data
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function dateToSeed(dateStr: string): number {
  return dateStr.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function generateMockDay(dateStr: string): WhoopDailyMetrics {
  const seed = dateToSeed(dateStr);
  const r = (offset: number) => seededRandom(seed + offset);

  const recoveryScore = Math.round(30 + r(1) * 65);
  const strainScore = Math.round((4 + r(2) * 14) * 10) / 10;
  const sleepHours = Math.round((5.5 + r(3) * 3.5) * 10) / 10;

  return {
    id: `mock-${dateStr}`,
    date: dateStr,
    recoveryScore,
    hrvRmssd: Math.round(35 + r(4) * 75),
    restingHr: Math.round(48 + r(5) * 20),
    strainScore,
    sleepScore: Math.round(40 + r(6) * 55),
    sleepHours,
    caloriesBurned: Math.round(1600 + r(7) * 1600),
  };
}

function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  while (current <= end) {
    days.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export async function getWhoopData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WhoopDailyMetrics[]> {
  const isMock = process.env.WHOOP_MOCK_MODE === "true" || !process.env.WHOOP_CLIENT_ID;

  if (isMock) {
    const days = getDaysInRange(startDate, endDate);
    return days.map((d) => generateMockDay(d));
  }

  // TODO: Implement real Whoop API calls with OAuth tokens
  // const token = await getWhoopToken(userId);
  // const res = await fetch(`https://api.prod.whoop.com/developer/v1/recovery/...`);
  console.log(`Real Whoop API not yet implemented for user ${userId}`);
  return [];
}

export function getLast30DaysRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}
