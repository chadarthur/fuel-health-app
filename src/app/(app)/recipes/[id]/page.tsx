import Image from "next/image";
import Link from "next/link";
import { Clock, Users, ChevronLeft, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { RecipeDetail } from "@/types/recipe";
import SaveRecipeButton from "./save-recipe-button";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RECIPES: Record<string, RecipeDetail> = {
  "1": {
    id: 1,
    title: "Teriyaki Salmon Bowl",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    readyInMinutes: 25,
    servings: 2,
    nutrition: { calories: 520, protein: 42, carbs: 48, fat: 16, fiber: 4, sugar: 8 },
    cuisines: ["Japanese"],
    diets: ["Gluten Free"],
    instructions:
      "1. Cook sushi rice. 2. Marinate salmon in teriyaki sauce for 10 min. 3. Pan-sear salmon 4 min per side. 4. Assemble bowls with rice, salmon, edamame, cucumber, and avocado. 5. Drizzle with extra teriyaki sauce and sesame seeds.",
    ingredients: [
      { name: "Salmon fillet", amount: 400, unit: "g", original: "400g salmon fillet" },
      { name: "Sushi rice", amount: 1.5, unit: "cups", original: "1.5 cups sushi rice" },
      { name: "Teriyaki sauce", amount: 4, unit: "tbsp", original: "4 tbsp teriyaki sauce" },
      { name: "Edamame", amount: 0.5, unit: "cup", original: "½ cup edamame" },
      { name: "Cucumber", amount: 1, unit: "medium", original: "1 medium cucumber" },
      { name: "Avocado", amount: 1, unit: "", original: "1 avocado" },
      { name: "Sesame seeds", amount: 1, unit: "tbsp", original: "1 tbsp sesame seeds" },
      { name: "Nori sheets", amount: 2, unit: "", original: "2 nori sheets" },
    ],
  },
};

async function getRecipe(id: string): Promise<RecipeDetail | null> {
  // Try API first
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/recipes/${id}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      return data.recipe ?? data;
    }
  } catch {
    // fall through to mock
  }
  return MOCK_RECIPES[id] ?? MOCK_RECIPES["1"];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface RecipeDetailPageProps {
  params: { id: string };
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const recipe = await getRecipe(params.id);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Recipe not found</h2>
          <Link href="/recipes" className="text-[#FF6B6B] text-sm">
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  const steps = recipe.instructions
    ? recipe.instructions.split(/\n|\d+\.\s+/).filter(Boolean)
    : ["No instructions available."];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero image */}
      <div className="relative w-full h-64 md:h-80">
        <Image
          src={recipe.image ?? "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80"}
          alt={recipe.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Back button */}
        <Link
          href="/recipes"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <ChevronLeft size={18} className="text-white" />
        </Link>
      </div>

      <div className="px-4 -mt-8 relative z-10 space-y-4">
        {/* Title + meta */}
        <div>
          <h1 className="text-2xl font-black leading-tight mb-2">{recipe.title}</h1>
          <div className="flex flex-wrap gap-2">
            {recipe.readyInMinutes && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                <Clock size={12} />
                {recipe.readyInMinutes} min
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                <Users size={12} />
                {recipe.servings} servings
              </div>
            )}
            {recipe.diets?.map((diet) => (
              <div
                key={diet}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#00D4AA]/15 text-[#00D4AA]"
              >
                {diet}
              </div>
            ))}
          </div>
        </div>

        {/* Macro row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Calories", value: recipe.nutrition.calories, unit: "kcal", color: "#FF9F43" },
            { label: "Protein", value: recipe.nutrition.protein, unit: "g", color: "#54A0FF" },
            { label: "Carbs", value: recipe.nutrition.carbs, unit: "g", color: "#FECA57" },
            { label: "Fat", value: recipe.nutrition.fat, unit: "g", color: "#A29BFE" },
          ].map(({ label, value, unit, color }) => (
            <div
              key={label}
              className="flex flex-col items-center p-3 rounded-2xl"
              style={{ backgroundColor: `${color}15` }}
            >
              <span className="text-lg font-black tabular-nums" style={{ color }}>
                {value}
              </span>
              <span className="text-[9px] text-muted-foreground">{unit}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Ingredients + Instructions (2-column on desktop) */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Ingredients */}
          <Card glass>
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Ingredients
              </p>
              <div className="space-y-2.5">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#FF6B6B" }} />
                    <span className="text-[#FF6B6B] font-semibold text-xs w-16 shrink-0">
                      {ing.amount} {ing.unit}
                    </span>
                    <span className="text-foreground/80">{ing.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card glass>
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Instructions
              </p>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className={cn(
                        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white mt-0.5"
                      )}
                      style={{ background: "linear-gradient(135deg, #FF6B6B, #00D4AA)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-foreground/80">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <SaveRecipeButton recipe={recipe} />
          <Link href="/grocery">
            <button className="w-full h-11 rounded-2xl border border-border dark:border-white/10 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-accent transition-colors">
              <ShoppingCart size={15} />
              Add to Grocery
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
