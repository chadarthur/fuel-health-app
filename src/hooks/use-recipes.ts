"use client";

import useSWR from "swr";
import type { RecipeSearchResult, SavedRecipeData } from "@/types/recipe";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRecipeSearch(params: {
  q?: string;
  diet?: string;
  cuisine?: string;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.diet) query.set("diet", params.diet);
  if (params.cuisine) query.set("cuisine", params.cuisine);
  if (params.offset) query.set("offset", String(params.offset));

  const { data, error, isLoading } = useSWR<RecipeSearchResult>(
    `/api/recipes/search?${query}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { results: data?.results, totalResults: data?.totalResults, error, isLoading };
}

export function useSavedRecipes() {
  const { data, error, isLoading, mutate } = useSWR<SavedRecipeData[]>(
    "/api/recipes/saved",
    fetcher
  );

  async function saveRecipe(recipe: Omit<SavedRecipeData, "id" | "createdAt">) {
    await fetch("/api/recipes/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
    mutate();
  }

  async function unsaveRecipe(id: string) {
    await fetch(`/api/recipes/saved?id=${id}`, { method: "DELETE" });
    mutate();
  }

  function isSaved(spoonacularId?: number, title?: string): string | null {
    if (!data) return null;
    const match = data.find(
      (r) => (spoonacularId && r.spoonacularId === spoonacularId) || r.title === title
    );
    return match?.id ?? null;
  }

  return { saved: data, error, isLoading, saveRecipe, unsaveRecipe, isSaved };
}
