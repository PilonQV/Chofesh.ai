/**
 * Unified AI Providers Service
 * 
 * Integrates all high-priority free AI providers:
 * - P0: Groq, OpenRouter (existing), Perplexity-style search
 * - P1: Cerebras, Cloudflare Workers AI, Google AI Studio
 * 
 * Provides automatic fallback, health monitoring, and unified interface
 */

import { ENV } from "./env";

// ============================================================================
// Types
// ============================================================================

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  id: string;
  provider: AIProvider;
  model: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached?: boolean;
}

export type AIProvider = 
  | "groq" 
  | "openrouter" 
  | "cerebras" 
  | "cloudflare" 
  | "google" 
  | "puter";

export interface ProviderConfig {
  name: string;
  displayName: string;
  apiUrl: string;
  models: ModelConfig[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMinute?: number;
  };
  requiresApiKey: boolean;
  isFree: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  isFree: boolean;
  isReasoning?: boolean;
  isVision?: boolean;
  tier: "free" | "standard" | "premium";
}

// ============================================================================
// Provider Configurations
// ============================================================================

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  groq: {
    name: "groq",
    displayName: "Groq",
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    models: [
      // Flagship Models
      { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B", provider: "groq", contextWindow: 131072, isFree: true, tier: "free" },
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", contextWindow: 131072, isFree: true, tier: "free" },
      
      // Fast & Efficient Models
      { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B", provider: "groq", contextWindow: 131072, isFree: true, tier: "free" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", provider: "groq", contextWindow: 131072, isFree: true, tier: "free" },
      
      // AI Agent Systems
      { id: "groq/compound", name: "Groq Compound (Web Search + Code)", provider: "groq", contextWindow: 131072, isFree: true, tier: "free", isReasoning: true },
      { id: "groq/compound-mini", name: "Groq Compound Mini", provider: "groq", contextWindow: 131072, isFree: true, tier: "free", isReasoning: true },
      
      // Safety & Moderation
      { id: "meta-llama/llama-guard-4-12b", name: "Llama Guard 4 12B", provider: "groq", contextWindow: 131072, isFree: true, tier: "free" },
      { id: "meta-llama/llama-prompt-guard-2-86m", name: "Prompt Guard 2 86M", provider: "groq", contextWindow: 512, isFree: true, tier: "free" },
      { id: "meta-llama/llama-prompt-guard-2-22m", name: "Prompt Guard 2 22M", provider: "groq", contextWindow: 512, isFree: true, tier: "free" },
      
      // Legacy Models (for compatibility)
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "groq", contextWindow: 32768, isFree: true, tier: "free" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B", provider: "groq", contextWindow: 8192, isFree: true, tier: "free" },
    ],
    rateLimit: { requestsPerMinute: 1000, requestsPerDay: 14400, tokensPerMinute: 250000 },
    requiresApiKey: true,
    isFree: true,
  },
  
  openrouter: {
    name: "openrouter",
    displayName: "OpenRouter",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    models: [
      { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1", provider: "openrouter", contextWindow: 64000, isFree: true, isReasoning: true, tier: "free" },
      { id: "meta-llama/llama-3.1-405b-instruct:free", name: "Llama 3.1 405B", provider: "openrouter", contextWindow: 128000, isFree: true, tier: "free" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", provider: "openrouter", contextWindow: 128000, isFree: true, tier: "free" },
      { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", provider: "openrouter", contextWindow: 8192, isFree: true, tier: "free" },
      { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1 24B", provider: "openrouter", contextWindow: 32768, isFree: true, tier: "free" },
      { id: "qwen/qwen-2.5-vl-7b-instruct:free", name: "Qwen 2.5 VL 7B", provider: "openrouter", contextWindow: 32768, isFree: true, isVision: true, tier: "free" },
      { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Venice Uncensored", provider: "openrouter", contextWindow: 32768, isFree: true, tier: "free" },
      { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 405B", provider: "openrouter", contextWindow: 128000, isFree: true, tier: "free" },
      { id: "moonshotai/kimi-k2:free", name: "Kimi K2", provider: "openrouter", contextWindow: 128000, isFree: true, tier: "free" },
      // NEW models (January 2026)
      { id: "xiaomi/mimo-v2-flash:free", name: "Xiaomi MiMo-V2-Flash", provider: "openrouter", contextWindow: 262000, isFree: true, isReasoning: true, tier: "free" },
      { id: "mistralai/devstral-2-2512:free", name: "Mistral Devstral 2", provider: "openrouter", contextWindow: 262000, isFree: true, tier: "free" },
      { id: "tngtech/deepseek-r1t2-chimera:free", name: "TNG DeepSeek R1T2 Chimera", provider: "openrouter", contextWindow: 164000, isFree: true, isReasoning: true, tier: "free" },
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash Exp", provider: "openrouter", contextWindow: 1050000, isFree: true, isVision: true, tier: "free" },
      { id: "qwen/qwen3-coder-480b-a35b:free", name: "Qwen3 Coder 480B", provider: "openrouter", contextWindow: 262000, isFree: true, tier: "free" },
    ],
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 50 },
    requiresApiKey: true,
    isFree: true,
  },
  
  cerebras: {
    name: "cerebras",
    displayName: "Cerebras",
    apiUrl: "https://api.cerebras.ai/v1/chat/completions",
    models: [
      { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "cerebras", contextWindow: 128000, isFree: true, tier: "free" },
      { id: "llama3.1-8b", name: "Llama 3.1 8B", provider: "cerebras", contextWindow: 128000, isFree: true, tier: "free" },
      { id: "qwen-3-32b", name: "Qwen 3 32B", provider: "cerebras", contextWindow: 32768, isFree: true, tier: "free" },
    ],
    rateLimit: { requestsPerMinute: 30, requestsPerDay: 14400, tokensPerMinute: 60000 },
    requiresApiKey: true,
    isFree: true,
  },
  
  cloudflare: {
    name: "cloudflare",
    displayName: "Cloudflare Workers AI",
    apiUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/",
    models: [
      { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", name: "Llama 3.3 70B", provider: "cloudflare", contextWindow: 8192, isFree: true, tier: "free" },
      { id: "@cf/meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B", provider: "cloudflare", contextWindow: 8192, isFree: true, tier: "free" },
      { id: "@cf/google/gemma-3-12b-it", name: "Gemma 3 12B", provider: "cloudflare", contextWindow: 8192, isFree: true, tier: "free" },
      { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", name: "DeepSeek R1 Distill", provider: "cloudflare", contextWindow: 32768, isFree: true, isReasoning: true, tier: "free" },
      { id: "@cf/mistral/mistral-small-3.1-24b-instruct", name: "Mistral Small 3.1", provider: "cloudflare", contextWindow: 32768, isFree: true, tier: "free" },
    ],
    rateLimit: { requestsPerMinute: 100, requestsPerDay: 10000 },
    requiresApiKey: true,
    isFree: true,
  },
  
  google: {
    name: "google",
    displayName: "Google AI Studio",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google", contextWindow: 1000000, isFree: true, tier: "free" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "google", contextWindow: 1000000, isFree: true, tier: "free" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google", contextWindow: 2000000, isFree: true, tier: "free" },
      { id: "gemma-3-27b-it", name: "Gemma 3 27B", provider: "google", contextWindow: 8192, isFree: true, tier: "free" },
    ],
    rateLimit: { requestsPerMinute: 15, requestsPerDay: 1500 },
    requiresApiKey: true,
    isFree: true,
  },
  
  puter: {
    name: "puter",
    displayName: "Puter.js (Client-side)",
    apiUrl: "https://js.puter.com/v2/",
    models: [
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "puter", contextWindow: 128000, isFree: true, tier: "free" },
      { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "puter", contextWindow: 200000, isFree: true, tier: "free" },
      { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "puter", contextWindow: 1000000, isFree: true, tier: "free" },
      { id: "deepseek-chat", name: "DeepSeek Chat", provider: "puter", contextWindow: 64000, isFree: true, tier: "free" },
      { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "puter", contextWindow: 128000, isFree: true, tier: "free" },
    ],
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 100000 },
    requiresApiKey: false,
    isFree: true,
  },
};

// ============================================================================
// Provider Health Tracking
// ============================================================================

interface ProviderHealth {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  lastError?: string;
}

const providerHealth: Record<AIProvider, ProviderHealth> = {
  groq: { isHealthy: true, lastCheck: 0, consecutiveFailures: 0 },
  openrouter: { isHealthy: true, lastCheck: 0, consecutiveFailures: 0 },
  cerebras: { isHealthy: true, lastCheck: 0, consecutiveFailures: 0 },
  cloudflare: { isHealthy: true, lastCheck: 0, consecutiveFailures: 0 },
  google: { isHealthy: true, lastCheck: 0, consecutiveFailures: 0 },
  puter: { isHealthy: true, lastCheck: 0, consecutiveFailures: 0 },
};

function markProviderHealthy(provider: AIProvider) {
  providerHealth[provider] = {
    isHealthy: true,
    lastCheck: Date.now(),
    consecutiveFailures: 0,
  };
}

function markProviderUnhealthy(provider: AIProvider, error: string) {
  const current = providerHealth[provider];
  providerHealth[provider] = {
    isHealthy: current.consecutiveFailures >= 2 ? false : true,
    lastCheck: Date.now(),
    consecutiveFailures: current.consecutiveFailures + 1,
    lastError: error,
  };
}

export function getProviderHealth(): Record<AIProvider, ProviderHealth> {
  return { ...providerHealth };
}

// ============================================================================
// Provider Implementations
// ============================================================================

/**
 * Invoke Groq API
 */
async function invokeGroq(options: AICompletionOptions): Promise<AICompletionResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const model = options.model || "llama-3.3-70b-versatile";
  
  const response = await fetch(PROVIDER_CONFIGS.groq.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  markProviderHealthy("groq");
  
  return {
    id: data.id,
    provider: "groq",
    model,
    content: data.choices[0]?.message?.content || "",
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Invoke OpenRouter API
 */
async function invokeOpenRouter(options: AICompletionOptions): Promise<AICompletionResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const model = options.model || "deepseek/deepseek-r1-0528:free";
  
  const response = await fetch(PROVIDER_CONFIGS.openrouter.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chofesh.ai",
      "X-Title": "Chofesh.ai",
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  markProviderHealthy("openrouter");
  
  return {
    id: data.id,
    provider: "openrouter",
    model,
    content: data.choices[0]?.message?.content || "",
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Invoke Cerebras API
 */
async function invokeCerebras(options: AICompletionOptions): Promise<AICompletionResponse> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) throw new Error("CEREBRAS_API_KEY not configured");

  const model = options.model || "llama-3.3-70b";
  
  const response = await fetch(PROVIDER_CONFIGS.cerebras.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  markProviderHealthy("cerebras");
  
  return {
    id: data.id,
    provider: "cerebras",
    model,
    content: data.choices[0]?.message?.content || "",
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Invoke Cloudflare Workers AI
 */
async function invokeCloudflare(options: AICompletionOptions): Promise<AICompletionResponse> {
  const apiToken = process.env.CLOUDFLARE_WORKERS_TOKEN || process.env.cloudflare_api_key;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  if (!apiToken) throw new Error("CLOUDFLARE_WORKERS_TOKEN not configured");
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID not configured");

  const model = options.model || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      messages: options.messages,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  markProviderHealthy("cloudflare");
  
  return {
    id: `cf-${Date.now()}`,
    provider: "cloudflare",
    model,
    content: data.result?.response || "",
  };
}

/**
 * Invoke Google AI Studio (Gemini)
 */
async function invokeGoogle(options: AICompletionOptions): Promise<AICompletionResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");

  const model = options.model || "gemini-2.0-flash";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  // Convert messages to Gemini format
  const contents = options.messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  
  // Add system instruction if present
  const systemMessage = options.messages.find(m => m.role === "system");
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  markProviderHealthy("google");
  
  return {
    id: `google-${Date.now()}`,
    provider: "google",
    model,
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    usage: data.usageMetadata ? {
      promptTokens: data.usageMetadata.promptTokenCount || 0,
      completionTokens: data.usageMetadata.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata.totalTokenCount || 0,
    } : undefined,
  };
}

// ============================================================================
// Unified Provider Interface
// ============================================================================

const providerInvokers: Record<AIProvider, (options: AICompletionOptions) => Promise<AICompletionResponse>> = {
  groq: invokeGroq,
  openrouter: invokeOpenRouter,
  cerebras: invokeCerebras,
  cloudflare: invokeCloudflare,
  google: invokeGoogle,
  puter: async () => { throw new Error("Puter.js is client-side only"); },
};

/**
 * Invoke AI completion with automatic fallback
 */
export async function invokeAICompletion(
  options: AICompletionOptions & { provider?: AIProvider; fallbackProviders?: AIProvider[] }
): Promise<AICompletionResponse> {
  const { provider, fallbackProviders = ["groq", "openrouter", "cerebras"], ...completionOptions } = options;
  
  // If specific provider requested, try it first
  if (provider && provider !== "puter") {
    try {
      return await providerInvokers[provider](completionOptions);
    } catch (error) {
      markProviderUnhealthy(provider, error instanceof Error ? error.message : "Unknown error");
      console.error(`Provider ${provider} failed:`, error);
      // Fall through to fallback providers
    }
  }
  
  // Try fallback providers in order
  for (const fallbackProvider of fallbackProviders) {
    if (fallbackProvider === "puter") continue; // Skip Puter (client-side only)
    if (!providerHealth[fallbackProvider].isHealthy) continue;
    
    try {
      return await providerInvokers[fallbackProvider](completionOptions);
    } catch (error) {
      markProviderUnhealthy(fallbackProvider, error instanceof Error ? error.message : "Unknown error");
      console.error(`Fallback provider ${fallbackProvider} failed:`, error);
    }
  }
  
  throw new Error("All AI providers failed. Please try again later.");
}

/**
 * Get all available models across all providers
 */
export function getAllAvailableModels(): ModelConfig[] {
  const models: ModelConfig[] = [];
  
  for (const [providerName, config] of Object.entries(PROVIDER_CONFIGS)) {
    // Check if provider is configured
    const isConfigured = isProviderConfigured(providerName as AIProvider);
    if (isConfigured || providerName === "puter") {
      models.push(...config.models);
    }
  }
  
  return models;
}

/**
 * Check if a provider is properly configured
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  switch (provider) {
    case "groq":
      return !!process.env.GROQ_API_KEY;
    case "openrouter":
      return !!process.env.OPENROUTER_API_KEY;
    case "cerebras":
      return !!process.env.CEREBRAS_API_KEY;
    case "cloudflare":
      return !!(process.env.CLOUDFLARE_WORKERS_TOKEN || process.env.cloudflare_api_key) && !!process.env.CLOUDFLARE_ACCOUNT_ID;
    case "google":
      return !!(process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY);
    case "puter":
      return true; // Always available (client-side)
    default:
      return false;
  }
}

/**
 * Get configured providers
 */
export function getConfiguredProviders(): AIProvider[] {
  return (Object.keys(PROVIDER_CONFIGS) as AIProvider[]).filter(isProviderConfigured);
}

/**
 * Get provider display info
 */
export function getProviderInfo(provider: AIProvider) {
  return PROVIDER_CONFIGS[provider];
}
