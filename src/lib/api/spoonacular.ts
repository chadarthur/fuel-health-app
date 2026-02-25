import type {
  Recipe,
  RecipeDetail,
  RecipeSearchParams,
  RecipeSearchResult,
  RecipeIngredient,
  RecipeNutrition,
} from "@/types/recipe";

const BASE_URL = "https://api.spoonacular.com";

function getApiKey(): string | null {
  return process.env.SPOONACULAR_API_KEY || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseNutrition(nutrients: any[]): RecipeNutrition {
  const find = (name: string) =>
    nutrients?.find(
      (n: { name: string }) =>
        n.name.toLowerCase() === name.toLowerCase()
    )?.amount ?? 0;

  return {
    calories: Math.round(find("Calories")),
    protein: Math.round(find("Protein") * 10) / 10,
    carbs: Math.round(find("Carbohydrates") * 10) / 10,
    fat: Math.round(find("Fat") * 10) / 10,
    fiber: Math.round(find("Fiber") * 10) / 10,
    sugar: Math.round(find("Sugar") * 10) / 10,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRecipe(r: any): Recipe {
  const nutrients = r.nutrition?.nutrients || [];
  return {
    id: r.id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes,
    servings: r.servings,
    summary: r.summary?.replace(/<[^>]*>/g, "") ?? "",
    sourceUrl: r.sourceUrl,
    nutrition: parseNutrition(nutrients),
    cuisines: r.cuisines || [],
    diets: r.diets || [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformIngredient(ing: any): RecipeIngredient {
  return {
    name: ing.name || ing.nameClean || "",
    amount: ing.measures?.metric?.amount || ing.amount || 0,
    unit: ing.measures?.metric?.unitShort || ing.unit || "",
    original: ing.original || `${ing.amount} ${ing.unit} ${ing.name}`,
  };
}

export async function searchRecipes(
  params: RecipeSearchParams
): Promise<RecipeSearchResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("SPOONACULAR_API_KEY not set — returning mock data");
    return getMockSearchResults(params.q || "");
  }

  const query = new URLSearchParams({
    apiKey,
    query: params.q || "",
    number: String(params.number || 12),
    offset: String(params.offset || 0),
    addRecipeNutrition: "true",
    fillIngredients: "false",
    ...(params.diet && { diet: params.diet }),
    ...(params.cuisine && { cuisine: params.cuisine }),
    ...(params.includeIngredients && {
      includeIngredients: params.includeIngredients,
    }),
    ...(params.excludeIngredients && {
      excludeIngredients: params.excludeIngredients,
    }),
  });

  const res = await fetch(`${BASE_URL}/recipes/complexSearch?${query}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);

  const data = await res.json();
  return {
    results: (data.results || []).map(transformRecipe),
    totalResults: data.totalResults || 0,
  };
}

export async function getRecipeById(id: number): Promise<RecipeDetail> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return getMockRecipeDetail(id);
  }

  const query = new URLSearchParams({
    apiKey,
    includeNutrition: "true",
    addWinePairing: "false",
  });

  const res = await fetch(
    `${BASE_URL}/recipes/${id}/information?${query}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);

  const data = await res.json();
  const nutrients = data.nutrition?.nutrients || [];

  return {
    ...transformRecipe(data),
    instructions: data.instructions || data.analyzedInstructions
      ?.flatMap((block: { steps: { step: string }[] }) =>
        block.steps.map((s: { step: string }) => s.step)
      )
      .map((step: string, i: number) => `${i + 1}. ${step}`)
      .join("\n") || "",
    ingredients: (data.extendedIngredients || []).map(transformIngredient),
    nutrition: parseNutrition(nutrients),
  };
}

// ─── Mock data for development without API key ───────────────────────────────

function getMockSearchResults(query: string): RecipeSearchResult {
  const recipes: Recipe[] = [
    {
      id: 1001,
      title: "Grilled Chicken & Quinoa Power Bowl",
      image: "https://img.spoonacular.com/recipes/715538-556x370.jpg",
      readyInMinutes: 30,
      servings: 2,
      summary: "A high-protein, nutrient-dense bowl perfect for post-workout recovery.",
      cuisines: ["American"],
      diets: ["Gluten Free", "Dairy Free"],
      nutrition: { calories: 520, protein: 42, carbs: 48, fat: 14, fiber: 8 },
    },
    {
      id: 1002,
      title: "Salmon Avocado Salad",
      image: "https://img.spoonacular.com/recipes/715540-556x370.jpg",
      readyInMinutes: 20,
      servings: 1,
      summary: "Rich in omega-3s and healthy fats to support brain health.",
      cuisines: ["Mediterranean"],
      diets: ["Gluten Free"],
      nutrition: { calories: 480, protein: 35, carbs: 18, fat: 32, fiber: 9 },
    },
    {
      id: 1003,
      title: "Turkey & Sweet Potato Meal Prep",
      image: "https://img.spoonacular.com/recipes/715539-556x370.jpg",
      readyInMinutes: 45,
      servings: 4,
      summary: "Perfect for weekly meal prep — lean protein with complex carbs.",
      cuisines: ["American"],
      diets: ["Gluten Free", "Dairy Free"],
      nutrition: { calories: 410, protein: 38, carbs: 35, fat: 10, fiber: 5 },
    },
    {
      id: 1004,
      title: "Greek Yogurt Overnight Oats",
      image: "https://img.spoonacular.com/recipes/715541-556x370.jpg",
      readyInMinutes: 10,
      servings: 1,
      summary: "High-protein breakfast ready in minutes.",
      cuisines: ["American"],
      diets: ["Vegetarian"],
      nutrition: { calories: 380, protein: 22, carbs: 55, fat: 8, fiber: 7 },
    },
    {
      id: 1005,
      title: "Egg White Omelette with Spinach",
      image: "https://img.spoonacular.com/recipes/715542-556x370.jpg",
      readyInMinutes: 15,
      servings: 1,
      summary: "Low calorie, high protein breakfast classic.",
      cuisines: ["American"],
      diets: ["Vegetarian", "Gluten Free"],
      nutrition: { calories: 220, protein: 28, carbs: 6, fat: 8, fiber: 2 },
    },
    {
      id: 1006,
      title: "Lentil & Vegetable Curry",
      image: "https://img.spoonacular.com/recipes/715543-556x370.jpg",
      readyInMinutes: 40,
      servings: 4,
      summary: "Plant-based protein packed with fiber and aromatic spices.",
      cuisines: ["Indian"],
      diets: ["Vegan", "Gluten Free"],
      nutrition: { calories: 320, protein: 18, carbs: 52, fat: 6, fiber: 14 },
    },
  ].filter(
    (r) =>
      !query ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.cuisines?.some((c) =>
        c.toLowerCase().includes(query.toLowerCase())
      )
  );

  return { results: recipes, totalResults: recipes.length };
}

function getMockRecipeDetail(id: number): RecipeDetail {
  return {
    id,
    title: "Grilled Chicken & Quinoa Power Bowl",
    image: "https://img.spoonacular.com/recipes/715538-556x370.jpg",
    readyInMinutes: 30,
    servings: 2,
    summary: "A high-protein, nutrient-dense bowl perfect for post-workout recovery. This balanced meal combines lean grilled chicken with quinoa and fresh vegetables.",
    cuisines: ["American"],
    diets: ["Gluten Free", "Dairy Free"],
    nutrition: { calories: 520, protein: 42, carbs: 48, fat: 14, fiber: 8, sugar: 4 },
    instructions:
      "1. Cook quinoa according to package instructions.\n2. Season chicken breast with olive oil, salt, pepper, garlic powder.\n3. Grill chicken on medium-high heat for 6-7 minutes per side.\n4. Let chicken rest 5 minutes, then slice.\n5. Assemble bowls with quinoa, sliced chicken, cherry tomatoes, cucumber, and avocado.\n6. Drizzle with lemon tahini dressing and serve.",
    ingredients: [
      { name: "chicken breast", amount: 300, unit: "g", original: "300g boneless chicken breast" },
      { name: "quinoa", amount: 180, unit: "g", original: "180g dry quinoa" },
      { name: "cherry tomatoes", amount: 150, unit: "g", original: "150g cherry tomatoes, halved" },
      { name: "cucumber", amount: 1, unit: "medium", original: "1 medium cucumber, diced" },
      { name: "avocado", amount: 1, unit: "whole", original: "1 ripe avocado, sliced" },
      { name: "olive oil", amount: 2, unit: "tbsp", original: "2 tbsp olive oil" },
      { name: "lemon", amount: 1, unit: "whole", original: "1 lemon, juiced" },
      { name: "tahini", amount: 2, unit: "tbsp", original: "2 tbsp tahini" },
    ],
  };
}
