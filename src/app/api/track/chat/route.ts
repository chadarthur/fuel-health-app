import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { MEAL_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { AIMessage } from "@/types/ai";

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

async function buildContextualSystemPrompt(userId: string, date: string): Promise<string> {
  try {
    // Fetch today's macro data and saved recipes in parallel
    const [goalsRow, todayMeals, savedRecipes] = await Promise.all([
      prisma.macroGoal.findUnique({ where: { userId } }),
      prisma.mealEntry.findMany({
        where: {
          userId,
          loggedAt: {
            gte: new Date(`${date}T00:00:00.000Z`),
            lte: new Date(`${date}T23:59:59.999Z`),
          },
        },
      }),
      prisma.savedRecipe.findMany({
        where: { userId },
        select: { id: true, title: true, nutrition: true },
        orderBy: { createdAt: "desc" },
        take: 20, // limit to keep prompt concise
      }),
    ]);

    const goals = goalsRow
      ? { calories: goalsRow.calories, protein: goalsRow.protein, carbs: goalsRow.carbs, fat: goalsRow.fat }
      : DEFAULT_GOALS;

    const consumed = todayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const remaining = {
      calories: Math.max(0, goals.calories - consumed.calories),
      protein: Math.max(0, goals.protein - consumed.protein),
      carbs: Math.max(0, goals.carbs - consumed.carbs),
      fat: Math.max(0, goals.fat - consumed.fat),
    };

    // Build saved recipes list
    let savedRecipesText = "No saved recipes yet.";
    if (savedRecipes.length > 0) {
      const recipeLines = savedRecipes.map((r) => {
        try {
          const n = typeof r.nutrition === "string" ? JSON.parse(r.nutrition) : r.nutrition;
          return `- ${r.title} (${Math.round(n.calories ?? 0)} cal, ${Math.round(n.protein ?? 0)}g P, ${Math.round(n.carbs ?? 0)}g C, ${Math.round(n.fat ?? 0)}g F) [id: ${r.id}]`;
        } catch {
          return `- ${r.title} [id: ${r.id}]`;
        }
      });
      savedRecipesText = recipeLines.join("\n");
    }

    const contextBlock = `--- TODAY'S NUTRITION CONTEXT ---
Date: ${date}
Goals: ${goals.calories} cal | ${goals.protein}g protein | ${goals.carbs}g carbs | ${goals.fat}g fat
Consumed so far: ${Math.round(consumed.calories)} cal | ${Math.round(consumed.protein)}g protein | ${Math.round(consumed.carbs)}g carbs | ${Math.round(consumed.fat)}g fat
Remaining: ${Math.round(remaining.calories)} cal | ${Math.round(remaining.protein)}g protein | ${Math.round(remaining.carbs)}g carbs | ${Math.round(remaining.fat)}g fat
Meals logged today: ${todayMeals.length}

User's saved recipes (suggest these first if they fit):
${savedRecipesText}
--- END CONTEXT ---

`;

    return contextBlock + MEAL_CHAT_SYSTEM_PROMPT;
  } catch (err) {
    console.error("[chat] Failed to build context:", err);
    return MEAL_CHAT_SYSTEM_PROMPT;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    const { messages = [], date } = body;
    const today = date || new Date().toISOString().split("T")[0];

    console.log("[chat] received messages count:", messages.length);
    console.log("[chat] last user message:", messages[messages.length - 1]?.content?.slice(0, 100));

    const hasApiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!hasApiKey) {
      console.log("[chat] USING MOCK - no API key found");
      const mockReply = getMockReply(messages[messages.length - 1]?.content || "");
      return NextResponse.json({ reply: mockReply });
    }

    // Build system prompt with today's macro context + saved recipes
    const systemPrompt = await buildContextualSystemPrompt(userId, today);

    const aiMessages: AIMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const provider = getAIProvider("anthropic");
    let result;
    try {
      result = await provider.complete({
        messages: [
          { role: "system", content: systemPrompt },
          ...aiMessages,
        ],
        maxTokens: 1200,
        temperature: 0.7,
      });
    } catch (aiErr: unknown) {
      const e = aiErr as { message?: string; status?: number; code?: string };
      console.error("[chat] AI error:", e.message, "status:", e.status);
      return NextResponse.json({ error: `AI error: ${e.message}` }, { status: 500 });
    }

    return NextResponse.json({ reply: result.content });
  } catch (err) {
    console.error("[chat] error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}

function getMockReply(lastMessage: string): string {
  const lower = lastMessage.toLowerCase();

  if (lower.includes("suggest") || lower.includes("what should") || lower.includes("recipe") || lower.includes("dinner") || lower.includes("lunch") || lower.includes("breakfast")) {
    return `Here are some great options to hit your protein goals! 💪\n\n<recipe_suggestion>{"name":"Grilled Chicken & Quinoa Bowl","calories":580,"protein":52,"carbs":48,"fat":14,"fromSaved":false,"recipeId":null,"reason":"Covers most of your remaining protein gap with complex carbs"}</recipe_suggestion>\n<recipe_suggestion>{"name":"Greek Salmon Salad","calories":480,"protein":44,"carbs":18,"fat":24,"fromSaved":false,"recipeId":null,"reason":"High protein, low carb — perfect if you're close to your carb goal"}</recipe_suggestion>`;
  }
  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hey! 👋 I'm FUEL, your nutrition AI. Tell me what you ate, or ask me to suggest recipes based on your remaining macros!";
  }
  if (lower.includes("chicken") || lower.includes("salad") || lower.includes("rice")) {
    return `That sounds delicious! 🍽️ Let me estimate those macros for you.\n\nBased on what you described, I'm estimating around 450 calories, 38g protein, 42g carbs, and 12g fat.\n\nWant me to log this as lunch?`;
  }
  if (lower.includes("yes") || lower.includes("log") || lower.includes("save")) {
    return `Logged! 💪 Great meal — solid protein hit.\n\n<meal_log>{"name":"Tracked Meal","calories":450,"protein":38,"carbs":42,"fat":12,"mealType":"lunch"}</meal_log>\n\nKeep it up! What else have you had today?`;
  }

  return "Tell me what you ate and I'll help you track those macros! 🎯 Or ask me to suggest a recipe based on your remaining macros for the day.";
}
