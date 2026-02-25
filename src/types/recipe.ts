export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  original: string;
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface Recipe {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  summary?: string;
  sourceUrl?: string;
  nutrition: RecipeNutrition;
  cuisines?: string[];
  diets?: string[];
}

export interface RecipeDetail extends Recipe {
  instructions?: string;
  ingredients: RecipeIngredient[];
}

export interface SavedRecipeData {
  id: string;
  spoonacularId?: number;
  title: string;
  image?: string;
  summary?: string;
  sourceUrl?: string;
  readyInMinutes?: number;
  servings?: number;
  instructions?: string;
  ingredients: RecipeIngredient[];
  nutrition: RecipeNutrition;
  cuisines?: string[];
  diets?: string[];
  isAiGenerated: boolean;
  createdAt: string;
}

export interface RecipeSearchParams {
  q?: string;
  diet?: string;
  cuisine?: string;
  includeIngredients?: string;
  excludeIngredients?: string;
  offset?: number;
  number?: number;
}

export interface RecipeSearchResult {
  results: Recipe[];
  totalResults: number;
}
