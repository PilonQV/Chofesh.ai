/**
 * Smart Model Router for LibreAI
 * 
 * Provides intelligent model selection based on:
 * - Query complexity analysis
 * - User tier/preferences
 * - Cost optimization
 * - Free tier support via Groq
 */

import { ENV } from "./_core/env";
import crypto from "crypto";

// Model definitions with tiers and costs
export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  provider: "platform" | "groq" | "openai" | "anthropic" | "grok" | "openrouter";
  tier: "free" | "standard" | "premium";
  costPer1kInput: number;
  costPer1kOutput: number;
  maxTokens: number;
  supportsVision: boolean;
  speed: "fast" | "medium" | "slow";
  isReasoningModel?: boolean; // For complex reasoning tasks
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  // DeepSeek R1 Free - Best for complex reasoning (FREE via OpenRouter)
  {
    id: "deepseek-r1-free",
    name: "DeepSeek R1 (Free)",
    description: "Best for complex reasoning, math, code - FREE",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 64000,
    supportsVision: false,
    speed: "slow",
    isReasoningModel: true,
  },
  // Grok - xAI (Most up-to-date, Aug 2025 training)
  {
    id: "grok-3-fast",
    name: "Grok 3 Fast",
    description: "Most up-to-date (Aug 2025), fast & affordable",
    provider: "grok" as any,
    tier: "standard",
    costPer1kInput: 0.0002,
    costPer1kOutput: 0.0005,
    maxTokens: 131072,
    supportsVision: true,
    speed: "fast",
  },
  {
    id: "grok-3",
    name: "Grok 3",
    description: "Most capable Grok model (Aug 2025 training)",
    provider: "grok" as any,
    tier: "premium",
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    maxTokens: 131072,
    supportsVision: true,
    speed: "medium",
  },
  // Free tier - Groq (Llama models)
  {
    id: "llama-3.1-8b",
    name: "Llama 3.1 8B",
    description: "Fast, free, great for simple tasks",
    provider: "groq",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    supportsVision: false,
    speed: "fast",
  },
  {
    id: "llama-3.1-70b",
    name: "Llama 3.1 70B",
    description: "Powerful, free, excellent reasoning",
    provider: "groq",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    supportsVision: false,
    speed: "medium",
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral 8x7B",
    description: "Fast mixture-of-experts, free",
    provider: "groq",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 32768,
    supportsVision: false,
    speed: "fast",
  },
  // Standard tier - Platform models
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and cost-effective",
    provider: "platform",
    tier: "standard",
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    maxTokens: 128000,
    supportsVision: true,
    speed: "fast",
  },
  // Premium tier
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Most capable, multimodal",
    provider: "platform",
    tier: "premium",
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    maxTokens: 128000,
    supportsVision: true,
    speed: "medium",
  },
  {
    id: "default",
    name: "GPT-4",
    description: "Balanced performance",
    provider: "platform",
    tier: "premium",
    costPer1kInput: 0.03,
    costPer1kOutput: 0.06,
    maxTokens: 8192,
    supportsVision: false,
    speed: "slow",
  },
];

// Query complexity levels
export type ComplexityLevel = "simple" | "medium" | "complex";

// Routing mode
export type RoutingMode = "auto" | "free" | "manual";

/**
 * Analyze query complexity based on various factors
 */
