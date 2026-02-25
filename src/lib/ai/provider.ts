import type { AIProvider } from "@/types/ai";
import { anthropicProvider } from "./anthropic";
import { openaiProvider } from "./openai";

export function getAIProvider(
  provider?: "openai" | "anthropic"
): AIProvider {
  const chosen =
    provider ??
    (process.env.AI_DEFAULT_PROVIDER as "openai" | "anthropic" | undefined) ??
    "anthropic";

  return chosen === "openai" ? openaiProvider : anthropicProvider;
}
