import { MealType } from "@/lib/constants";

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealEntryData {
  id: string;
  name: string;
  description?: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  imageUrl?: string;
  source: "manual" | "photo" | "text" | "chat";
  confidence?: number;
  loggedAt: string;
}

export interface DailySummary {
  date: string;
  totals: MacroTotals;
  goals: MacroGoals;
  meals: MealEntryData[];
}

export interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

export interface PhotoAnalysisResult {
  foods: FoodAnalysis[];
  totalMacros: MacroTotals;
}
