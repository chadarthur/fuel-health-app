import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeIngredient } from "@/lib/grocery-utils";
import { requireUser } from "@/lib/session";

interface SelectedIngredient {
  name: string;
  amount?: number;
  unit?: string;
  original?: string;
  recipeId?: string;
  recipeTitle?: string;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    const items: SelectedIngredient[] = body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    let added = 0;
    let merged = 0;

    for (const ing of items) {
      const name = ing.name.toLowerCase().trim();
      if (!name) continue;
      const category = categorizeIngredient(name);

      const existing = await prisma.groceryItem.findFirst({
        where: { userId, name: { equals: name }, checked: false },
      });

      if (existing) {
        // If same unit and amount is provided, sum quantities
        if (existing.unit === (ing.unit ?? null) && ing.amount) {
          await prisma.groceryItem.update({
            where: { id: existing.id },
            data: { quantity: (existing.quantity || 0) + ing.amount },
          });
        }
        merged++;
      } else {
        await prisma.groceryItem.create({
          data: {
            userId,
            name,
            quantity: ing.amount ?? null,
            unit: ing.unit ?? null,
            category,
            recipeId: ing.recipeId ?? null,
            recipeTitle: ing.recipeTitle ?? null,
          },
        });
        added++;
      }
    }

    return NextResponse.json({ added, merged });
  } catch (err) {
    console.error("Add ingredients error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
