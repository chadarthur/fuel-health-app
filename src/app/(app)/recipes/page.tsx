"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles, Link2, Loader2, CheckCircle, BookOpen,
  ChevronRight, Flame, Dumbbell, Clock, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipePreview {
  title: string;
  description?: string;
  readyInMinutes?: number;
  servings?: number;
  cuisines?: string[];
  diets?: string[];
  ingredients: { name: string; amount: number; unit: string; original?: string }[];
  instructions?: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sugar?: number };
  image?: string;
}

type Tab = "ai" | "url";

const DIETARY_OPTIONS = ["Gluten Free", "Keto", "Vegan", "Vegetarian", "Dairy Free", "Paleo", "High Protein"];

// ─── RecipePreviewCard ────────────────────────────────────────────────────────

function RecipePreviewCard({
  recipe,
  onSave,
  saving,
  saved,
}: {
  recipe: RecipePreview;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const macros = [
    { label: "Cal", value: Math.round(recipe.nutrition.calories), color: "#FF9F43" },
    { label: "Protein", value: `${Math.round(recipe.nutrition.protein)}g`, color: "#54A0FF" },
    { label: "Carbs", value: `${Math.round(recipe.nutrition.carbs)}g`, color: "#FECA57" },
    { label: "Fat", value: `${Math.round(recipe.nutrition.fat)}g`, color: "#A29BFE" },
  ];

  return (
    <Card glass className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA]" />
      <CardContent className="p-4">
        <h3 className="text-base font-bold mb-1">{recipe.title}</h3>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-2">
          {recipe.readyInMinutes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={11} />
              {recipe.readyInMinutes} min
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={11} />
              {recipe.servings} servings
            </div>
          )}
        </div>

        {recipe.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{recipe.description}</p>
        )}

        {/* Macros */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {macros.map(({ label, value, color }) => (
            <div
              key={label}
              className="flex flex-col items-center py-1.5 rounded-lg"
              style={{ backgroundColor: `${color}15` }}
            >
              <span className="text-xs font-black" style={{ color }}>{value}</span>
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Ingredients preview */}
        {recipe.ingredients.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Ingredients ({recipe.ingredients.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.slice(0, 6).map((ing, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {ing.name}
                </span>
              ))}
              {recipe.ingredients.length > 6 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  +{recipe.ingredients.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Save button */}
        <Button
          onClick={onSave}
          disabled={saving || saved}
          className={cn(
            "w-full gap-2 font-semibold",
            saved
              ? "bg-[#00D4AA]/15 text-[#00D4AA] border border-[#00D4AA]/30"
              : "bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white"
          )}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={14} />
          ) : (
            <BookOpen size={14} />
          )}
          {saved ? "Saved to Recipe Book!" : "Save to Recipe Book"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── AI Generate Tab ──────────────────────────────────────────────────────────

function AIGenerateTab() {
  const [prompt, setPrompt] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipePreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const streamTextRef = useRef("");

  function toggleDiet(d: string) {
    setDietary((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setRecipe(null);
    setError("");
    setSaved(false);
    streamTextRef.current = "";

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), dietary, servings: 2 }),
      });

      if (!res.ok) {
        setError("Failed to generate recipe. Try again.");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setError("Streaming not supported.");
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamTextRef.current += decoder.decode(value, { stream: true });
      }

      // Parse the collected JSON
      const text = streamTextRef.current.trim();
      const parsed = JSON.parse(text) as RecipePreview;
      setRecipe(parsed);
    } catch {
      setError("Something went wrong generating the recipe. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function saveRecipe() {
    if (!recipe || saved) return;
    setSaving(true);
    try {
      await fetch("/api/recipes/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...recipe, isAiGenerated: true }),
      });
      setSaved(true);
    } catch {
      setError("Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Prompt input */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Describe a recipe
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. High protein Thai chicken bowl, or creamy mushroom pasta..."
          rows={3}
          className="w-full bg-card border border-border dark:border-white/5 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#FF6B6B]/30"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) generate();
          }}
        />
      </div>

      {/* Dietary filters */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Dietary preferences
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DIETARY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDiet(d)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                dietary.includes(d)
                  ? "bg-[#FF6B6B] text-white border-[#FF6B6B]"
                  : "bg-transparent text-muted-foreground border-border dark:border-white/10 hover:border-white/20"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={generate}
        disabled={!prompt.trim() || loading}
        className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white font-semibold gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={15} />
            Generate Recipe
          </>
        )}
      </Button>

      {error && <p className="text-xs text-[#FF6B6B] text-center">{error}</p>}

      {/* Result */}
      {recipe && (
        <RecipePreviewCard
          recipe={recipe}
          onSave={saveRecipe}
          saving={saving}
          saved={saved}
        />
      )}

      {/* Try again link */}
      {saved && (
        <button
          onClick={() => { setRecipe(null); setSaved(false); setPrompt(""); }}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Generate another recipe →
        </button>
      )}
    </div>
  );
}

