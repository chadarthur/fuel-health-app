"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Flame, Dumbbell, ChefHat, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SavedRecipeData } from "@/types/recipe";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80";

const MOCK_SAVED: SavedRecipeData[] = [
  {
    id: "saved-1",
    spoonacularId: 1,
    title: "Teriyaki Salmon Bowl",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    readyInMinutes: 25,
    servings: 2,
    ingredients: [],
    nutrition: { calories: 520, protein: 42, carbs: 48, fat: 16 },
    isAiGenerated: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "saved-2",
    title: "AI Protein Power Bowl",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80",
    readyInMinutes: 15,
    servings: 1,
    ingredients: [],
    nutrition: { calories: 480, protein: 52, carbs: 34, fat: 12 },
    isAiGenerated: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "saved-3",
    spoonacularId: 3,
    title: "High-Protein Pasta Bake",
    image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80",
    readyInMinutes: 40,
    servings: 4,
    ingredients: [],
    nutrition: { calories: 610, protein: 52, carbs: 65, fat: 14 },
    isAiGenerated: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "saved-4",
    title: "AI Keto Egg Skillet",
    image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80",
    readyInMinutes: 12,
    servings: 1,
    ingredients: [],
    nutrition: { calories: 380, protein: 28, carbs: 6, fat: 29 },
    isAiGenerated: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

type FilterTab = "all" | "spoonacular" | "ai";

function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border dark:border-white/5">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

interface SavedRecipeCardProps {
  recipe: SavedRecipeData;
}

function SavedRecipeCard({ recipe }: SavedRecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.spoonacularId ?? recipe.id}`}>
      <Card className="overflow-hidden group tap-scale card-glow h-full">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={recipe.image || PLACEHOLDER_IMAGE}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {recipe.readyInMinutes && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
              <Clock size={10} />
              {recipe.readyInMinutes}m
            </div>
          )}
          {recipe.isAiGenerated && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white text-[10px] font-bold px-2 py-1 rounded-full">
              <Sparkles size={9} />
              AI
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="text-sm font-semibold line-clamp-2 leading-tight mb-2">
            {recipe.title}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Flame size={10} style={{ color: "#FF9F43" }} />
              <span className="text-[10px] text-muted-foreground font-medium">
                {recipe.nutrition.calories} kcal
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell size={10} style={{ color: "#54A0FF" }} />
              <span className="text-[10px] text-muted-foreground font-medium">
                {recipe.nutrition.protein}g P
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SavedRecipesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [recipes, setRecipes] = useState<SavedRecipeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/recipes/saved");
        if (res.ok) {
          const data = await res.json();
          setRecipes(data.recipes ?? []);
        } else {
          setRecipes(MOCK_SAVED);
        }
      } catch {
        setRecipes(MOCK_SAVED);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const filtered = recipes.filter((r) => {
    if (activeTab === "ai") return r.isAiGenerated;
    if (activeTab === "spoonacular") return !r.isAiGenerated && !!r.spoonacularId;
    return true;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "spoonacular", label: "Spoonacular" },
    { key: "ai", label: "AI Generated" },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border dark:border-white/5 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Recipe Book</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {recipes.length} saved recipe{recipes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/recipes">
            <div className="text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-full border border-border dark:border-white/10 hover:border-white/20 transition-colors">
              Discover
            </div>
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 dark:bg-white/5">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all",
                activeTab === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ChefHat size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-1">No saved recipes yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Save recipes from discovery or generate your own with AI.
            </p>
            <div className="flex gap-2">
              <Link
                href="/recipes"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B] hover:bg-[#FF6B6B]/25 transition-colors"
              >
                Browse Recipes
              </Link>
              <Link
                href="/recipes/generate"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white hover:opacity-90 transition-opacity"
              >
                Generate with AI
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((recipe) => (
              <SavedRecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      {/* AI Generate FAB */}
      <Link href="/recipes/generate">
        <div className="fixed bottom-24 right-4 z-30">
          <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white font-bold text-sm shadow-2xl shadow-[#FF6B6B]/30 tap-scale">
            <Plus size={16} />
            AI Generate
          </div>
        </div>
      </Link>
    </div>
  );
}
