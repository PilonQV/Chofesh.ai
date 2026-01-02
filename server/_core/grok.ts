/**
 * Grok API Integration (xAI)
 * 
 * Uses OpenAI-compatible API format
 * Requires GROK_API_KEY environment variable
 */

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokRequest {
  model: string;
  messages: GrokMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface GrokResponse {
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

export async function invokeGrok(params: {
  messages: GrokMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<GrokResponse> {
  // Try both possible env var names
  const apiKey = process.env.X_ai_key || process.env.GROK_API_KEY;
  
  if (!apiKey) {
    throw new Error("X_ai_key or GROK_API_KEY environment variable is not set");
  }

  const model = params.model || "grok-3-fast";
  
  const request: GrokRequest = {
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 4096,
    stream: false,
  };

  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  return await response.json() as GrokResponse;
}

/**
 * Check if Grok API is available (API key is set)
 */
export function isGrokAvailable(): boolean {
  return !!(process.env.X_ai_key || process.env.GROK_API_KEY);
}
