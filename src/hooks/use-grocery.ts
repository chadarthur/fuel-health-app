"use client";

import useSWR from "swr";
import type { GroceryItemData } from "@/types/grocery";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useGroceryList() {
  const { data, error, isLoading, mutate } = useSWR<GroceryItemData[]>(
    "/api/grocery",
    fetcher
  );

  async function toggleItem(id: string, checked: boolean) {
    // Optimistic update
    mutate(
      (items) => items?.map((i) => (i.id === id ? { ...i, checked } : i)),
      false
    );
    await fetch("/api/grocery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checked }),
    });
    mutate();
  }

  async function addItem(name: string, quantity?: number, unit?: string) {
    await fetch("/api/grocery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity, unit }),
    });
    mutate();
  }

  async function deleteItem(id: string) {
    mutate((items) => items?.filter((i) => i.id !== id), false);
    await fetch(`/api/grocery?id=${id}`, { method: "DELETE" });
    mutate();
  }

  async function clearChecked() {
    await fetch("/api/grocery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearChecked: true }),
    });
    mutate();
  }

  async function addFromRecipe(recipeId: string) {
    const res = await fetch("/api/grocery/from-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    });
    mutate();
    return res.json();
  }

  // Group items by category
  const grouped = data?.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryItemData[]>);

  return { items: data, grouped, error, isLoading, toggleItem, addItem, deleteItem, clearChecked, addFromRecipe };
}
