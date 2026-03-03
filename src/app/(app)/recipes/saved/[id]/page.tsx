"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Clock, Users, Flame, Dumbbell, ShoppingCart,
  Trash2, Loader2, Sparkles, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  original?: string;
}

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

interface SavedRecipeDetail {
  id: string;
  title: string;
  image?: string;
  description?: string;
  readyInMinutes?: number;
  servings?: number;
  instructions?: string;
  ingredients: Ingredient[];
  nutrition: Nutrition;
  cuisines: string[];
  diets: string[];
  isAiGenerated: boolean;
  sourceUrl?: string;
  createdAt: string;
}

const PLACEHOLDER = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80";

export default function SavedRecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<SavedRecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [groceryAdded, setGroceryAdded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`/api/recipes/saved/${id}`);
        if (res.ok) {
          setRecipe(await res.json());
        } else {
          router.replace("/recipes/saved");
        }
      } catch {
        router.replace("/recipes/saved");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, router]);

  async function handleAddToGrocery() {
    if (!recipe || groceryAdded) return;
    setGroceryLoading(true);
    try {
      const res = await fetch("/api/grocery/from-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      if (res.ok) setGroceryAdded(true);
    } finally {
      setGroceryLoading(false);
    }
  }

  async function handleDelete() {
    if (!recipe) return;
    setDeleting(true);
    try {
      await fetch(`/api/recipes/saved/${recipe.id}`, { method: "DELETE" });
      router.replace("/recipes/saved");
    } catch {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recipe) return null;

  const steps = recipe.instructions
    ? recipe.instructions.split(/\n/).filter((s) => s.trim())
    : [];

  const macros = [
    { label: "Calories", value: Math.round(recipe.nutrition.calories), unit: "kcal", color: "#FF9F43" },
    { label: "Protein", value: Math.round(recipe.nutrition.protein), unit: "g", color: "#54A0FF" },
    { label: "Carbs", value: Math.round(recipe.nutrition.carbs), unit: "g", color: "#FECA57" },
    { label: "Fat", value: Math.round(recipe.nutrition.fat), unit: "g", color: "#A29BFE" },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero image */}
      <div className="relative h-56 sm:h-72 overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.image || PLACEHOLDER}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/recipes/saved"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft size={18} />
        </Link>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          {recipe.isAiGenerated && (
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white text-[10px] font-bold px-2 py-1 rounded-full mb-2">
              <Sparkles size={9} />
              AI Generated
            </div>
          )}
          <h1 className="text-white text-xl font-bold leading-tight">{recipe.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            {recipe.readyInMinutes && (
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Clock size={11} />
                {recipe.readyInMinutes} min
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Users size={11} />
                {recipe.servings} servings
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Macros grid */}
        <div className="grid grid-cols-4 gap-2">
          {macros.map(({ label, value, unit, color }) => (
            <Card key={label} glass>
              <CardContent className="py-3 px-2 text-center">
                <p className="text-base font-black" style={{ color }}>{value}</p>
                <p className="text-[9px] text-muted-foreground">{unit}</p>
                <p className="text-[9px] font-semibold text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add to Grocery button */}
        <Button
          onClick={handleAddToGrocery}
          disabled={groceryLoading || groceryAdded}
          className={cn(
            "w-full gap-2 font-semibold",
            groceryAdded
              ? "bg-[#00D4AA]/15 text-[#00D4AA] hover:bg-[#00D4AA]/20 border border-[#00D4AA]/30"
              : "bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-black"
          )}
        >
          {groceryLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : groceryAdded ? (
            <CheckCircle size={15} />
          ) : (
            <ShoppingCart size={15} />
          )}
          {groceryAdded ? "Added to Grocery List!" : "Add to Grocery List"}
        </Button>

        {/* Diet / cuisine tags */}
        {(recipe.diets.length > 0 || recipe.cuisines.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {[...recipe.cuisines, ...recipe.diets].map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{recipe.description}</p>
        )}

        {/* Ingredients + Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Flame size={12} style={{ color: "#FF9F43" }} />
                Ingredients ({recipe.ingredients.length})
              </p>
              <Card glass className="overflow-hidden">
                <CardContent className="py-3 px-4">
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-[#FF6B6B] mt-0.5 shrink-0">•</span>
                        <span>{ing.original || `${ing.amount} ${ing.unit} ${ing.name}`}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Instructions */}
          {steps.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Dumbbell size={12} style={{ color: "#54A0FF" }} />
                Instructions
              </p>
              <Card glass className="overflow-hidden">
                <CardContent className="py-3 px-4">
                  <ol className="space-y-3">
                    {steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5"
                          style={{ background: "linear-gradient(135deg, #FF6B6B, #00D4AA)" }}
                        >
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </section>
          )}
        </div>

        {/* Source URL */}
        {recipe.sourceUrl && (
          <p className="text-xs text-muted-foreground text-center">
            Source:{" "}
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#54A0FF] hover:underline"
            >
              {new URL(recipe.sourceUrl).hostname}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
