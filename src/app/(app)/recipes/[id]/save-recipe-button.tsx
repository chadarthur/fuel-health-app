"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecipeDetail } from "@/types/recipe";

interface SaveRecipeButtonProps {
  recipe: RecipeDetail;
}

export default function SaveRecipeButton({ recipe }: SaveRecipeButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (saved) return;
    setLoading(true);
    try {
      await fetch("/api/recipes/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spoonacularId: recipe.id,
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes,
          servings: recipe.servings,
          instructions: recipe.instructions,
          ingredients: recipe.ingredients,
          nutrition: recipe.nutrition,
          cuisines: recipe.cuisines,
          diets: recipe.diets,
          isAiGenerated: false,
        }),
      });
      setSaved(true);
    } catch {
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className={cn(
        "w-full h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all tap-scale",
        saved
          ? "bg-[#00D4AA]/15 text-[#00D4AA] border border-[#00D4AA]/30"
          : "bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white shadow-lg shadow-[#FF6B6B]/20"
      )}
    >
      {saved ? (
        <>
          <BookmarkCheck size={15} />
          Saved!
        </>
      ) : (
        <>
          <Bookmark size={15} />
          {loading ? "Saving..." : "Save Recipe"}
        </>
      )}
    </button>
  );
}
