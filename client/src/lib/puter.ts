// Puter.js TypeScript types and helper functions
// Puter.js is loaded globally via script tag in index.html

export interface PuterChatOptions {
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
}

export interface PuterImageOptions {
  model?: string;
  size?: string;
  quality?: string;
}

export interface PuterStreamPart {
  text?: string;
}

// Puter models available for free
export const PUTER_TEXT_MODELS = [
  { id: "gpt-5-nano", name: "GPT-5 Nano", description: "Fast, efficient model" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", description: "Balanced performance" },
  { id: "gpt-5", name: "GPT-5", description: "Full GPT-5 capabilities" },
  { id: "gpt-5.1", name: "GPT-5.1", description: "Latest GPT-5.1" },
  { id: "gpt-5.2", name: "GPT-5.2", description: "Newest GPT-5.2" },
  { id: "gpt-4o", name: "GPT-4o", description: "Multimodal GPT-4" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Efficient GPT-4o" },
  { id: "o1", name: "o1", description: "Advanced reasoning" },
  { id: "o1-mini", name: "o1 Mini", description: "Efficient reasoning" },
  { id: "o3", name: "o3", description: "Latest reasoning model" },
  { id: "o3-mini", name: "o3 Mini", description: "Efficient o3" },
] as const;

export const PUTER_IMAGE_MODELS = [
  { id: "gpt-image-1.5", name: "GPT Image 1.5", description: "Latest image generation" },
  { id: "gpt-image-1", name: "GPT Image 1", description: "Standard image generation" },
  { id: "dall-e-3", name: "DALL-E 3", description: "High quality images" },
  { id: "dall-e-2", name: "DALL-E 2", description: "Fast image generation" },
] as const;

// Check if Puter is available
export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && 'puter' in window;
}

// Get the Puter global object
export function getPuter(): any {
  if (!isPuterAvailable()) {
    throw new Error("Puter.js is not loaded. Make sure the script is included in index.html");
  }
  return (window as any).puter;
}

// Chat with Puter AI (non-streaming)
export async function puterChat(
  prompt: string,
  options: PuterChatOptions = {}
): Promise<string> {
  const puter = getPuter();
  const response = await puter.ai.chat(prompt, {
    model: options.model || "gpt-5-nano",
    temperature: options.temperature,
    max_tokens: options.max_tokens,
  });
  return response;
}

// Chat with Puter AI (streaming)
export async function* puterChatStream(
  prompt: string,
  options: PuterChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const puter = getPuter();
  const response = await puter.ai.chat(prompt, {
    model: options.model || "gpt-5-nano",
    stream: true,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
  });
  
  for await (const part of response) {
    if (part?.text) {
      yield part.text;
    }
  }
}

// Chat with conversation history (for multi-turn conversations)
export async function puterChatWithHistory(
  messages: Array<{ role: string; content: string }>,
  options: PuterChatOptions = {}
): Promise<string> {
  const puter = getPuter();
  
  // Puter.ai.chat can accept an array of messages for conversation history
  const response = await puter.ai.chat(messages, {
    model: options.model || "gpt-5-nano",
    temperature: options.temperature,
    max_tokens: options.max_tokens,
  });
  
  return response;
}

// Streaming chat with conversation history
export async function* puterChatWithHistoryStream(
  messages: Array<{ role: string; content: string }>,
  options: PuterChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const puter = getPuter();
  
  const response = await puter.ai.chat(messages, {
    model: options.model || "gpt-5-nano",
    stream: true,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
  });
  
  for await (const part of response) {
    if (part?.text) {
      yield part.text;
    }
  }
}

// Generate image with Puter AI
export async function puterGenerateImage(
  prompt: string,
  options: PuterImageOptions = {}
): Promise<HTMLImageElement> {
  const puter = getPuter();
  const imageElement = await puter.ai.txt2img(prompt, {
    model: options.model || "gpt-image-1.5",
  });
  return imageElement;
}

// Generate image and get URL
export async function puterGenerateImageUrl(
  prompt: string,
  options: PuterImageOptions = {}
): Promise<string> {
  const imageElement = await puterGenerateImage(prompt, options);
  return imageElement.src;
}
