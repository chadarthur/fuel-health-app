import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { FOOD_PHOTO_ANALYSIS_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const hasApiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!hasApiKey) {
      return NextResponse.json(
        { error: "No AI API key configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to your environment." },
        { status: 503 }
      );
    }

    // Use OpenAI for vision (best in class) or fallback to Anthropic
    const provider = getAIProvider(process.env.OPENAI_API_KEY ? "openai" : "anthropic");

    const result = await provider.complete({
      messages: [
        { role: "system", content: FOOD_PHOTO_ANALYSIS_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
            },
            { type: "text", text: "Please analyze this food image and provide nutritional estimates." },
          ],
        },
      ],
      maxTokens: 1000,
      temperature: 0.3,
    });

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Photo analysis error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
