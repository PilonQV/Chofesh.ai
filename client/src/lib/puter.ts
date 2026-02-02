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

// Puter models available for free - organized by provider
export const PUTER_TEXT_MODELS = [
  // OpenAI Models
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", description: "Fast, efficient model", provider: "OpenAI" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", description: "Balanced performance", provider: "OpenAI" },
  { id: "gpt-4.1", name: "GPT-4.1", description: "Full GPT-4.1 capabilities", provider: "OpenAI" },
  { id: "gpt-4o", name: "GPT-4o", description: "Multimodal GPT-4", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Efficient GPT-4o", provider: "OpenAI" },
  { id: "o1", name: "o1", description: "Advanced reasoning", provider: "OpenAI" },
  { id: "o1-mini", name: "o1 Mini", description: "Efficient reasoning", provider: "OpenAI" },
  { id: "o3", name: "o3", description: "Latest reasoning model", provider: "OpenAI" },
  { id: "o3-mini", name: "o3 Mini", description: "Efficient o3", provider: "OpenAI" },
  
  // Anthropic Models (All FREE & UNLIMITED via Puter)
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", description: "Latest & most capable Claude", provider: "Anthropic" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", description: "Most powerful Claude model", provider: "Anthropic" },
  { id: "claude-opus-4-1", name: "Claude Opus 4.1", description: "Powerful Claude Opus", provider: "Anthropic" },
  { id: "claude-opus-4", name: "Claude Opus 4", description: "Advanced Claude Opus", provider: "Anthropic" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", description: "Balanced Claude model", provider: "Anthropic" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", description: "Fastest Claude model", provider: "Anthropic" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Previous gen Claude", provider: "Anthropic" },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Fast Claude 3", provider: "Anthropic" },
  
  // Google Models
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Latest Gemini model", provider: "Google" },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Fast Gemini model", provider: "Google" },
  { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Powerful Gemini", provider: "Google" },
  
  // Meta Models
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", description: "Latest Llama model", provider: "Meta" },
  { id: "meta-llama/llama-3.1-405b-instruct", name: "Llama 3.1 405B", description: "Most powerful Llama", provider: "Meta" },
  
  // DeepSeek Models
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat", description: "DeepSeek conversational", provider: "DeepSeek" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", description: "DeepSeek reasoning", provider: "DeepSeek" },
  
  // Mistral Models
  { id: "mistralai/mistral-large-latest", name: "Mistral Large", description: "Most capable Mistral", provider: "Mistral" },
  { id: "mistralai/mistral-small-latest", name: "Mistral Small", description: "Fast Mistral model", provider: "Mistral" },
  
  // Qwen Models
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", description: "Powerful Qwen model", provider: "Alibaba" },
  { id: "qwen/qwen-2.5-coder-32b-instruct", name: "Qwen 2.5 Coder", description: "Coding specialist", provider: "Alibaba" },
] as const;

export const PUTER_IMAGE_MODELS = [
  { id: "gpt-image-1.5", name: "Advanced Image Model", description: "Latest image generation" },
  { id: "gpt-image-1", name: "Standard Image Model", description: "Standard image generation" },
  { id: "dall-e-3", name: "High Quality Model", description: "High quality images" },
  { id: "dall-e-2", name: "Fast Model", description: "Fast image generation" },
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