export function analyzeQueryComplexity(messages: { role: string; content: string }[]): ComplexityLevel {
  const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
  const totalLength = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 0), 0);
  const messageCount = messages.length;
  
  // Complexity indicators
  const complexityIndicators = {
    // Code-related keywords
    hasCode: /```|function|class|import|export|const |let |var |def |async |await |return /.test(lastUserMessage),
    // Analysis/reasoning keywords
    hasAnalysis: /analyze|compare|explain why|reason|evaluate|assess|critique|review/.test(lastUserMessage.toLowerCase()),
    // Creative/long-form keywords
    hasCreative: /write a story|write an essay|create a|design a|develop a|build a/.test(lastUserMessage.toLowerCase()),
    // Math/logic keywords
    hasMath: /calculate|solve|equation|formula|proof|theorem|algorithm/.test(lastUserMessage.toLowerCase()),
    // Simple query indicators
    isSimple: /^(what is|who is|when|where|how to|define|list|name|translate)/.test(lastUserMessage.toLowerCase()),
    // Question length
    isShortQuestion: lastUserMessage.length < 100,
    isLongQuestion: lastUserMessage.length > 500,
    // Conversation depth
    isDeepConversation: messageCount > 6,
  };
  
  // Score complexity
  let complexityScore = 0;
  
  if (complexityIndicators.hasCode) complexityScore += 2;
  if (complexityIndicators.hasAnalysis) complexityScore += 2;
  if (complexityIndicators.hasCreative) complexityScore += 2;
  if (complexityIndicators.hasMath) complexityScore += 2;
  if (complexityIndicators.isLongQuestion) complexityScore += 1;
  if (complexityIndicators.isDeepConversation) complexityScore += 1;
  if (complexityIndicators.isSimple) complexityScore -= 2;
  if (complexityIndicators.isShortQuestion) complexityScore -= 1;
  
  // Determine level
  if (complexityScore <= 0) return "simple";
  if (complexityScore <= 3) return "medium";
  return "complex";
}

/**
 * Get the best model for a given complexity and routing mode
 */
export function selectModel(
  complexity: ComplexityLevel,
  mode: RoutingMode,
  preferredModel?: string
): ModelDefinition {
  // Manual mode - use preferred model or default
  if (mode === "manual" && preferredModel) {
    const model = AVAILABLE_MODELS.find(m => m.id === preferredModel);
    if (model) return model;
  }
  
  // Free mode - only use free models (Groq + DeepSeek R1)
  if (mode === "free") {
    switch (complexity) {
      case "simple":
        // Simple queries → Llama 3.1 8B (fast, free)
        return AVAILABLE_MODELS.find(m => m.id === "llama-3.1-8b")!;
      case "medium":
        // Medium queries → Mixtral (good balance, free)
        return AVAILABLE_MODELS.find(m => m.id === "mixtral-8x7b")!;
      case "complex":
        // Complex reasoning → DeepSeek R1 (best for reasoning, free)
        return AVAILABLE_MODELS.find(m => m.id === "deepseek-r1-free")!;
    }
  }
  
  // Auto mode - smart routing prioritizing free tiers when appropriate
  switch (complexity) {
    case "simple":
      // Simple queries → Llama 3.1 8B (FREE, fast)
      return AVAILABLE_MODELS.find(m => m.id === "llama-3.1-8b")!;
    case "medium":
      // Medium queries → Grok 3 Fast (cheap, most up-to-date)
      return AVAILABLE_MODELS.find(m => m.id === "grok-3-fast")!;
    case "complex":
      // Complex reasoning → DeepSeek R1 (FREE, best for reasoning)
      return AVAILABLE_MODELS.find(m => m.id === "deepseek-r1-free")!;
  }
}

/**
 * Estimate cost for a request
 */
export function estimateCost(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number
): number {
  return (inputTokens * model.costPer1kInput + outputTokens * model.costPer1kOutput) / 1000;
}

/**
 * Get models by tier
 */
export function getModelsByTier(tier?: "free" | "standard" | "premium"): ModelDefinition[] {
  if (!tier) return AVAILABLE_MODELS;
  return AVAILABLE_MODELS.filter(m => m.tier === tier);
}

/**
 * Check if Groq is available (has API key configured)
 */
export function isGroqAvailable(): boolean {
  // Groq uses the platform's built-in API, so it's always available
  // In a real implementation, you'd check for GROQ_API_KEY
  return true;
}

/**
 * Response cache for identical prompts
 */
const responseCache = new Map<string, { response: string; timestamp: number; model: string }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function getCacheKey(messages: { role: string; content: string }[], model: string): string {
  const content = JSON.stringify(messages) + model;
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function getCachedResponse(cacheKey: string): { response: string; model: string } | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { response: cached.response, model: cached.model };
  }
  if (cached) {
    responseCache.delete(cacheKey);
  }
  return null;
}

export function setCachedResponse(cacheKey: string, response: string, model: string): void {
  // Limit cache size
  if (responseCache.size > 1000) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(cacheKey, { response, timestamp: Date.now(), model });
}

export function clearUserCache(): void {
  responseCache.clear();
}

/**
 * Prompt templates
 */
export interface PromptTemplate {
  id: string;
  name: string;
  category: "writing" | "coding" | "analysis" | "creative" | "productivity";
  description: string;
  prompt: string;
  variables?: string[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Writing
  {
    id: "email-professional",
    name: "Professional Email",
    category: "writing",
    description: "Write a professional email",
    prompt: "Write a professional email about: {{topic}}. Keep it concise and business-appropriate.",
    variables: ["topic"],
  },
  {
    id: "summarize",
    name: "Summarize Text",
    category: "writing",
    description: "Summarize long text into key points",
    prompt: "Summarize the following text into clear, concise bullet points:\n\n{{text}}",
    variables: ["text"],
  },
  {
    id: "rewrite-tone",
    name: "Rewrite with Tone",
    category: "writing",
    description: "Rewrite text in a different tone",
    prompt: "Rewrite the following text in a {{tone}} tone:\n\n{{text}}",
    variables: ["tone", "text"],
  },
  // Coding
  {
    id: "explain-code",
    name: "Explain Code",
    category: "coding",
    description: "Get a clear explanation of code",
    prompt: "Explain this code in simple terms, including what it does and how it works:\n\n```\n{{code}}\n```",
    variables: ["code"],
  },
  {
    id: "debug-code",
    name: "Debug Code",
    category: "coding",
    description: "Find and fix bugs in code",
    prompt: "Debug this code. Identify any issues and provide the corrected version with explanations:\n\n```\n{{code}}\n```\n\nError/Issue: {{error}}",
    variables: ["code", "error"],
  },
  {
    id: "convert-code",
    name: "Convert Code",
    category: "coding",
    description: "Convert code to another language",
    prompt: "Convert this {{from_language}} code to {{to_language}}:\n\n```{{from_language}}\n{{code}}\n```",
    variables: ["from_language", "to_language", "code"],
  },
  // Analysis
  {
    id: "pros-cons",
    name: "Pros & Cons Analysis",
    category: "analysis",
    description: "Analyze pros and cons of a decision",
    prompt: "Analyze the pros and cons of: {{topic}}\n\nProvide a balanced analysis with clear reasoning.",
    variables: ["topic"],
  },
  {
    id: "compare",
    name: "Compare Options",
    category: "analysis",
    description: "Compare multiple options",
    prompt: "Compare these options: {{options}}\n\nProvide a detailed comparison covering key factors, advantages, and disadvantages of each.",
    variables: ["options"],
  },
  // Creative
  {
    id: "brainstorm",
    name: "Brainstorm Ideas",
    category: "creative",
    description: "Generate creative ideas",
    prompt: "Brainstorm 10 creative ideas for: {{topic}}\n\nBe innovative and think outside the box.",
    variables: ["topic"],
  },
  {
    id: "story-starter",
    name: "Story Starter",
    category: "creative",
    description: "Generate a story opening",
    prompt: "Write an engaging opening paragraph for a {{genre}} story about: {{premise}}",
    variables: ["genre", "premise"],
  },
  // Productivity
  {
    id: "meeting-agenda",
    name: "Meeting Agenda",
    category: "productivity",
    description: "Create a meeting agenda",
    prompt: "Create a structured meeting agenda for: {{meeting_topic}}\n\nDuration: {{duration}}\nParticipants: {{participants}}",
    variables: ["meeting_topic", "duration", "participants"],
  },
  {
    id: "task-breakdown",
    name: "Task Breakdown",
    category: "productivity",
    description: "Break down a project into tasks",
    prompt: "Break down this project into actionable tasks with estimated time:\n\nProject: {{project}}\n\nProvide a clear task list with dependencies and priorities.",
    variables: ["project"],
  },
];

export function getTemplatesByCategory(category?: string): PromptTemplate[] {
  if (!category) return PROMPT_TEMPLATES;
  return PROMPT_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(t => t.id === id);
}

export function applyTemplate(template: PromptTemplate, variables: Record<string, string>): string {
  let prompt = template.prompt;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return prompt;
}
