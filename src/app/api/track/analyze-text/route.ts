import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { FOOD_TEXT_ANALYSIS_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

    const hasApiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

    if (!hasApiKey) {
      return NextResponse.json(getMockAnalysis(text));
    }

    const provider = getAIProvider();
    const result = await provider.complete({
      messages: [
        { role: "system", content: FOOD_TEXT_ANALYSIS_PROMPT },
        { role: "user", content: text },
      ],
      maxTokens: 1000,
      temperature: 0.3,
    });

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Text analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

function getMockAnalysis(text: string) {
  const lower = text.toLowerCase();
  const foods = [];

  if (lower.includes("chicken")) {
    foods.push({ name: "Grilled Chicken Breast", portionDescription: "6 oz", calories: 280, protein: 53, carbs: 0, fat: 6, confidence: 0.9 });
  }
  if (lower.includes("salad")) {
    foods.push({ name: "Mixed Green Salad", portionDescription: "2 cups", calories: 35, protein: 2, carbs: 7, fat: 0, confidence: 0.85 });
  }
  if (lower.includes("rice")) {
    foods.push({ name: "White Rice", portionDescription: "1 cup cooked", calories: 206, protein: 4, carbs: 45, fat: 0, confidence: 0.9 });
  }
  if (lower.includes("egg") || lower.includes("eggs")) {
    foods.push({ name: "Scrambled Eggs", portionDescription: "2 large eggs", calories: 182, protein: 12, carbs: 2, fat: 14, confidence: 0.95 });
  }
  if (lower.includes("oat") || lower.includes("oatmeal")) {
    foods.push({ name: "Oatmeal", portionDescription: "1 cup cooked", calories: 158, protein: 6, carbs: 27, fat: 3, confidence: 0.9 });
  }
  if (lower.includes("protein") && lower.includes("shake")) {
    foods.push({ name: "Protein Shake", portionDescription: "1 scoop", calories: 120, protein: 25, carbs: 3, fat: 2, confidence: 0.88 });
  }

  if (foods.length === 0) {
    foods.push({ name: "Mixed Meal", portionDescription: "1 serving", calories: 450, protein: 30, carbs: 45, fat: 15, confidence: 0.6 });
  }

  const totalMacros = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { foods, totalMacros };
}