// ─── URL Import Tab ───────────────────────────────────────────────────────────

function URLImportTab() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipePreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function importRecipe() {
    if (!url.trim() || loading) return;
    setLoading(true);
    setRecipe(null);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to import recipe. Try a different URL.");
        return;
      }

      setRecipe(data.recipe as RecipePreview);
    } catch {
      setError("Something went wrong. Make sure the URL is a valid recipe page.");
    } finally {
      setLoading(false);
    }
  }

  async function saveRecipe() {
    if (!recipe || saved) return;
    setSaving(true);
    try {
      await fetch("/api/recipes/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...recipe, isAiGenerated: false, sourceUrl: url }),
      });
      setSaved(true);
    } catch {
      setError("Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* URL hint examples */}
      <div className="p-3 rounded-xl bg-muted/50 dark:bg-white/5 border border-border dark:border-white/5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paste any recipe URL — AllRecipes, NYT Cooking, food blogs, or even a ChatGPT conversation with a recipe.
        </p>
      </div>

      {/* URL input */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Recipe URL
        </p>
        <div className="relative">
          <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.allrecipes.com/recipe/..."
            className="w-full bg-card border border-border dark:border-white/5 rounded-xl pl-9 pr-9 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4AA]/30"
            onKeyDown={(e) => { if (e.key === "Enter") importRecipe(); }}
          />
          {url && (
            <button
              onClick={() => { setUrl(""); setRecipe(null); setError(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Import button */}
      <Button
        onClick={importRecipe}
        disabled={!url.trim() || loading}
        className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-black font-semibold gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Extracting recipe...
          </>
        ) : (
          <>
            <Link2 size={15} />
            Import Recipe
          </>
        )}
      </Button>

      {error && <p className="text-xs text-[#FF6B6B] text-center">{error}</p>}

      {/* Result */}
      {recipe && (
        <RecipePreviewCard
          recipe={recipe}
          onSave={saveRecipe}
          saving={saving}
          saved={saved}
        />
      )}

      {saved && (
        <button
          onClick={() => { setRecipe(null); setSaved(false); setUrl(""); }}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Import another recipe →
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ai");
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/recipes/saved")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSavedCount(data.length);
        else if (data.recipes) setSavedCount(data.recipes.length);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Recipes</h1>
          <Link
            href="/recipes/saved"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/20 transition-colors"
          >
            <BookOpen size={12} />
            Recipe Book
            {savedCount !== null && savedCount > 0 && (
              <span className="bg-[#FF6B6B] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {savedCount > 9 ? "9+" : savedCount}
              </span>
            )}
            <ChevronRight size={12} />
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe a recipe or import one from any website
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex p-1 rounded-xl bg-muted/50 dark:bg-white/5 border border-border dark:border-white/5">
          <button
            onClick={() => setActiveTab("ai")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
              activeTab === "ai"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles size={14} className={activeTab === "ai" ? "text-[#FF6B6B]" : ""} />
            AI Generate
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
              activeTab === "url"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Link2 size={14} className={activeTab === "url" ? "text-[#00D4AA]" : ""} />
            Import URL
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4">
        {activeTab === "ai" ? <AIGenerateTab /> : <URLImportTab />}
      </div>

      {/* Macro legend at bottom */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          {[
            { label: "Calories", color: "#FF9F43", icon: Flame },
            { label: "Protein", color: "#54A0FF", icon: Dumbbell },
          ].map(({ label, color, icon: Icon }) => (
            <div key={label} className="flex items-center gap-1">
              <Icon size={10} style={{ color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
