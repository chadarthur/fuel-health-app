import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { MEAL_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { AIMessage } from "@/types/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [] } = body;

    console.log("[chat] received messages count:", messages.length);
    console.log("[chat] last user message:", messages[messages.length - 1]?.content?.slice(0, 100));

    const hasApiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    console.log("[chat] hasApiKey:", !!hasApiKey, "OPENAI:", !!process.env.OPENAI_API_KEY);

    if (!hasApiKey) {
      console.log("[chat] USING MOCK - no API key found");
      const mockReply = getMockReply(messages[messages.length - 1]?.content || "");
      return NextResponse.json({ reply: mockReply });
    }

    const aiMessages: AIMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    console.log("[chat] calling OpenAI with", aiMessages.length, "messages");

    const provider = getAIProvider("anthropic");
    let result;
    try {
      result = await provider.complete({
        messages: [
          { role: "system", content: MEAL_CHAT_SYSTEM_PROMPT },
          ...aiMessages,
        ],
        maxTokens: 1000,
        temperature: 0.7,
      });
    } catch (aiErr: unknown) {
      const e = aiErr as { message?: string; status?: number; code?: string };
      console.error("[chat] Anthropic error:", e.message, "status:", e.status, "code:", e.code);
      return NextResponse.json({ error: `AI error: ${e.message}` }, { status: 500 });
    }

    console.log("[chat] OpenAI reply (first 200 chars):", result.content.slice(0, 200));

    return NextResponse.json({ reply: result.content });
  } catch (err) {
    console.error("[chat] error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}

function getMockReply(lastMessage: string): string {
  const lower = lastMessage.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hey! 👋 I'm FUEL, your nutrition AI. What did you eat today? I'll help you track your macros!";
  }
  if (lower.includes("chicken") || lower.includes("salad") || lower.includes("rice")) {
    return `That sounds delicious! 🍽️ Let me estimate those macros for you.\n\nBased on what you described, I'm estimating around 450 calories, 38g protein, 42g carbs, and 12g fat.\n\nWant me to log this as lunch?`;
  }
  if (lower.includes("yes") || lower.includes("log") || lower.includes("save")) {
    return `Logged! 💪 Great meal — solid protein hit.\n\n<meal_log>{"name":"Tracked Meal","calories":450,"protein":38,"carbs":42,"fat":12,"mealType":"lunch"}</meal_log>\n\nKeep it up! What else have you had today?`;
  }

  return "Tell me what you ate and I'll help you track those macros! 🎯 You can describe your meal in natural language — like 'I had two scrambled eggs with toast and coffee'.";
}
