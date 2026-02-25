"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Clock, Flame, Dumbbell, Wheat, Droplets, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Recipe } from "@/types/recipe";

const DIET_FILTERS = ["All", "Gluten Free", "Ketogenic", "Vegan", "Vegetarian", "Paleo", "Dairy Free"];
const CUISINE_FILTERS = ["All", "Italian", "American", "Japanese", "Mexican", "Thai", "Indian", "Mediterranean"];

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80";

const MOCK_RECIPES: Recipe[] = [
  {
    id: 1,
    title: "Teriyaki Salmon Bowl",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    readyInMinutes: 25,
    servings: 2,
    nutrition: { calories: 520, protein: 42, carbs: 48, fat: 16 },
    diets: ["Gluten Free"],
    cuisines: ["Japanese"],
  },
  {
    id: 2,
    title: "Avocado Chickpea Toast",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
    readyInMinutes: 10,
    servings: 1,
    nutrition: { calories: 340, protein: 14, carbs: 38, fat: 18 },
    diets: ["Vegan"],
    cuisines: ["American"],
  },
  {
    id: 3,
    title: "High-Protein Pasta Bake",
    image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80",
    readyInMinutes: 40,
    servings: 4,
    nutrition: { calories: 610, protein: 52, carbs: 65, fat: 14 },
    diets: [],
    cuisines: ["Italian"],
  },
  {
    id: 4,
    title: "Thai Green Curry",
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80",
    readyInMinutes: 30,
    servings: 3,
    nutrition: { calories: 445, protein: 28, carbs: 36, fat: 22 },
    diets: ["Gluten Free"],
    cuisines: ["Thai"],
  },
  {
    id: 5,
    title: "Keto Chicken Quesadillas",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
    readyInMinutes: 20,
    servings: 2,
    nutrition: { calories: 480, protein: 38, carbs: 8, fat: 34 },
    diets: ["Ketogenic", "Gluten Free"],
    cuisines: ["Mexican"],
  },
  {
    id: 6,
    title: "Mediterranean Grain Bowl",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80",
    readyInMinutes: 15,
    servings: 2,
    nutrition: { calories: 390, protein: 16, carbs: 52, fat: 14 },
    diets: ["Vegan", "Dairy Free"],
    cuisines: ["Mediterranean"],
  },
  {
    id: 7,
    title: "Protein Pancakes",
    image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&q=80",
    readyInMinutes: 20,
    servings: 2,
    nutrition: { calories: 420, protein: 36, carbs: 44, fat: 10 },
    diets: ["Vegetarian"],
    cuisines: ["American"],
  },
  {
    id: 8,
    title: "Spicy Tuna Poke Bowl",
    image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80",
    readyInMinutes: 15,
    servings: 1,
    nutrition: { calories: 380, protein: 34, carbs: 40, fat: 10 },
    diets: ["Gluten Free", "Dairy Free"],
    cuisines: ["Japanese"],
  },
];

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

interface RecipeCardProps {
  recipe: Recipe;
}

function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="overflow-hidden group tap-scale card-glow h-full">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={recipe.image || PLACEHOLDER_IMAGE}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {recipe.readyInMinutes && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
              <Clock size={10} />
              {recipe.readyInMinutes}m
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="text-sm font-semibold line-clamp-2 leading-tight mb-2">
            {recipe.title}
          </p>
          <div className="grid grid-cols-2 gap-1">
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
            <div className="flex items-center gap-1">
              <Wheat size={10} style={{ color: "#FECA57" }} />
              <span className="text-[10px] text-muted-foreground font-medium">
                {recipe.nutrition.carbs}g C
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets size={10} style={{ color: "#A29BFE" }} />
              <span className="text-[10px] text-muted-foreground font-medium">
                {recipe.nutrition.fat}g F
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [activeDiet, setActiveDiet] = useState("All");
  const [activeCuisine, setActiveCuisine] = useState("All");
  const [recipes, setRecipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [loading, setLoading] = useState(false);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (activeDiet !== "All") params.set("diet", activeDiet);
      if (activeCuisine !== "All") params.set("cuisine", activeCuisine);

      const res = await fetch(`/api/recipes/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.results ?? []);
      } else {
        // Fallback to mock filtering
        const filtered = MOCK_RECIPES.filter((r) => {
          const matchQuery = !query || r.title.toLowerCase().includes(query.toLowerCase());
          const matchDiet =
            activeDiet === "All" || (r.diets ?? []).some((d) => d.toLowerCase() === activeDiet.toLowerCase());
          const matchCuisine =
            activeCuisine === "All" ||
            (r.cuisines ?? []).some((c) => c.toLowerCase() === activeCuisine.toLowerCase());
          return matchQuery && matchDiet && matchCuisine;
        });
        setRecipes(filtered);
      }
    } catch {
      const filtered = MOCK_RECIPES.filter((r) => {
        const matchQuery = !query || r.title.toLowerCase().includes(query.toLowerCase());
        const matchDiet =
          activeDiet === "All" || (r.diets ?? []).some((d) => d.toLowerCase() === activeDiet.toLowerCase());
        const matchCuisine =
          activeCuisine === "All" ||
          (r.cuisines ?? []).some((c) => c.toLowerCase() === activeCuisine.toLowerCase());
        return matchQuery && matchDiet && matchCuisine;
      });
      setRecipes(filtered);
    } finally {
      setLoading(false);
    }
  }, [query, activeDiet, activeCuisine]);

  useEffect(() => {
    const timer = setTimeout(fetchRecipes, 400);
    return () => clearTimeout(timer);
  }, [fetchRecipes]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border dark:border-white/5 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Recipes</h1>
          <Link
            href="/recipes/saved"
            className="text-xs text-[#FF6B6B] font-semibold px-3 py-1.5 rounded-full bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 transition-colors"
          >
            Saved
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes..."
            className="pl-9 pr-9 bg-card border-border dark:border-white/5 rounded-xl"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Diet filter pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {DIET_FILTERS.map((diet) => (
            <button
              key={diet}
              onClick={() => setActiveDiet(diet)}
              className={cn(
                "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                activeDiet === diet
                  ? "bg-[#FF6B6B] text-white border-[#FF6B6B]"
                  : "bg-transparent text-muted-foreground border-border dark:border-white/10 hover:border-white/20"
              )}
            >
              {diet}
            </button>
          ))}
        </div>

        {/* Cuisine filter pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {CUISINE_FILTERS.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setActiveCuisine(cuisine)}
              className={cn(
                "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                activeCuisine === cuisine
                  ? "bg-[#00D4AA] text-black border-[#00D4AA]"
                  : "bg-transparent text-muted-foreground border-border dark:border-white/10 hover:border-white/20"
              )}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-lg font-bold mb-1">No recipes found</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Try adjusting your search or filters to find something delicious.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
