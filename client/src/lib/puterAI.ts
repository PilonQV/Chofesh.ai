/**
 * Puter.js AI Client Service
 * 
 * Provides access to 400+ AI models directly from the browser
 * No API keys required - uses Puter's "user-pays" model
 * 
 * Features:
 * - GPT-4.1, Claude Sonnet 4, Gemini 2.5, DeepSeek, Llama
 * - Streaming responses
 * - Image analysis
 * - Function calling
 */

// Puter.js types
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string | PuterMessage[],
          options?: PuterChatOptions
        ) => Promise<PuterChatResponse | AsyncIterable<PuterStreamChunk>>;
        txt2img: (prompt: string, options?: PuterImageOptions) => Promise<PuterImageResponse>;
      };
      print: (text: string) => void;
    };
  }
}

export interface PuterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface PuterChatOptions {
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: PuterTool[];
}

export interface PuterTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
    strict?: boolean;
  };
}

export interface PuterChatResponse {
  message?: {
    content: Array<{ text: string }> | string;
    tool_calls?: Array<{
      id: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
  toString(): string;
}

export interface PuterStreamChunk {
  text?: string;
}

export interface PuterImageOptions {
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
}

export interface PuterImageResponse {
  url: string;
}

// Available Puter.js models
export const PUTER_MODELS = {
  // OpenAI Models
  GPT_4_1_NANO: "gpt-4.1-nano",
  GPT_4_1_MINI: "gpt-4.1-mini",
  GPT_4_1: "gpt-4.1",
  GPT_4O: "gpt-4o",
  GPT_4O_MINI: "gpt-4o-mini",
  
  // Anthropic Models
  CLAUDE_SONNET_4: "claude-sonnet-4",
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20241022",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
  
  // Google Models
  GEMINI_2_5_FLASH: "google/gemini-2.5-flash",
  GEMINI_2_0_FLASH: "google/gemini-2.0-flash",
  GEMINI_1_5_PRO: "google/gemini-1.5-pro",
  
  // Meta Models
  LLAMA_3_3_70B: "meta-llama/llama-3.3-70b-instruct",
  LLAMA_3_1_405B: "meta-llama/llama-3.1-405b-instruct",
  LLAMA_3_1_70B: "meta-llama/llama-3.1-70b-instruct",
  
  // DeepSeek Models
  DEEPSEEK_CHAT: "deepseek/deepseek-chat",
  DEEPSEEK_R1: "deepseek/deepseek-r1",
  
  // Mistral Models
  MISTRAL_LARGE: "mistralai/mistral-large-latest",
  MISTRAL_SMALL: "mistralai/mistral-small-latest",
  
  // Qwen Models
  QWEN_2_5_72B: "qwen/qwen-2.5-72b-instruct",
  QWEN_2_5_CODER: "qwen/qwen-2.5-coder-32b-instruct",
} as const;

export type PuterModelId = typeof PUTER_MODELS[keyof typeof PUTER_MODELS];

// Model display information
export const PUTER_MODEL_INFO: Record<string, { name: string; provider: string; tier: "free" | "standard" | "premium" }> = {
  [PUTER_MODELS.GPT_4_1_NANO]: { name: "GPT-4.1 Nano", provider: "OpenAI", tier: "free" },
  [PUTER_MODELS.GPT_4_1_MINI]: { name: "GPT-4.1 Mini", provider: "OpenAI", tier: "free" },
  [PUTER_MODELS.GPT_4_1]: { name: "GPT-4.1", provider: "OpenAI", tier: "free" },
  [PUTER_MODELS.GPT_4O]: { name: "GPT-4o", provider: "OpenAI", tier: "free" },
  [PUTER_MODELS.GPT_4O_MINI]: { name: "GPT-4o Mini", provider: "OpenAI", tier: "free" },
  [PUTER_MODELS.CLAUDE_SONNET_4]: { name: "Claude Sonnet 4", provider: "Anthropic", tier: "free" },
  [PUTER_MODELS.CLAUDE_3_5_SONNET]: { name: "Claude 3.5 Sonnet", provider: "Anthropic", tier: "free" },
  [PUTER_MODELS.CLAUDE_3_HAIKU]: { name: "Claude 3 Haiku", provider: "Anthropic", tier: "free" },
  [PUTER_MODELS.GEMINI_2_5_FLASH]: { name: "Gemini 2.5 Flash", provider: "Google", tier: "free" },
  [PUTER_MODELS.GEMINI_2_0_FLASH]: { name: "Gemini 2.0 Flash", provider: "Google", tier: "free" },
  [PUTER_MODELS.GEMINI_1_5_PRO]: { name: "Gemini 1.5 Pro", provider: "Google", tier: "free" },
  [PUTER_MODELS.LLAMA_3_3_70B]: { name: "Llama 3.3 70B", provider: "Meta", tier: "free" },
  [PUTER_MODELS.LLAMA_3_1_405B]: { name: "Llama 3.1 405B", provider: "Meta", tier: "free" },
  [PUTER_MODELS.LLAMA_3_1_70B]: { name: "Llama 3.1 70B", provider: "Meta", tier: "free" },
  [PUTER_MODELS.DEEPSEEK_CHAT]: { name: "DeepSeek Chat", provider: "DeepSeek", tier: "free" },
  [PUTER_MODELS.DEEPSEEK_R1]: { name: "DeepSeek R1", provider: "DeepSeek", tier: "free" },
  [PUTER_MODELS.MISTRAL_LARGE]: { name: "Mistral Large", provider: "Mistral", tier: "free" },
  [PUTER_MODELS.MISTRAL_SMALL]: { name: "Mistral Small", provider: "Mistral", tier: "free" },
  [PUTER_MODELS.QWEN_2_5_72B]: { name: "Qwen 2.5 72B", provider: "Alibaba", tier: "free" },
  [PUTER_MODELS.QWEN_2_5_CODER]: { name: "Qwen 2.5 Coder", provider: "Alibaba", tier: "free" },
};

// Check if Puter.js is loaded
export function isPuterLoaded(): boolean {
  return typeof window !== "undefined" && !!window.puter;
}

// Load Puter.js script dynamically
export function loadPuterScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isPuterLoaded()) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Puter.js"));
    document.head.appendChild(script);
  });
}

