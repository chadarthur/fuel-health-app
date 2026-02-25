import { GroceryCategory } from "@/lib/constants";

export interface GroceryItemData {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: GroceryCategory;
  checked: boolean;
  recipeId?: string;
  recipeTitle?: string;
  createdAt: string;
}

export interface GroceryGrouped {
  [category: string]: GroceryItemData[];
}

export interface AddGroceryItemInput {
  name: string;
  quantity?: number;
  unit?: string;
  category?: GroceryCategory;
}
