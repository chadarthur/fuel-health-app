import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { RECIPE_GENERATION_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, dietary = [], servings = 4 } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const hasApiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

    if (!hasApiKey) {
      // Return mock streamed recipe
      const mockRecipe = getMockRecipe(prompt);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(mockRecipe)));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    const userMessage = `Create a recipe based on: "${prompt}"
Dietary preferences: ${dietary.length ? dietary.join(", ") : "none specified"}
Number of servings: ${servings}`;

    const provider = getAIProvider();
    const stream = await provider.stream({
      messages: [
        { role: "system", content: RECIPE_GENERATION_PROMPT },
        { role: "user", content: userMessage },
      ],
      maxTokens: 2000,
      temperature: 0.7,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Recipe generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function getMockRecipe(prompt: string) {
  return {
    title: `AI-Generated Recipe: ${prompt.slice(0, 30)}`,
    description: "A delicious, nutritious recipe crafted just for you with perfectly balanced macros.",
    readyInMinutes: 35,
    servings: 4,
    cuisines: ["International"],
    diets: [],
    ingredients: [
      { name: "chicken breast", amount: 500, unit: "g", original: "500g chicken breast" },
      { name: "mixed vegetables", amount: 400, unit: "g", original: "400g mixed vegetables" },
      { name: "olive oil", amount: 3, unit: "tbsp", original: "3 tbsp olive oil" },
      { name: "garlic cloves", amount: 4, unit: "whole", original: "4 garlic cloves, minced" },
      { name: "sea salt", amount: 1, unit: "tsp", original: "1 tsp sea salt" },
      { name: "black pepper", amount: 0.5, unit: "tsp", original: "½ tsp black pepper" },
    ],
    instructions: "1. Prepare all ingredients and preheat your pan over medium-high heat.\n2. Heat olive oil in a large skillet and add minced garlic.\n3. Add chicken and cook for 6-7 minutes per side until golden.\n4. Add vegetables and cook for 5-6 minutes until tender-crisp.\n5. Season with salt and pepper to taste.\n6. Serve immediately and enjoy!",
    nutrition: {
      calories: 380,
      protein: 42,
      carbs: 18,
      fat: 14,
      fiber: 5,
      sugar: 4,
    },
  };
}
