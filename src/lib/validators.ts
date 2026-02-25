import { z } from "zod";

export const recipeSearchSchema = z.object({
  q: z.string().optional(),
  diet: z.string().optional(),
  cuisine: z.string().optional(),
  includeIngredients: z.string().optional(),
  excludeIngredients: z.string().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  number: z.coerce.number().int().positive().max(24).optional(),
});

export const groceryItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  category: z.string().optional(),
});

export const mealEntrySchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().optional(),
  sugar: z.number().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  source: z.enum(["manual", "photo", "text", "chat"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
  loggedAt: z.string().datetime().optional(),
});

export const macroGoalSchema = z.object({
  calories: z.number().positive().max(10000),
  protein: z.number().nonnegative().max(1000),
  carbs: z.number().nonnegative().max(1000),
  fat: z.number().nonnegative().max(1000),
});

export const textAnalysisSchema = z.object({
  text: z.string().min(2).max(2000),
});

export type RecipeSearchInput = z.infer<typeof recipeSearchSchema>;
export type GroceryItemInput = z.infer<typeof groceryItemSchema>;
export type MealEntryInput = z.infer<typeof mealEntrySchema>;
export type MacroGoalInput = z.infer<typeof macroGoalSchema>;
export type TextAnalysisInput = z.infer<typeof textAnalysisSchema>;
