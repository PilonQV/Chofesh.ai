/**
 * Free Model Fallback System
 * 
 * Implements smart fallback logic for free AI models:
 * 1. Try the best free model for the task
 * 2. If it fails, automatically fallback to the next best free model
 * 3. Retry with exponential backoff
 * 4. Charge users credits as if using premium models
 * 
 * This allows Chofesh.ai to provide premium AI access using only free APIs
 * while maintaining a sustainable business model.
 */

import { AVAILABLE_MODELS, type ModelDefinition, type ComplexityLevel } from "../modelRouter";

/**
 * Priority queue of free models by use case
 */
export const FREE_MODEL_PRIORITIES = {
  // Simple queries - fast, lightweight models
  simple: [
    "kimi-k2-free",                // Kimi free tier via OpenRouter
    "puter-gpt-5-nano",            // Fastest, browser-based
    "llama-3.1-8b",                // Groq - ultra fast
    "gemma-2-9b",                  // Groq - good quality
  ],
  
  // Medium complexity - balanced models
  medium: [
    "kimi-k2-turbo-preview",       // Fast Kimi with 256K context
    "kimi-k2-free",                // Kimi free tier
    "puter-gpt-5",                 // Full GPT-5 capabilities
    "llama-3.3-70b",               // Groq - excellent quality
    "deepseek-v3",                 // Strong general purpose
  ],
  
  // Complex reasoning - most capable models
  complex: [
    "kimi-k2-thinking",            // Best reasoning + 256K context (premium)
    "deepseek-r1-free",            // Best free reasoning model
    "puter-o3",                    // Advanced reasoning
    "puter-o1",                    // Good reasoning
    "llama-3.3-70b",               // Groq - fallback
    "kimi-k2-free",                // Long context
  ],
  
  // Vision tasks - multimodal models
  vision: [
    "kimi-k2.5",                   // Best vision + 256K context (4x cheaper, native multimodal)
    "gemini-2.0-flash-free",       // Free vision fallback
    "llama-3.2-90b-vision",        // Groq vision
    "qwen-2.5-vl-7b-free",         // Backup vision
  ],
  
  // Code generation - specialized models
  code: [
    "kimi-k2.5",                   // Superior coding (beats GPT-4.5 in benchmarks, 256K context)
    "puter-gpt-5",                 // Excellent for code
    "deepseek-r1-free",            // Strong code reasoning
    "llama-3.3-70b",               // Good code quality
    "mistral-large-free",          // Code specialist
  ],
  
  // Long context tasks (>128K tokens)
  longContext: [
    "kimi-k2.5",                   // 256K context (2x GPT-4o, 4x cheaper)
    "kimi-k2-thinking",            // 256K context + reasoning
    "kimi-k2-turbo-preview",       // 256K context (faster)
    "gemini-1.5-pro-free",         // 2M context (free)
    "puter-gpt-4o",                // 128K context (free)
  ],
};

/**
 * Get priority queue of free models for a given complexity
 */
export function getFreeModelPriority(
  complexity: ComplexityLevel,
  hasVision: boolean = false,
  isCode: boolean = false,
  isLongContext: boolean = false
): string[] {
  // Special cases (priority order matters)
  if (isLongContext) return FREE_MODEL_PRIORITIES.longContext;
  if (hasVision) return FREE_MODEL_PRIORITIES.vision;
  if (isCode) return FREE_MODEL_PRIORITIES.code;
  
  // General cases
  return FREE_MODEL_PRIORITIES[complexity];
}

/**
 * Get the next free model to try after a failure
 */
export function getNextFreeModel(
  currentModelId: string,
  complexity: ComplexityLevel,
  hasVision: boolean = false,
  isCode: boolean = false,
  isLongContext: boolean = false
): ModelDefinition | null {
  const priorityQueue = getFreeModelPriority(complexity, hasVision, isCode, isLongContext);
  const currentIndex = priorityQueue.indexOf(currentModelId);
  
  // If current model not in queue or is last, return null
  if (currentIndex === -1 || currentIndex === priorityQueue.length - 1) {
    return null;
  }
  
  // Get next model in queue
  const nextModelId = priorityQueue[currentIndex + 1];
  const nextModel = AVAILABLE_MODELS.find(m => m.id === nextModelId);
  
  return nextModel || null;
}

