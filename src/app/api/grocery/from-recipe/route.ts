import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeIngredient } from "@/lib/grocery-utils";
import type { RecipeIngredient } from "@/types/recipe";

const USER_ID = "demo-user";

export async function POST(req: NextRequest) {
  try {
    const { recipeId } = await req.json();
    if (!recipeId) return NextResponse.json({ error: "recipeId required" }, { status: 400 });

    const recipe = await prisma.savedRecipe.findFirst({
      where: { id: recipeId, userId: USER_ID },
    });
    if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    const ingredients: RecipeIngredient[] = JSON.parse(recipe.ingredients || "[]");

    let added = 0;
    let merged = 0;

    for (const ing of ingredients) {
      const name = ing.name.toLowerCase().trim();
      const category = categorizeIngredient(name);

      // Check for existing item with same name
      const existing = await prisma.groceryItem.findFirst({
        where: { userId: USER_ID, name: { equals: name }, checked: false },
      });

      if (existing) {
        // Merge quantities if units match
        if (existing.unit === ing.unit && ing.amount) {
          await prisma.groceryItem.update({
            where: { id: existing.id },
            data: { quantity: (existing.quantity || 0) + ing.amount },
          });
        }
        merged++;
      } else {
        await prisma.groceryItem.create({
          data: {
            userId: USER_ID,
            name,
            quantity: ing.amount || null,
            unit: ing.unit || null,
            category,
            recipeId,
            recipeTitle: recipe.title,
          },
        });
        added++;
      }
    }

    return NextResponse.json({ added, merged });
  } catch (err) {
    console.error("From-recipe error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
