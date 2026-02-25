export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | AIContentPart[];
}

export interface AIContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail?: "low" | "high" };
}

export interface AICompletionOptions {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  responseFormat?: "text" | "json";
}

export interface AICompletionResult {
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AIProvider {
  complete(options: AICompletionOptions): Promise<AICompletionResult>;
  stream(options: AICompletionOptions): Promise<ReadableStream<string>>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mealData?: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