/**
 * Get the best free model for a given complexity
 */
export function getBestFreeModel(
  complexity: ComplexityLevel,
  hasVision: boolean = false,
  isCode: boolean = false,
  isLongContext: boolean = false
): ModelDefinition {
  const priorityQueue = getFreeModelPriority(complexity, hasVision, isCode, isLongContext);
  const bestModelId = priorityQueue[0];
  const bestModel = AVAILABLE_MODELS.find(m => m.id === bestModelId);
  
  if (!bestModel) {
    // Fallback to any free model
    return AVAILABLE_MODELS.find(m => m.tier === "free")!;
  }
  
  return bestModel;
}

/**
 * Get all free models
 */
export function getAllFreeModels(): ModelDefinition[] {
  return AVAILABLE_MODELS.filter(m => m.tier === "free" && m.costPer1kInput === 0);
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 16000);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorCode = error?.code || "";
  
  // Retryable errors
  const retryablePatterns = [
    "rate limit",
    "too many requests",
    "429",
    "503",
    "service unavailable",
    "timeout",
    "network error",
    "connection",
    "econnreset",
    "enotfound",
  ];
  
  return retryablePatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.toString().includes(pattern)
  );
}

/**
 * Credit pricing for free models
 * Users are charged as if using premium models, even though backend is free
 */
export const FREE_MODEL_CREDIT_PRICING = {
  // Charge users competitive rates
  simple: {
    inputCostPer1k: 0.10,   // $0.10 per 1k input tokens
    outputCostPer1k: 0.30,  // $0.30 per 1k output tokens
  },
  medium: {
    inputCostPer1k: 0.50,   // $0.50 per 1k input tokens
    outputCostPer1k: 1.50,  // $1.50 per 1k output tokens
  },
  complex: {
    inputCostPer1k: 2.00,   // $2.00 per 1k input tokens
    outputCostPer1k: 6.00,  // $6.00 per 1k output tokens
  },
  vision: {
    inputCostPer1k: 5.00,   // $5.00 per 1k input tokens (includes image processing)
    outputCostPer1k: 15.00, // $15.00 per 1k output tokens
  },
};

/**
 * Calculate credit cost for a request
 */
export function calculateCreditCost(
  complexity: ComplexityLevel,
  inputTokens: number,
  outputTokens: number,
  hasVision: boolean = false
): number {
  const pricing = hasVision 
    ? FREE_MODEL_CREDIT_PRICING.vision 
    : FREE_MODEL_CREDIT_PRICING[complexity];
  
  const inputCost = (inputTokens / 1000) * pricing.inputCostPer1k;
  const outputCost = (outputTokens / 1000) * pricing.outputCostPer1k;
  
  return inputCost + outputCost;
}

/**
 * Fallback chain tracker for debugging
 */
export interface FallbackAttempt {
  modelId: string;
  modelName: string;
  attemptNumber: number;
  error?: string;
  success: boolean;
  timestamp: Date;
}

export class FallbackChainTracker {
  private attempts: FallbackAttempt[] = [];
  
  addAttempt(attempt: FallbackAttempt) {
    this.attempts.push(attempt);
  }
  
  getAttempts(): FallbackAttempt[] {
    return this.attempts;
  }
  
  getSuccessfulModel(): FallbackAttempt | null {
    return this.attempts.find(a => a.success) || null;
  }
  
  getTotalAttempts(): number {
    return this.attempts.length;
  }
  
  toJSON() {
    return {
      totalAttempts: this.getTotalAttempts(),
      successfulModel: this.getSuccessfulModel()?.modelName,
      attempts: this.attempts,
    };
  }
}
