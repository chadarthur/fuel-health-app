import type { GroceryCategory } from "@/lib/constants";

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  Produce: [
    "apple", "banana", "orange", "lemon", "lime", "grape", "berry", "berries",
    "tomato", "tomatoes", "cucumber", "lettuce", "spinach", "kale", "arugula",
    "broccoli", "cauliflower", "carrot", "carrots", "celery", "onion", "onions",
    "garlic", "ginger", "pepper", "peppers", "zucchini", "squash", "potato",
    "potatoes", "sweet potato", "mushroom", "mushrooms", "avocado", "mango",
    "pineapple", "strawberry", "blueberry", "raspberry", "peach", "pear",
    "watermelon", "melon", "corn", "peas", "green beans", "asparagus", "artichoke",
    "beet", "beets", "radish", "leek", "shallot", "herbs", "basil", "cilantro",
    "parsley", "mint", "thyme", "rosemary", "sage", "dill", "scallion",
  ],
  "Dairy": [
    "milk", "cream", "half and half", "butter", "cheese", "cheddar", "mozzarella",
    "parmesan", "feta", "brie", "gouda", "swiss", "yogurt", "greek yogurt",
    "sour cream", "cream cheese", "cottage cheese", "ricotta", "whipped cream",
    "heavy cream", "almond milk", "oat milk", "soy milk",
  ],
  "Meat & Seafood": [
    "chicken", "beef", "steak", "ground beef", "pork", "bacon", "ham", "sausage",
    "turkey", "lamb", "veal", "duck", "salmon", "tuna", "tilapia", "cod",
    "shrimp", "lobster", "crab", "scallop", "fish", "seafood", "meatball",
    "chicken breast", "chicken thigh", "ground turkey", "hot dog",
  ],
  Bakery: [
    "bread", "baguette", "roll", "bun", "bagel", "muffin", "croissant",
    "tortilla", "wrap", "pita", "naan", "sourdough", "brioche", "rye",
    "whole wheat bread", "english muffin",
  ],
  Pantry: [
    "rice", "pasta", "noodle", "quinoa", "oats", "oatmeal", "flour", "sugar",
    "salt", "pepper", "oil", "olive oil", "vegetable oil", "coconut oil",
    "vinegar", "soy sauce", "hot sauce", "ketchup", "mustard", "mayo",
    "mayonnaise", "honey", "maple syrup", "vanilla", "baking powder", "baking soda",
    "yeast", "cornstarch", "almond flour", "breadcrumbs", "panko", "beans",
    "lentils", "chickpeas", "black beans", "kidney beans", "canned tomatoes",
    "tomato paste", "chicken broth", "beef broth", "vegetable broth", "coconut milk",
    "peanut butter", "almond butter", "tahini", "jam", "jelly", "cereal",
    "granola", "protein powder", "nuts", "almonds", "walnuts", "cashews",
    "peanuts", "seeds", "chia", "flax", "sunflower", "pumpkin seeds",
  ],
  Frozen: [
    "frozen", "ice cream", "popsicle", "frozen vegetables", "frozen fruit",
    "frozen pizza", "edamame", "frozen peas", "frozen corn",
  ],
  Beverages: [
    "juice", "water", "sparkling water", "soda", "coffee", "tea", "energy drink",
    "sports drink", "kombucha", "wine", "beer", "almond milk",
  ],
  Snacks: [
    "chip", "chips", "cracker", "crackers", "popcorn", "pretzel", "pretzels",
    "cookie", "cookies", "chocolate", "candy", "gummy", "bar", "protein bar",
    "granola bar", "rice cake",
  ],
  Condiments: [
    "dressing", "salsa", "guacamole", "relish", "worcestershire", "oyster sauce",
    "fish sauce", "sriracha", "tabasco", "bbq sauce", "teriyaki", "aioli",
    "hummus", "tzatziki",
  ],
  Other: [],
};

export function categorizeIngredient(name: string): GroceryCategory {
  const lower = name.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "Other") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return category as GroceryCategory;
    }
  }

  return "Other";
}

interface ParsedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

const UNIT_PATTERNS = [
  "cups?", "tbsp", "tablespoons?", "tsp", "teaspoons?",
  "oz", "ounces?", "lbs?", "pounds?", "g", "grams?", "kg",
  "ml", "liters?", "l", "qt", "quarts?", "pt", "pints?",
  "slices?", "pieces?", "cloves?", "stalks?", "heads?", "cans?",
  "packages?", "bags?", "bunches?", "sprigs?", "pinch(?:es)?",
];

const UNIT_REGEX = new RegExp(
  `^([\\d./\\s¼½¾⅓⅔⅛⅜⅝⅞]+)\\s*(${UNIT_PATTERNS.join("|")})\\.?\\s+(.+)$`,
  "i"
);

const QUANTITY_REGEX = /^([\d./\s¼½¾⅓⅔⅛⅜⅝⅞]+)\s+(.+)$/;

const FRACTION_MAP: Record<string, number> = {
  "¼": 0.25, "½": 0.5, "¾": 0.75,
  "⅓": 0.333, "⅔": 0.667,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

function parseFraction(str: string): number {
  let result = 0;
  const cleaned = str.trim();

  for (const [frac, val] of Object.entries(FRACTION_MAP)) {
    if (cleaned.includes(frac)) {
      result += val;
    }
  }

  const numericPart = cleaned.replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, "").trim();
  if (numericPart) {
    if (numericPart.includes("/")) {
      const [num, den] = numericPart.split("/");
      result += parseFloat(num) / parseFloat(den);
    } else {
      result += parseFloat(numericPart) || 0;
    }
  }

  return result;
}

export function parseIngredient(text: string): ParsedIngredient {
  const cleaned = text.trim();

  // Try: "2 cups diced tomatoes" or "1/2 tsp salt"
  const unitMatch = cleaned.match(UNIT_REGEX);
  if (unitMatch) {
    return {
      quantity: parseFraction(unitMatch[1]),
      unit: unitMatch[2].toLowerCase(),
      name: unitMatch[3].trim(),
    };
  }

  // Try: "2 chicken breasts"
  const qtyMatch = cleaned.match(QUANTITY_REGEX);
  if (qtyMatch) {
    const qtyStr = qtyMatch[1].trim();
    const qty = parseFraction(qtyStr);
    if (!isNaN(qty) && qty > 0) {
      return { quantity: qty, unit: null, name: qtyMatch[2].trim() };
    }
  }

  return { quantity: null, unit: null, name: cleaned };
}

export function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  const lower = unit.toLowerCase();
  const map: Record<string, string> = {
    tablespoons: "tbsp", tablespoon: "tbsp",
    teaspoons: "tsp", teaspoon: "tsp",
    cups: "cup",
    ounces: "oz", ounce: "oz",
    pounds: "lb", pound: "lb",
    grams: "g", gram: "g",
    kilograms: "kg",
    milliliters: "ml",
    liters: "L",
  };
  return map[lower] || lower;
}
