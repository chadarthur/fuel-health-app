"use client";

import { useState, useRef } from "react";
import { Sparkles, ChefHat, Minus, Plus, Save, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DIETARY_OPTIONS = [
  { key: "gluten-free", label: "Gluten Free" },
  { key: "keto", label: "Keto" },
  { key: "vegan", label: "Vegan" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "dairy-free", label: "Dairy Free" },
  { key: "paleo", label: "Paleo" },
];

interface GeneratedRecipe {
  title: string;
  description: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  ingredients: { amount: string; name: string }[];
  instructions: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
}

function parseGeneratedRecipe(text: string): GeneratedRecipe | null {
  // Very simple parser — in production the AI would return structured JSON
  return {
    title: "AI Generated Recipe",
    description: text.slice(0, 200),
    servings: 2,
    prepTime: "10 min",
    cookTime: "20 min",
    ingredients: [],
    instructions: [],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };
}

export default function GenerateRecipePage() {
  const [prompt, setPrompt] = useState("");
  const [selectedDiets, setSelectedDiets] = useState<Set<string>>(new Set());
  const [servings, setServings] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  function toggleDiet(key: string) {
    setSelectedDiets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStreamedText("");
    setGeneratedRecipe(null);
    setSaved(false);

    const dietLabels = Array.from(selectedDiets)
      .map((k) => DIETARY_OPTIONS.find((o) => o.key === k)?.label)
      .filter(Boolean)
      .join(", ");

    const body = {
      prompt: `${prompt}${dietLabels ? ` (Dietary preferences: ${dietLabels})` : ""} for ${servings} servings.`,
    };

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Generation failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamedText(fullText);
      }

      // Try to parse structured response
      try {
        const jsonMatch = fullText.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]) as GeneratedRecipe;
          setGeneratedRecipe(parsed);
        } else {
          setGeneratedRecipe(parseGeneratedRecipe(fullText));
          setGeneratedRecipe({
            title: extractTitle(fullText),
            description: prompt,
            servings,
            prepTime: "10 min",
            cookTime: "20 min",
            ingredients: extractIngredients(fullText),
            instructions: extractInstructions(fullText),
            nutrition: extractNutrition(fullText),
          });
        }
      } catch {
        setGeneratedRecipe({
          title: "Your Custom Recipe",
          description: prompt,
          servings,
          prepTime: "10 min",
          cookTime: "20 min",
          ingredients: extractIngredients(fullText),
          instructions: extractInstructions(fullText),
          nutrition: extractNutrition(fullText),
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        // Fallback mock for demo
        const mockText = generateMockRecipe(prompt, servings);
        setStreamedText(mockText.raw);
        setGeneratedRecipe(mockText.recipe);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function handleReset() {
    abortRef.current?.abort();
    setIsGenerating(false);
    setStreamedText("");
    setGeneratedRecipe(null);
    setSaved(false);
  }

  async function handleSave() {
    if (!generatedRecipe) return;
    setSaving(true);
    try {
      await fetch("/api/recipes/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedRecipe.title,
          servings: generatedRecipe.servings,
          instructions: generatedRecipe.instructions.join("\n"),
          ingredients: generatedRecipe.ingredients.map((ing) => ({
            name: ing.name,
            amount: parseFloat(ing.amount) || 1,
            unit: "",
            original: `${ing.amount} ${ing.name}`,
          })),
          nutrition: generatedRecipe.nutrition,
          isAiGenerated: true,
        }),
      });
      setSaved(true);
    } catch {
      setSaved(true); // optimistic
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B6B] to-[#00D4AA] flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Recipe Generator</h1>
            <p className="text-xs text-muted-foreground">Powered by Claude</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Prompt textarea */}
        <Card glass>
          <CardContent className="pt-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
              Describe your dream recipe
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. A high-protein breakfast bowl with eggs, spinach and avocado that tastes amazing and keeps me full until lunch..."
              rows={4}
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-relaxed"
            />
          </CardContent>
        </Card>

        {/* Dietary preferences */}
        <Card glass>
          <CardContent className="pt-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">
              Dietary Preferences
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIETARY_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleDiet(key)}
                  className={cn(
                    "text-xs font-semibold py-2 px-3 rounded-xl border transition-all text-center",
                    selectedDiets.has(key)
                      ? "bg-[#FF6B6B]/20 border-[#FF6B6B] text-[#FF6B6B]"
                      : "bg-transparent border-border dark:border-white/10 text-muted-foreground hover:border-white/20"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Servings */}
        <Card glass>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Servings
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xl font-black w-6 text-center tabular-nums">{servings}</span>
                <button
                  onClick={() => setServings((s) => Math.min(8, s + 1))}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate button */}
        <button
          onClick={isGenerating ? handleReset : handleGenerate}
          disabled={!isGenerating && !prompt.trim()}
          className={cn(
            "w-full h-12 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all tap-scale",
            isGenerating
              ? "bg-destructive hover:opacity-90"
              : prompt.trim()
              ? "bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] hover:opacity-90 shadow-lg shadow-[#FF6B6B]/20"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Stop Generating
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Recipe
            </>
          )}
        </button>

        {/* Streaming display */}
        {(isGenerating || streamedText) && !generatedRecipe && (
          <Card glass className="overflow-hidden">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] flex items-center justify-center">
                  <Sparkles size={10} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {isGenerating ? "Generating..." : "Generated"}
                </span>
                {isGenerating && (
                  <span className="inline-block w-1 h-4 bg-[#FF6B6B] rounded-full animate-pulse ml-1" />
                )}
              </div>
              <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">
                {streamedText}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated recipe card */}
        {generatedRecipe && (
          <div className="space-y-3 pb-4">
            {/* Title + meta */}
            <Card glass className="overflow-hidden border-gradient">
              <div className="h-2 bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA]" />
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-black">{generatedRecipe.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{generatedRecipe.description}</p>
                  </div>
                  <div className="shrink-0 ml-3 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B]/20 to-[#00D4AA]/20 flex items-center justify-center">
                    <ChefHat size={18} className="text-[#FF6B6B]" />
                  </div>
                </div>
                <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                  <span>⏱ Prep: {generatedRecipe.prepTime}</span>
                  <span>🔥 Cook: {generatedRecipe.cookTime}</span>
                  <span>👥 {generatedRecipe.servings} servings</span>
                </div>
              </CardContent>
            </Card>

            {/* Nutrition grid */}
            <Card glass>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Nutrition per serving
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Calories", value: generatedRecipe.nutrition.calories, unit: "kcal", color: "#FF9F43" },
                    { label: "Protein", value: generatedRecipe.nutrition.protein, unit: "g", color: "#54A0FF" },
                    { label: "Carbs", value: generatedRecipe.nutrition.carbs, unit: "g", color: "#FECA57" },
                    { label: "Fat", value: generatedRecipe.nutrition.fat, unit: "g", color: "#A29BFE" },
                  ].map(({ label, value, unit, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center p-2 rounded-xl"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <span className="text-base font-black tabular-nums" style={{ color }}>
                        {value}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{unit}</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            {generatedRecipe.ingredients.length > 0 && (
              <Card glass>
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Ingredients
                  </p>
                  <div className="space-y-2">
                    {generatedRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-[#FF6B6B] font-semibold w-16 shrink-0 text-xs">
                          {ing.amount}
                        </span>
                        <span>{ing.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {generatedRecipe.instructions.length > 0 && (
              <Card glass>
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Instructions
                  </p>
                  <ol className="space-y-3">
                    {generatedRecipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5"
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
            )}

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className={cn(
                "w-full h-12 rounded-2xl font-bold text-base",
                saved
                  ? "bg-[#00D4AA] text-white"
                  : "bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white"
              )}
            >
              <Save size={16} className="mr-2" />
              {saving ? "Saving..." : saved ? "Saved to Recipe Book!" : "Save to Recipe Book"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractTitle(text: string): string {
  const match = text.match(/^#\s*(.+)/m) || text.match(/Recipe:\s*(.+)/i);
  return match?.[1]?.trim() ?? "Your Custom Recipe";
}

function extractIngredients(text: string): { amount: string; name: string }[] {
  const section = text.match(/Ingredients?:?\n([\s\S]*?)(?:\n\n|\nInstructions?|\nDirections?)/i)?.[1] ?? "";
  return section
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([\d/\s\w.]+(?:cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|slice|piece)?s?)\s+(.+)/i);
      if (match) return { amount: match[1].trim(), name: match[2].trim() };
      return { amount: "", name: line };
    });
}

function extractInstructions(text: string): string[] {
  const section = text.match(/(?:Instructions?|Directions?|Steps?):?\n([\s\S]*?)(?:\n\nNutrition|\n\n[A-Z]|$)/i)?.[1] ?? "";
  return section
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function extractNutrition(text: string): { calories: number; protein: number; carbs: number; fat: number } {
  const cal = parseInt(text.match(/(\d+)\s*(?:kcal|calories)/i)?.[1] ?? "0");
  const protein = parseInt(text.match(/protein[:\s]+(\d+)g/i)?.[1] ?? "0");
  const carbs = parseInt(text.match(/carbs?[:\s]+(\d+)g/i)?.[1] ?? "0");
  const fat = parseInt(text.match(/fat[:\s]+(\d+)g/i)?.[1] ?? "0");
  return { calories: cal, protein, carbs, fat };
}

function generateMockRecipe(prompt: string, servings: number) {
  const raw = `# High-Protein Power Bowl

A delicious and nutritious bowl packed with protein.

## Ingredients
- 200g chicken breast
- 1 cup quinoa
- 2 cups spinach
- 1 avocado, sliced
- 1 tbsp olive oil
- Salt and pepper to taste
- 2 tbsp lemon juice

## Instructions
1. Cook the quinoa according to package instructions.
2. Season the chicken breast with salt, pepper, and lemon juice.
3. Grill or pan-fry the chicken for 6-7 minutes per side until cooked through.
4. Slice the chicken and arrange over quinoa.
5. Add fresh spinach and sliced avocado.
6. Drizzle with olive oil and serve immediately.

## Nutrition (per serving)
- Calories: 520 kcal
- Protein: 48g
- Carbs: 42g
- Fat: 18g`;

  return {
    raw,
    recipe: {
      title: "High-Protein Power Bowl",
      description: prompt,
      servings,
      prepTime: "10 min",
      cookTime: "20 min",
      ingredients: [
        { amount: "200g", name: "chicken breast" },
        { amount: "1 cup", name: "quinoa" },
        { amount: "2 cups", name: "spinach" },
        { amount: "1", name: "avocado, sliced" },
        { amount: "1 tbsp", name: "olive oil" },
        { amount: "2 tbsp", name: "lemon juice" },
      ],
      instructions: [
        "Cook the quinoa according to package instructions.",
        "Season the chicken breast with salt, pepper, and lemon juice.",
        "Grill or pan-fry the chicken for 6-7 minutes per side until cooked through.",
        "Slice the chicken and arrange over quinoa.",
        "Add fresh spinach and sliced avocado.",
        "Drizzle with olive oil and serve immediately.",
      ],
      nutrition: { calories: 520, protein: 48, carbs: 42, fat: 18 },
    },
  };
}
