import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!key) {
    return NextResponse.json({ status: "NO_ANTHROPIC_KEY", openaiKey: !!openaiKey });
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: "claude-haiku-4-20250514",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say OK." }],
    });
    const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
    return NextResponse.json({
      status: "OK",
      provider: "anthropic",
      reply,
      keyPrefix: key.slice(0, 12) + "...",
      openaiQuotaExceeded: true,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    return NextResponse.json({
      status: "ERROR",
      message: error.message,
      httpStatus: error.status,
      keyPrefix: key.slice(0, 12) + "...",
    });
  }
}
