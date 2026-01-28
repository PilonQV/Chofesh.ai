/**
 * LLM Invoker with Automatic Free Model Fallback
 * 
 * Wraps the existing LLM invocation with intelligent fallback logic:
 * 1. Try the best free model for the task
 * 2. If it fails, automatically retry with the next best free model
 * 3. Continue until success or all models exhausted
 * 4. Track all attempts for debugging and analytics
 */

import { invokeLLM, type Message, type InvokeResult, type InvokeParams } from "./llm";
import {
  getBestFreeModel,
  getNextFreeModel,
  getRetryDelay,
  isRetryableError,
  FallbackChainTracker,
  type FallbackAttempt,
} from "./freeModelFallback";
import { type ComplexityLevel, type ModelDefinition, analyzeQueryComplexity } from "../modelRouter";
import { invokeAICompletion } from "./aiProviders";

export interface InvokeWithFallbackParams extends InvokeParams {
  complexity?: ComplexityLevel;
  hasVision?: boolean;
  isCode?: boolean;
  maxRetries?: number;
}

export interface InvokeWithFallbackResult extends InvokeResult {
  modelUsed: string;
  fallbackChain?: FallbackAttempt[];
  totalAttempts: number;
}

/**
 * Invoke LLM with automatic fallback to free models
 */
export async function invokeLLMWithFallback(
  params: InvokeWithFallbackParams
): Promise<InvokeWithFallbackResult> {
  const {
    messages,
    complexity = "medium",
    hasVision = false,
    isCode = false,
    maxRetries = 5,
    ...otherParams
  } = params;
  
  // Initialize fallback tracker
  const tracker = new FallbackChainTracker();
  
  // Get the best free model to start with
  let currentModel = getBestFreeModel(complexity, hasVision, isCode);
  let attemptNumber = 1;
  
  while (attemptNumber <= maxRetries) {
    console.log(`[LLM Fallback] Attempt ${attemptNumber}/${maxRetries} with model: ${currentModel.name}`);
    
    try {
      // Try to invoke the current model
      const result = await invokeModelDirectly(currentModel, messages, otherParams);
      
      // Success! Track it and return
      tracker.addAttempt({
        modelId: currentModel.id,
        modelName: currentModel.name,
        attemptNumber,
        success: true,
        timestamp: new Date(),
      });
      
      console.log(`[LLM Fallback] Success with ${currentModel.name} on attempt ${attemptNumber}`);
      
      return {
        ...result,
        modelUsed: currentModel.id,
        fallbackChain: tracker.getAttempts(),
        totalAttempts: attemptNumber,
      };
      
    } catch (error: any) {
      console.error(`[LLM Fallback] Error with ${currentModel.name}:`, error.message);
      
      // Track the failed attempt
      tracker.addAttempt({
        modelId: currentModel.id,
        modelName: currentModel.name,
        attemptNumber,
        error: error.message,
        success: false,
        timestamp: new Date(),
      });
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.log(`[LLM Fallback] Non-retryable error, trying next model immediately`);
      } else {
        // Wait before retrying (exponential backoff)
        const delay = getRetryDelay(attemptNumber);
        console.log(`[LLM Fallback] Waiting ${delay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Get next model in fallback chain
      const nextModel = getNextFreeModel(currentModel.id, complexity, hasVision, isCode);
      
      if (!nextModel) {
        // No more models to try
        console.error(`[LLM Fallback] All models exhausted after ${attemptNumber} attempts`);
        throw new Error(
          `All free models failed. Last error: ${error.message}. ` +
          `Tried ${attemptNumber} models: ${tracker.getAttempts().map(a => a.modelName).join(", ")}`
        );
      }
      
      // Move to next model
      currentModel = nextModel;
      attemptNumber++;
    }
  }
  
  // Should never reach here, but just in case
  throw new Error(`Max retries (${maxRetries}) exceeded`);
}

/**
 * Invoke a specific model directly
 */
async function invokeModelDirectly(
  model: ModelDefinition,
  messages: Message[],
  otherParams: any
): Promise<InvokeResult> {
  console.log(`[LLM Direct] Invoking ${model.provider}:${model.id}`);
  
  // Use the aiProviders system to invoke the model
  const result = await invokeAICompletion({
    provider: model.provider as any,
    model: model.id,
    messages: messages
      .filter(m => m.role !== 'function') // Filter out function messages
      .map(m => ({
        role: m.role as "system" | "user" | "assistant",
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
    temperature: otherParams.temperature,
    maxTokens: otherParams.maxTokens || model.maxTokens,
  });
  
  // Convert to InvokeResult format
  return {
    id: `chatcmpl-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: model.id,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: result.content,
      },
      finish_reason: "stop",
    }],
    usage: {
      prompt_tokens: result.usage?.promptTokens || 0,
      completion_tokens: result.usage?.completionTokens || 0,
      total_tokens: result.usage?.totalTokens || 0,
    },
  } as InvokeResult;
}

/**
 * Analyze messages to determine complexity
 */
export function analyzeMessagesComplexity(messages: Message[]): ComplexityLevel {
  const formattedMessages = messages.map(m => ({
    role: m.role as "system" | "user" | "assistant",
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
  }));
  
  return analyzeQueryComplexity(formattedMessages);
}

/**
 * Check if messages contain vision requests
 */
export function hasVisionContent(messages: Message[]): boolean {
  return messages.some(m => {
    const content = m.content;
    if (typeof content === 'string') {
      return content.toLowerCase().includes('image') || 
             content.toLowerCase().includes('picture') ||
             content.toLowerCase().includes('photo');
    }
    if (Array.isArray(content)) {
      return content.some((c: any) => c.type === 'image_url');
    }
    return false;
  });
}

/**
 * Check if messages are code-related
 */
export function isCodeRelated(messages: Message[]): boolean {
  const codeKeywords = ['code', 'function', 'class', 'debug', 'error', 'bug', 'implement', 'program'];
  return messages.some(m => {
    const content = typeof m.content === 'string' ? m.content.toLowerCase() : '';
    return codeKeywords.some(keyword => content.includes(keyword));
  });
}
