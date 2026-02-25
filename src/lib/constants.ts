export const GROCERY_CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat & Seafood",
  "Bakery",
  "Pantry",
  "Frozen",
  "Beverages",
  "Snacks",
  "Condiments",
  "Other",
] as const;

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const DIET_OPTIONS = [
  "Gluten Free",
  "Ketogenic",
  "Vegetarian",
  "Vegan",
  "Pescetarian",
  "Paleo",
  "Whole30",
  "Dairy Free",
] as const;

export const CUISINE_OPTIONS = [
  "American",
  "Chinese",
  "Italian",
  "Japanese",
  "Korean",
  "Mexican",
  "Thai",
  "Indian",
  "Mediterranean",
  "French",
] as const;

export const MACRO_COLORS = {
  calories: "#FF9F43",
  protein: "#54A0FF",
  carbs: "#FECA57",
  fat: "#A29BFE",
} as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Recipes", href: "/recipes", icon: "ChefHat" },
  { label: "Grocery", href: "/grocery", icon: "ShoppingCart" },
  { label: "Track", href: "/track", icon: "Target" },
  { label: "Insights", href: "/insights", icon: "TrendingUp" },
] as const;
