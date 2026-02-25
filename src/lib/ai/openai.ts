import OpenAI from "openai";
import type {
  AIProvider,
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIContentPart,
} from "@/types/ai";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

type OpenAIMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } }
    >;

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: OpenAIMessageContent;
}

function mapContentPart(
  part: AIContentPart
): { type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "low" | "high" | "auto" } } {
  if (part.type === "text") {
    return { type: "text", text: part.text || "" };
  }
  return {
    type: "image_url",
    image_url: {
      url: part.image_url?.url || "",
      detail: part.image_url?.detail || "auto",
    },
  };
}

function mapMessages(messages: AIMessage[]): OpenAIChatMessage[] {
  return messages.map((msg) => {
    if (typeof msg.content === "string") {
      return {
        role: msg.role,
        content: msg.content,
      };
    }

    return {
      role: msg.role,
      content: msg.content.map(mapContentPart),
    };
  });
}

export const openaiProvider: AIProvider = {
  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const client = getClient();
    const mappedMessages = mapMessages(options.messages);

    const response = await client.chat.completions.create({
      model: options.model || DEFAULT_MODEL,
      messages: mappedMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      ...(options.responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
    });

    const choice = response.choices[0];

    return {
      content: choice?.message?.content || "",
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  },

  async stream(options: AICompletionOptions): Promise<ReadableStream<string>> {
    const client = getClient();
    const mappedMessages = mapMessages(options.messages);

    const response = await client.chat.completions.create({
      model: options.model || DEFAULT_MODEL,
      messages: mappedMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
      ...(options.responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(delta);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  },
};
