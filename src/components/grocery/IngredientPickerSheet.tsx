"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecipeIngredient } from "@/types/recipe";

export interface IngredientPickerRecipe {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
}

interface IngredientPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: IngredientPickerRecipe | null;
  onSuccess?: (added: number, merged: number) => void;
}

export function IngredientPickerSheet({
  isOpen,
  onClose,
  recipe,
  onSuccess,
}: IngredientPickerSheetProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ added: number; merged: number } | null>(null);

  // Reset and pre-select all when recipe changes
  useEffect(() => {
    if (recipe) {
      setSelected(new Set(recipe.ingredients.map((_, i) => i)));
      setDone(false);
      setResult(null);
    }
  }, [recipe]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function toggleItem(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleAll() {
    if (!recipe) return;
    if (selected.size === recipe.ingredients.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(recipe.ingredients.map((_, i) => i)));
    }
  }

  async function handleAdd() {
    if (!recipe || selected.size === 0 || loading) return;
    setLoading(true);
    try {
      const items = [...selected].map((i) => {
        const ing = recipe.ingredients[i];
        return {
          name: ing.name,
          amount: ing.amount || undefined,
          unit: ing.unit || undefined,
          original: ing.original || undefined,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
        };
      });

      const res = await fetch("/api/grocery/add-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setDone(true);
        onSuccess?.(data.added, data.merged);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !recipe) return null;

  const ingredients = recipe.ingredients;
  const allSelected = selected.size === ingredients.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl flex flex-col max-h-[82vh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border dark:border-white/10 shrink-0">
          <div>
            <h3 className="font-bold text-base">Add to Grocery List</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[220px]">{recipe.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        {done ? (
          /* ── Success state ── */
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00D4AA]/15 flex items-center justify-center mb-4">
              <Check size={28} className="text-[#00D4AA]" />
            </div>
            <h4 className="font-bold text-lg mb-1">Added to Grocery!</h4>
            {result && (
              <p className="text-sm text-muted-foreground">
                {result.added > 0 && `${result.added} new item${result.added !== 1 ? "s" : ""} added`}
                {result.added > 0 && result.merged > 0 && ", "}
                {result.merged > 0 && `${result.merged} merged with existing`}
                {result.added === 0 && result.merged === 0 && "No items were added"}
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-6 px-8 py-2.5 rounded-full bg-[#00D4AA] text-black font-semibold text-sm hover:bg-[#00D4AA]/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : ingredients.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ShoppingCart size={26} className="text-muted-foreground" />
            </div>
            <h4 className="font-semibold mb-2">No ingredients found</h4>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              This recipe doesn&apos;t have ingredient details. You can add items manually from the Grocery page.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-6 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Select all row */}
            <div className="flex items-center justify-between px-5 py-2.5 shrink-0">
              <p className="text-xs text-muted-foreground">
                {selected.size} of {ingredients.length} items selected
              </p>
              <button
                onClick={toggleAll}
                className="text-xs font-semibold text-[#00D4AA] hover:text-[#00D4AA]/80 transition-colors"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>

            {/* Ingredient list — scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-border dark:divide-white/5">
              {ingredients.map((ing, i) => {
                const isChecked = selected.has(i);
                const label = ing.original || `${ing.amount ? ing.amount + " " : ""}${ing.unit ? ing.unit + " " : ""}${ing.name}`;
                return (
                  <button
                    key={i}
                    onClick={() => toggleItem(i)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                        isChecked
                          ? "bg-[#00D4AA] border-[#00D4AA]"
                          : "border-border dark:border-white/20 hover:border-[#00D4AA]/50"
                      )}
                    >
                      {isChecked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        "flex-1 text-sm leading-snug transition-all",
                        isChecked ? "font-medium" : "text-muted-foreground line-through"
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add button — fixed at bottom */}
            <div className="shrink-0 p-4 pb-8 border-t border-border dark:border-white/10 bg-background">
              <button
                onClick={handleAdd}
                disabled={loading || selected.size === 0}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                  selected.size > 0 && !loading
                    ? "bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShoppingCart size={16} />
                )}
                {loading
                  ? "Adding..."
                  : `Add ${selected.size} item${selected.size !== 1 ? "s" : ""} to Grocery`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
