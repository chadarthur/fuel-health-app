/**
 * Returns the local date string (YYYY-MM-DD) for the user's current timezone.
 * Unlike toISOString().split("T")[0] which returns the UTC date.
 */
export function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Given a local date string (YYYY-MM-DD) and a timezone offset in minutes
 * (from Date.getTimezoneOffset() — positive for west of UTC, negative for east),
 * returns the UTC start and end of that local calendar day.
 *
 * Example (EST, offset=300):
 *   "2026-03-02" → { start: 2026-03-02T05:00:00Z, end: 2026-03-03T04:59:59.999Z }
 */
export function getUtcDayRange(
  dateStr: string,
  tzOffsetMinutes: number
): { start: Date; end: Date } {
  // Parse dateStr as UTC midnight
  const utcMidnight = new Date(`${dateStr}T00:00:00.000Z`).getTime();
  // Shift by timezone offset to get local midnight in UTC
  const localMidnightUtc = utcMidnight + tzOffsetMinutes * 60 * 1000;
  const localEndOfDayUtc = localMidnightUtc + 24 * 60 * 60 * 1000 - 1;
  return {
    start: new Date(localMidnightUtc),
    end: new Date(localEndOfDayUtc),
  };
}
