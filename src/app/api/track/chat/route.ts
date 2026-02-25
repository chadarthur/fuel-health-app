import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { MEAL_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { AIMessage } from "@/types/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [] } = body;

    const hasApiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

    if (!hasApiKey) {
      // Mock streaming response
      const mockReply = getMockReply(messages[messages.length - 1]?.content || "");
      const stream = new ReadableStream({
        start(controller) {
          const chunks = mockReply.match(/.{1,10}/g) || [mockReply];
          let i = 0;
          const interval = setInterval(() => {
            if (i < chunks.length) {
              controller.enqueue(new TextEncoder().encode(chunks[i]));
              i++;
            } else {
              clearInterval(interval);
              controller.close();
            }
          }, 30);
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    const aiMessages: AIMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const provider = getAIProvider("anthropic");
    const stream = await provider.stream({
      messages: [
        { role: "system", content: MEAL_CHAT_SYSTEM_PROMPT },
        ...aiMessages,
      ],
      maxTokens: 1000,
      temperature: 0.7,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}

function getMockReply(lastMessage: string): string {
  const lower = lastMessage.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hey! 👋 I'm FUEL, your nutrition AI. What did you eat today? I'll help you track your macros!";
  }
  if (lower.includes("chicken") || lower.includes("salad") || lower.includes("rice")) {
    return `That sounds delicious! 🍽️ Let me estimate those macros for you.

Based on what you described, I'm estimating around 450 calories, 38g protein, 42g carbs, and 12g fat.

Want me to log this as lunch?`;
  }
  if (lower.includes("yes") || lower.includes("log") || lower.includes("save")) {
    return `Logged! 💪 Great meal — solid protein hit.

<meal_log>{"name":"Tracked Meal","calories":450,"protein":38,"carbs":42,"fat":12,"mealType":"lunch"}</meal_log>

Keep it up! What else have you had today?`;
  }

  return "Tell me what you ate and I'll help you track those macros! 🎯 You can describe your meal in natural language — like 'I had two scrambled eggs with toast and coffee'.";
}
