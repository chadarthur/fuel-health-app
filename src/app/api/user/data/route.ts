import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/** Clear all of the current user's meals, grocery items, and saved recipes. */
export async function DELETE() {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const [meals, grocery, recipes] = await prisma.$transaction([
      prisma.mealEntry.deleteMany({ where: { userId } }),
      prisma.groceryItem.deleteMany({ where: { userId } }),
      prisma.savedRecipe.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({
      deleted: {
        meals: meals.count,
        groceryItems: grocery.count,
        recipes: recipes.count,
      },
    });
  } catch (err) {
    console.error("User data DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
