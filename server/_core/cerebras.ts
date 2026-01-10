/**
 * Cerebras API Integration
 * 
 * Cerebras provides ultra-fast inference with generous free tier:
 * - 14,400 requests/day for Llama models
 * - 8,000 tokens/minute rate limit
 * - Models: Llama 3.3 70B, Llama 3.1 8B
 */

import { ENV } from "./env";

const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

export interface CerebrasMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CerebrasOptions {
  model?: string;
  messages: CerebrasMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

export interface CerebrasResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Available Cerebras models
export const CEREBRAS_MODELS = {
  "llama-3.3-70b": "llama-3.3-70b",
  "llama-3.1-8b": "llama3.1-8b",
} as const;

/**
 * Check if Cerebras API is configured
 */
export function isCerebrasConfigured(): boolean {
  return !!process.env.CEREBRAS_API_KEY;
}

/**
 * Invoke Cerebras API for chat completion
 */
export async function invokeCerebras(options: CerebrasOptions): Promise<CerebrasResponse> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  
  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY is not configured");
  }

  const model = options.model || CEREBRAS_MODELS["llama-3.3-70b"];
  
  const response = await fetch(CEREBRAS_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.9,
      stream: options.stream || false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cerebras API error:", response.status, errorText);
    throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data as CerebrasResponse;
}

/**
 * Invoke Cerebras with streaming response
 */
export async function* invokeCerebrasStream(options: CerebrasOptions): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  
  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY is not configured");
  }

  const model = options.model || CEREBRAS_MODELS["llama-3.3-70b"];
  
  const response = await fetch(CEREBRAS_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.9,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

/**
 * Get Cerebras model info for routing
 */
export function getCerebrasModelInfo(modelId: string) {
  const models: Record<string, { name: string; maxTokens: number; speed: "fast" | "medium" | "slow" }> = {
    "llama-3.3-70b-cerebras": {
      name: "Llama 3.3 70B (Cerebras)",
      maxTokens: 8192,
      speed: "fast",
    },
    "llama-3.1-8b-cerebras": {
      name: "Llama 3.1 8B (Cerebras)",
      maxTokens: 8192,
      speed: "fast",
    },
  };
  
  return models[modelId] || null;
}
