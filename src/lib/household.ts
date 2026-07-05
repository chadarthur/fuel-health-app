import { prisma } from "./prisma";

/**
 * Returns the user ids whose recipes and grocery items this user can see:
 * their own id plus any household members'. Meal tracking stays private —
 * only recipes and the grocery list are shared.
 */
export async function getHouseholdUserIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { householdId: true },
  });

  if (!user?.householdId) return [userId];

  const members = await prisma.user.findMany({
    where: { householdId: user.householdId },
    select: { id: true },
  });

  const ids = members.map((m) => m.id);
  return ids.includes(userId) ? ids : [userId, ...ids];
}
