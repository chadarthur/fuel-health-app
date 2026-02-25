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
      return NextResponse.json(getMockPhotoAnalysis());
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
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

function getMockPhotoAnalysis() {
  return {
    foods: [
      { name: "Grilled Chicken Breast", portionDescription: "6 oz", calories: 280, protein: 53, carbs: 0, fat: 6, confidence: 0.88 },
      { name: "Steamed Broccoli", portionDescription: "1 cup", calories: 55, protein: 4, carbs: 11, fat: 1, confidence: 0.92 },
      { name: "Brown Rice", portionDescription: "¾ cup cooked", calories: 165, protein: 4, carbs: 35, fat: 1, confidence: 0.85 },
    ],
    totalMacros: { calories: 500, protein: 61, carbs: 46, fat: 8 },
  };
}