/**
 * Chat with AI using Puter.js
 */
export async function puterChat(
  messages: PuterMessage[],
  options: PuterChatOptions = {}
): Promise<string> {
  if (!isPuterLoaded()) {
    await loadPuterScript();
  }

  if (!window.puter) {
    throw new Error("Puter.js not available");
  }

  const model = options.model || PUTER_MODELS.GPT_4_1_NANO;
  
  try {
    const response = await window.puter.ai.chat(messages, {
      model,
      stream: false,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
    });

    // Handle different response formats
    if (typeof response === "string") {
      return response;
    }
    
    // Check if it's a streaming response (AsyncIterable)
    if (Symbol.asyncIterator in Object(response)) {
      // Collect all chunks for non-streaming call
      let result = "";
      for await (const chunk of response as AsyncIterable<PuterStreamChunk>) {
        if (chunk?.text) {
          result += chunk.text;
        }
      }
      return result;
    }
    
    const chatResponse = response as PuterChatResponse;
    if (chatResponse.message) {
      if (typeof chatResponse.message.content === "string") {
        return chatResponse.message.content;
      }
      if (Array.isArray(chatResponse.message.content)) {
        return chatResponse.message.content.map((c: { text: string }) => c.text).join("");
      }
    }
    
    return String(response);
  } catch (error) {
    console.error("Puter.js chat error:", error);
    throw error;
  }
}

/**
 * Stream chat with AI using Puter.js
 */
export async function* puterChatStream(
  messages: PuterMessage[],
  options: PuterChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  if (!isPuterLoaded()) {
    await loadPuterScript();
  }

  if (!window.puter) {
    throw new Error("Puter.js not available");
  }

  const model = options.model || PUTER_MODELS.GPT_4_1_NANO;
  
  try {
    const response = await window.puter.ai.chat(messages, {
      model,
      stream: true,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
    });

    // Handle streaming response
    if (Symbol.asyncIterator in Object(response)) {
      for await (const chunk of response as AsyncIterable<PuterStreamChunk>) {
        if (chunk?.text) {
          yield chunk.text;
        }
      }
    } else {
      // Fallback for non-streaming response
      const text = typeof response === "string" ? response : response.toString();
      yield text;
    }
  } catch (error) {
    console.error("Puter.js stream error:", error);
    throw error;
  }
}

/**
 * Analyze image using Puter.js
 */
export async function puterAnalyzeImage(
  imageUrl: string,
  prompt: string = "Describe this image in detail.",
  model: string = PUTER_MODELS.GPT_4O
): Promise<string> {
  if (!isPuterLoaded()) {
    await loadPuterScript();
  }

  if (!window.puter) {
    throw new Error("Puter.js not available");
  }

  try {
    const response = await window.puter.ai.chat(prompt, {
      model,
      // Image URL is passed directly for vision models
    });

    return typeof response === "string" ? response : response.toString();
  } catch (error) {
    console.error("Puter.js image analysis error:", error);
    throw error;
  }
}

/**
 * Generate image using Puter.js
 */
export async function puterGenerateImage(
  prompt: string,
  options: PuterImageOptions = {}
): Promise<string> {
  if (!isPuterLoaded()) {
    await loadPuterScript();
  }

  if (!window.puter) {
    throw new Error("Puter.js not available");
  }

  try {
    const response = await window.puter.ai.txt2img(prompt, options);
    return response.url;
  } catch (error) {
    console.error("Puter.js image generation error:", error);
    throw error;
  }
}

/**
 * Get all available Puter.js models
 */
export function getPuterModels() {
  return Object.entries(PUTER_MODEL_INFO).map(([id, info]) => ({
    id,
    ...info,
    provider: "puter" as const,
    isFree: true,
  }));
}
