import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIContentPart,
} from "@/types/ai";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

function getClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        data: string;
      };
    };

function extractMediaType(
  url: string
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:(image\/\w+);/);
    if (match) {
      const type = match[1] as string;
      if (
        type === "image/jpeg" ||
        type === "image/png" ||
        type === "image/gif" ||
        type === "image/webp"
      ) {
        return type;
      }
    }
  }

  if (url.includes(".png")) return "image/png";
  if (url.includes(".gif")) return "image/gif";
  if (url.includes(".webp")) return "image/webp";
  return "image/jpeg";
}

function extractBase64Data(url: string): string {
  if (url.startsWith("data:")) {
    const commaIndex = url.indexOf(",");
    if (commaIndex !== -1) {
      return url.substring(commaIndex + 1);
    }
  }
  return url;
}

function mapContentPart(part: AIContentPart): AnthropicContentBlock {
  if (part.type === "text") {
    return { type: "text", text: part.text || "" };
  }

  const imageUrl = part.image_url?.url || "";
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: extractMediaType(imageUrl),
      data: extractBase64Data(imageUrl),
    },
  };
}

function mapMessages(messages: AIMessage[]): {
  system: string | undefined;
  messages: Anthropic.MessageParam[];
} {
  let system: string | undefined;
  const mapped: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // Anthropic expects system messages in a separate parameter
      const text =
        typeof msg.content === "string"
          ? msg.content
          : msg.content
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("\n");
      system = system ? `${system}\n\n${text}` : text;
      continue;
    }

    if (typeof msg.content === "string") {
      mapped.push({
        role: msg.role,
        content: msg.content,
      });
    } else {
      mapped.push({
        role: msg.role,
        content: msg.content.map(mapContentPart) as Anthropic.ContentBlockParam[],
      });
    }
  }

  return { system, messages: mapped };
}

export const anthropicProvider: AIProvider = {
  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const client = getClient();
    const { system, messages } = mapMessages(options.messages);

    const response = await client.messages.create({
      model: options.model || DEFAULT_MODEL,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      ...(system ? { system } : {}),
      messages,
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const content = textBlocks.map((block) => block.text).join("");

    return {
      content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
      },
    };
  },

  async stream(options: AICompletionOptions): Promise<ReadableStream<string>> {
    const client = getClient();
    const { system, messages } = mapMessages(options.messages);

    const stream = client.messages.stream({
      model: options.model || DEFAULT_MODEL,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      ...(system ? { system } : {}),
      messages,
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(event.delta.text);
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
