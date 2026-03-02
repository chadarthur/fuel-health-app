import { prisma } from "@/lib/prisma";
import type { WhoopDailyMetrics } from "@/types/whoop";

// ─── Mock data (used when no token is present or WHOOP_MOCK_MODE=true) ────────

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

  return {
    id: `mock-${dateStr}`,
    date: dateStr,
    recoveryScore: Math.round(30 + r(1) * 65),
    hrvRmssd: Math.round(35 + r(4) * 75),
    restingHr: Math.round(48 + r(5) * 20),
    strainScore: Math.round((4 + r(2) * 14) * 10) / 10,
    sleepScore: Math.round(40 + r(6) * 55),
    sleepHours: Math.round((5.5 + r(3) * 3.5) * 10) / 10,
    caloriesBurned: Math.round(1600 + r(7) * 1600),
  };
}

function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    days.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// ─── Token management ─────────────────────────────────────────────────────────

const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

async function refreshWhoopToken(userId: string, refreshToken: string): Promise<string | null> {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) return null;

    const tokens = await res.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.whoopToken.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? refreshToken,
        expiresAt,
      },
    });

    return tokens.access_token as string;
  } catch {
    return null;
  }
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  const record = await prisma.whoopToken.findUnique({ where: { userId } });
  if (!record) return null;

  // Refresh 5 minutes before expiry
  const bufferMs = 5 * 60 * 1000;
  if (record.expiresAt.getTime() - Date.now() < bufferMs) {
    return refreshWhoopToken(userId, record.refreshToken);
  }

  return record.accessToken;
}

// ─── WHOOP API helpers ────────────────────────────────────────────────────────

const WHOOP_API = "https://api.prod.whoop.com/developer/v2";

interface WhoopRecoveryRecord {
  cycle_id: string; // UUID in v2
  score_state: string;
  score?: {
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
  };
}

interface WhoopCycleRecord {
  id: string; // UUID in v2
  start: string;
  score_state: string;
  score?: {
    strain: number;
    kilojoule: number;
  };
}

interface WhoopSleepRecord {
  id: string; // UUID in v2
  start: string;
  end: string;
  nap: boolean;
  score_state: string;
  score?: {
    sleep_performance_percentage: number;
  };
}

async function fetchAllPages<T>(
  token: string,
  endpoint: string,
  params: URLSearchParams
): Promise<T[]> {
  const results: T[] = [];
  let nextToken: string | undefined;

  do {
    if (nextToken) params.set("nextToken", nextToken);
    const url = `${WHOOP_API}${endpoint}?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) break;

    const data = await res.json();
    results.push(...(data.records ?? []));
    nextToken = data.next_token;
  } while (nextToken);

  return results;
}

async function fetchRealWhoopData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WhoopDailyMetrics[]> {
  const token = await getValidAccessToken(userId);
  if (!token) return [];

  // WHOOP uses ISO 8601 datetime strings
  const start = new Date(`${startDate}T00:00:00.000Z`).toISOString();
  const end = new Date(`${endDate}T23:59:59.999Z`).toISOString();

  const params = new URLSearchParams({ start, end, limit: "25" });

  const [recoveries, cycles, sleeps] = await Promise.all([
    fetchAllPages<WhoopRecoveryRecord>(token, "/recovery/", new URLSearchParams(params)),
    fetchAllPages<WhoopCycleRecord>(token, "/cycle/", new URLSearchParams(params)),
    fetchAllPages<WhoopSleepRecord>(token, "/activity/sleep/", new URLSearchParams(params)),
  ]);

  // Build a map keyed by date (YYYY-MM-DD)
  const byDate: Record<string, Partial<WhoopDailyMetrics>> = {};

  for (const cycle of cycles) {
    if (cycle.score_state !== "SCORED" || !cycle.score) continue;
    const date = cycle.start.split("T")[0];
    byDate[date] = {
      ...byDate[date],
      date,
      id: `whoop-${date}`,
      strainScore: Math.round(cycle.score.strain * 10) / 10,
      caloriesBurned: cycle.score.kilojoule
        ? Math.round(cycle.score.kilojoule / 4.184)
        : undefined,
    };
  }

  for (const recovery of recoveries) {
    if (recovery.score_state !== "SCORED" || !recovery.score) continue;
    // Recovery is tied to a cycle — we'll match by cycle_id, but we don't have
    // cycle start here, so we search the cycles array
    const cycle = cycles.find((c) => c.id === recovery.cycle_id);
    const date = cycle?.start.split("T")[0];
    if (!date) continue;
    byDate[date] = {
      ...byDate[date],
      date,
      id: byDate[date]?.id ?? `whoop-${date}`,
      recoveryScore: recovery.score.recovery_score,
      restingHr: recovery.score.resting_heart_rate,
      hrvRmssd: Math.round(recovery.score.hrv_rmssd_milli),
    };
  }

  // Non-nap sleeps: match to a date
  for (const sleep of sleeps) {
    if (sleep.nap || sleep.score_state !== "SCORED") continue;
    const date = sleep.start.split("T")[0];
    const durationHours =
      (new Date(sleep.end).getTime() - new Date(sleep.start).getTime()) / 3_600_000;
    byDate[date] = {
      ...byDate[date],
      date,
      id: byDate[date]?.id ?? `whoop-${date}`,
      sleepHours: Math.round(durationHours * 10) / 10,
      sleepScore: sleep.score?.sleep_performance_percentage,
    };
  }

  // Fill defaults and return sorted
  return Object.values(byDate)
    .filter((d): d is WhoopDailyMetrics => !!d.date)
    .map((d) => ({
      id: d.id ?? `whoop-${d.date}`,
      date: d.date!,
      recoveryScore: d.recoveryScore ?? 0,
      hrvRmssd: d.hrvRmssd ?? 0,
      restingHr: d.restingHr ?? 0,
      strainScore: d.strainScore ?? 0,
      sleepScore: d.sleepScore ?? 0,
      sleepHours: d.sleepHours ?? 0,
      caloriesBurned: d.caloriesBurned ?? 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getWhoopData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WhoopDailyMetrics[]> {
  const isMock =
    process.env.WHOOP_MOCK_MODE === "true" || !process.env.WHOOP_CLIENT_ID;

  if (isMock) {
    const days = getDaysInRange(startDate, endDate);
    return days.map((d) => generateMockDay(d));
  }

  const real = await fetchRealWhoopData(userId, startDate, endDate);

  // Fall back to mock if no token is stored yet
  if (real.length === 0) {
    const days = getDaysInRange(startDate, endDate);
    return days.map((d) => generateMockDay(d));
  }

  return real;
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
