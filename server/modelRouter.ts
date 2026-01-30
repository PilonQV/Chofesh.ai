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
import { getBestFreeModel } from "./_core/freeModelFallback";

// Model definitions with tiers and costs
export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  provider: "platform" | "groq" | "openai" | "anthropic" | "grok" | "openrouter" | "puter" | "kimi";
  tier: "free" | "standard" | "premium";
  costPer1kInput: number;
  costPer1kOutput: number;
  maxTokens: number;
  supportsVision: boolean;
  speed: "fast" | "medium" | "slow";
  isReasoningModel?: boolean; // For complex reasoning tasks
  isUncensored?: boolean; // For unrestricted content
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  // Kimi K2.5 - Moonshot AI (Premium multimodal with 256K context)
  {
    id: "kimi-k2.5",
    name: "Kimi K2.5 (Premium)",
    description: "Best visual coding, video understanding, 256K context",
    provider: "kimi",
    tier: "premium",
    costPer1kInput: 0.0006,
    costPer1kOutput: 0.003,
    maxTokens: 262144,
    supportsVision: true,
    speed: "medium",
    isReasoningModel: true,
  },
  {
    id: "kimi-k2-thinking",
    name: "Kimi K2 Thinking (Premium)",
    description: "Best for agentic research & deep reasoning, 256K context",
    provider: "kimi",
    tier: "premium",
    costPer1kInput: 0.0004,
    costPer1kOutput: 0.00175,
    maxTokens: 262144,
    supportsVision: false,
    speed: "medium",
    isReasoningModel: true,
  },
  {
    id: "kimi-k2-turbo-preview",
    name: "Kimi K2 Turbo",
    description: "Fast Kimi model with 256K context",
    provider: "kimi",
    tier: "standard",
    costPer1kInput: 0.0002,
    costPer1kOutput: 0.001,
    maxTokens: 262144,
    supportsVision: false,
    speed: "fast",
  },
  // Puter.js FREE models - No API key needed, runs in browser
  {
    id: "puter-gpt-5-nano",
    name: "GPT-5 Nano (Free)",
    description: "Fast, efficient - FREE via Puter.js",
    provider: "puter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    supportsVision: false,
    speed: "fast",
  },
  {
    id: "puter-gpt-5",
    name: "GPT-5 (Free)",
    description: "Full GPT-5 capabilities - FREE via Puter.js",
    provider: "puter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 16384,
    supportsVision: false,
    speed: "medium",
  },
  {
    id: "puter-gpt-4o",
    name: "GPT-4o (Free)",
    description: "Multimodal GPT-4 - FREE via Puter.js",
    provider: "puter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 128000,
    supportsVision: true,
    speed: "medium",
  },
  {
    id: "puter-o1",
    name: "o1 (Free)",
    description: "Advanced reasoning - FREE via Puter.js",
    provider: "puter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 32768,
    supportsVision: false,
    speed: "slow",
    isReasoningModel: true,
  },
  {
    id: "puter-o3",
    name: "o3 (Free)",
    description: "Latest reasoning model - FREE via Puter.js",
    provider: "puter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 32768,
    supportsVision: false,
    speed: "slow",
    isReasoningModel: true,
  },
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
  // OpenRouter FREE models - Additional free models
  {
    id: "llama-3.1-405b-free",
    name: "Llama 3.1 405B (Free)",
    description: "Most powerful open model - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 128000,
    supportsVision: false,
    speed: "slow",
  },
  {
    id: "hermes-3-405b-free",
    name: "Hermes 3 405B (Free)",
    description: "Hermes fine-tuned 405B - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 128000,
    supportsVision: false,
    speed: "slow",
  },
  {
    id: "kimi-k2-free",
    name: "Kimi K2 (Free)",
    description: "Moonshot's latest model - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 128000,
    supportsVision: false,
    speed: "medium",
  },
  {
    id: "mistral-small-free",
    name: "Mistral Small 3.1 (Free)",
    description: "Fast Mistral model - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 32768,
    supportsVision: false,
    speed: "fast",
  },
  {
    id: "qwen-vl-free",
    name: "Qwen 2.5 VL 7B (Free)",
    description: "Vision-language model - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 32768,
    supportsVision: true,
    speed: "fast",
  },
  {
    id: "gemma-3-27b-free",
    name: "Gemma 3 27B (Free)",
    description: "Google's Gemma 3 - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    supportsVision: false,
    speed: "fast",
  },
  // NEW OpenRouter FREE models (January 2026)
  {
    id: "mimo-v2-flash-free",
    name: "Xiaomi MiMo-V2-Flash (Free)",
    description: "Top performer, comparable to Claude Sonnet 4.5 - FREE",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 262000,
    supportsVision: false,
    speed: "medium",
    isReasoningModel: true,
  },
  {
    id: "devstral-2-free",
    name: "Mistral Devstral 2 (Free)",
    description: "Best coding specialist - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 262000,
    supportsVision: false,
    speed: "medium",
  },
  {
    id: "deepseek-r1t2-chimera-free",
    name: "TNG DeepSeek R1T2 Chimera (Free)",
    description: "Fastest reasoning model, 20% faster than R1 - FREE",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 164000,
    supportsVision: false,
    speed: "fast",
    isReasoningModel: true,
  },
  {
    id: "gemini-2-flash-exp-free",
    name: "Gemini 2.0 Flash Exp (Free)",
    description: "Massive 1M context window - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 1050000,
    supportsVision: true,
    speed: "fast",
  },
  {
    id: "qwen3-coder-480b-free",
    name: "Qwen3 Coder 480B (Free)",
    description: "Best for agentic coding - FREE via OpenRouter",
    provider: "openrouter",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 262000,
    supportsVision: false,
    speed: "medium",
  },
  {
    id: "kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    description: "Best for agentic research & deep reasoning",
    provider: "openrouter",
    tier: "standard",
    costPer1kInput: 0.0004,
    costPer1kOutput: 0.00175,
    maxTokens: 262144,
    supportsVision: false,
    speed: "medium",
    isReasoningModel: true,
  },
  // Cerebras FREE models - Ultra-fast inference
  {
    id: "llama-3.3-70b-cerebras",
    name: "Llama 3.3 70B (Cerebras)",
    description: "Ultra-fast inference - FREE via Cerebras",
    provider: "cerebras" as any,
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    supportsVision: false,
    speed: "fast",
  },
  {
    id: "llama-3.1-8b-cerebras",
    name: "Llama 3.1 8B (Cerebras)",
    description: "Fastest small model - FREE via Cerebras",
    provider: "cerebras" as any,
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    supportsVision: false,
    speed: "fast",
  },
  {
    id: "qwen-3-32b-cerebras",
    name: "Qwen 3 32B (Cerebras)",
    description: "Qwen 3 with ultra-fast inference - FREE via Cerebras",
    provider: "cerebras" as any,
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 32768,
    supportsVision: false,
    speed: "fast",
  },
  // Groq FREE models - Additional Groq models
  {
    id: "llama-3.3-70b-groq",
    name: "Llama 3.3 70B (Groq)",
    description: "Latest Llama via Groq - FREE & ultra-fast",
    provider: "groq",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 128000,
    supportsVision: false,
    speed: "fast",
  },
  {
    id: "gemma2-9b-groq",
    name: "Gemma 2 9B (Groq)",
    description: "Google's Gemma 2 via Groq - FREE & fast",
    provider: "groq",
    tier: "free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    supportsVision: false,
    speed: "fast",
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
 * Detect if task requires long context (>128K tokens)
 */
export function requiresLongContext(messages: { role: string; content: string }[]): boolean {
  const totalLength = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 0), 0);
  // Rough estimate: 1 token ≈ 4 characters
  const estimatedTokens = totalLength / 4;
  return estimatedTokens > 128000;
}

/**
 * Detect if task requires vision capabilities
 */
export function requiresVision(messages: { role: string; content: string }[]): boolean {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const visionKeywords = /image|picture|photo|screenshot|visual|video|diagram|chart|graph|design|ui|interface/i;
  return visionKeywords.test(lastMessage);
}

/**
 * Detect if task is code-related
 */
export function isCodeTask(messages: { role: string; content: string }[]): boolean {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const codeKeywords = /code|function|class|debug|refactor|implement|algorithm|program|script|api|database|frontend|backend/i;
  return codeKeywords.test(lastMessage) || /```/.test(lastMessage);
}

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
  preferredModel?: string,
  messages?: { role: string; content: string }[]
): ModelDefinition {
  // Manual mode - use preferred model or default
  if (mode === "manual" && preferredModel) {
    const model = AVAILABLE_MODELS.find(m => m.id === preferredModel);
    if (model) return model;
  }
  
  // Detect task characteristics
  const hasVision = messages ? requiresVision(messages) : false;
  const isCode = messages ? isCodeTask(messages) : false;
  const isLongContext = messages ? requiresLongContext(messages) : false;
  
  // Use the free model fallback system
  
  // Get the best model for this task (prioritizes Kimi for vision/code/long-context)
  const bestModel = getBestFreeModel(complexity, hasVision, isCode, isLongContext);
  
  return bestModel;
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
    id: "writing-assistant",
    name: "Writing Assistant",
    category: "writing",
    description: "Get help improving your writing with detailed feedback",
    prompt: `Review and improve this writing. Provide:\n1. **What you changed** - List specific edits made\n2. **Why you changed it** - Explain the reasoning\n3. **Improved version** - The polished text\n\nOriginal text:\n{{text}}\n\nFocus on: clarity, flow, grammar, and engagement.`,
    variables: ["text"],
  },
  {
    id: "document-draft",
    name: "Document Draft",
    category: "writing",
    description: "Draft a structured document on any topic",
    prompt: `Draft a well-structured document about: {{topic}}\n\nDocument type: {{type}}\nTarget audience: {{audience}}\n\nInclude:\n- Clear introduction\n- Organized sections with headers\n- Actionable conclusions\n- Professional tone appropriate for the audience`,
    variables: ["topic", "type", "audience"],
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
    id: "code-review",
    name: "Code Review",
    category: "coding",
    description: "Get a thorough code review with actionable feedback",
    prompt: `Review this code like a senior engineer. Provide:\n\n**Summary**: Brief overview of what the code does\n**Issues Found**: Bugs, security issues, performance problems\n**Suggestions**: Improvements for readability, maintainability\n**Best Practices**: What's done well and what could follow patterns better\n\n\`\`\`{{language}}\n{{code}}\n\`\`\`\n\nBe specific and actionable. Prioritize issues by severity.`,
    variables: ["language", "code"],
  },
  {
    id: "write-tests",
    name: "Write Tests",
    category: "coding",
    description: "Generate comprehensive tests for your code",
    prompt: `Write comprehensive tests for this code:\n\n\`\`\`{{language}}\n{{code}}\n\`\`\`\n\nTesting framework: {{framework}}\n\nInclude:\n- Unit tests for each function/method\n- Edge cases and error handling\n- Clear test descriptions\n- Setup/teardown if needed`,
    variables: ["language", "code", "framework"],
  },
  {
    id: "refactor-code",
    name: "Refactor Code",
    category: "coding",
    description: "Refactor code for better quality and maintainability",
    prompt: `Refactor this code to improve quality:\n\n\`\`\`{{language}}\n{{code}}\n\`\`\`\n\nFocus on:\n- {{focus}}\n\nProvide the refactored code with comments explaining major changes.`,
    variables: ["language", "code", "focus"],
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
    id: "deep-research",
    name: "Deep Research",
    category: "analysis",
    description: "Conduct thorough research on a topic",
    prompt: `Research this topic thoroughly: {{topic}}\n\nProvide:\n1. **Overview** - What it is and why it matters\n2. **Key Facts** - Important data and statistics\n3. **Different Perspectives** - Various viewpoints on the topic\n4. **Current State** - Latest developments\n5. **Sources** - Where to learn more\n\nBe comprehensive but organized. Distinguish facts from opinions.`,
    variables: ["topic"],
  },
  {
    id: "fact-check",
    name: "Fact Check",
    category: "analysis",
    description: "Evaluate claims and check for accuracy",
    prompt: `Fact-check this claim: {{claim}}\n\nProvide:\n- **Verdict**: True / Partially True / False / Unverifiable\n- **Evidence**: What supports or contradicts the claim\n- **Context**: Important background information\n- **Sources**: Where to verify\n\nBe objective and thorough.`,
    variables: ["claim"],
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    category: "analysis",
    description: "Analyze data and extract insights",
    prompt: `Analyze this data:\n\n{{data}}\n\nProvide:\n1. **Summary Statistics** - Key numbers and trends\n2. **Patterns** - Notable patterns or correlations\n3. **Insights** - What the data tells us\n4. **Recommendations** - Actions based on findings\n5. **Limitations** - Caveats about the analysis`,
    variables: ["data"],
  },
  {
    id: "compare",
    name: "Compare Options",
    category: "analysis",
    description: "Compare multiple options",
    prompt: "Compare these options: {{options}}\n\nProvide a detailed comparison covering key factors, advantages, and disadvantages of each.",
    variables: ["options"],
  },
  // AI Enhancements
  {
    id: "translate",
    name: "Translate Text",
    category: "productivity",
    description: "Translate text to another language",
    prompt: `Translate the following text to {{language}}. Preserve the tone and meaning as closely as possible.\n\nText:\n{{text}}\n\nProvide:\n1. **Translation**: The translated text\n2. **Notes**: Any cultural or linguistic nuances to be aware of`,
    variables: ["language", "text"],
  },
  {
    id: "tone-adjuster",
    name: "Adjust Tone",
    category: "productivity",
    description: "Rewrite text in a different tone",
    prompt: `Rewrite the following text in a {{tone}} tone. Keep the core message but adjust the style.\n\nOriginal:\n{{text}}\n\nTone options: professional, casual, friendly, formal, humorous, empathetic, assertive, diplomatic`,
    variables: ["tone", "text"],
  },
  {
    id: "summarize-thread",
    name: "Summarize Conversation",
    category: "productivity",
    description: "Condense a long conversation into key points",
    prompt: `Summarize this conversation into key points:\n\n{{conversation}}\n\nProvide:\n1. **Main Topics**: What was discussed\n2. **Key Decisions**: Any conclusions or agreements\n3. **Action Items**: Tasks or next steps mentioned\n4. **Open Questions**: Unresolved issues`,
    variables: ["conversation"],
  },
  {
    id: "expand-text",
    name: "Expand Text",
    category: "productivity",
    description: "Elaborate on brief text with more detail",
    prompt: `Expand the following brief text into a more detailed version:\n\n{{text}}\n\nAdd:\n- More context and background\n- Examples or illustrations\n- Supporting details\n- Smooth transitions\n\nMaintain the original meaning and intent.`,
    variables: ["text"],
  },
  {
    id: "simplify",
    name: "Simplify Text",
    category: "productivity",
    description: "Make complex text easier to understand",
    prompt: `Simplify this text for a general audience:\n\n{{text}}\n\nRules:\n- Use simple, everyday words\n- Break down complex concepts\n- Keep sentences short\n- Explain jargon if unavoidable\n- Maintain accuracy`,
    variables: ["text"],
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
    id: "creative-writing",
    name: "Creative Writing",
    category: "creative",
    description: "Generate creative fiction or storytelling",
    prompt: `Write a {{length}} {{type}} about: {{premise}}\n\nStyle: {{style}}\n\nFocus on:\n- Vivid descriptions\n- Engaging dialogue\n- Emotional resonance\n- Satisfying narrative arc`,
    variables: ["length", "type", "premise", "style"],
  },
  {
    id: "roleplay-scenario",
    name: "Roleplay Scenario",
    category: "creative",
    description: "Create an interactive roleplay scenario",
    prompt: `Create a roleplay scenario:\n\nSetting: {{setting}}\nCharacter: {{character}}\nSituation: {{situation}}\n\nSet the scene vividly, then respond as the character. Use *asterisks* for actions and descriptions.`,
    variables: ["setting", "character", "situation"],
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
  {
    id: "decision-framework",
    name: "Decision Framework",
    category: "productivity",
    description: "Structure a decision with clear criteria",
    prompt: `Help me decide: {{decision}}\n\nOptions: {{options}}\n\nProvide:\n1. **Decision Criteria** - What factors matter most\n2. **Option Analysis** - How each option scores\n3. **Risks & Mitigation** - What could go wrong\n4. **Recommendation** - Best choice with reasoning\n5. **Next Steps** - How to proceed`,
    variables: ["decision", "options"],
  },
  {
    id: "learning-plan",
    name: "Learning Plan",
    category: "productivity",
    description: "Create a structured learning plan for any skill",
    prompt: `Create a learning plan for: {{skill}}\n\nCurrent level: {{level}}\nTime available: {{time}}\nGoal: {{goal}}\n\nProvide:\n- Week-by-week curriculum\n- Recommended resources\n- Practice exercises\n- Milestones to track progress`,
    variables: ["skill", "level", "time", "goal"],
  },
  {
    id: "explain-like-im-5",
    name: "Explain Like I'm 5",
    category: "productivity",
    description: "Get simple explanations of complex topics",
    prompt: `Explain {{topic}} in the simplest possible terms, as if explaining to a 5-year-old.\n\nUse:\n- Simple words\n- Everyday analogies\n- Short sentences\n- Fun examples\n\nMake it engaging and memorable!`,
    variables: ["topic"],
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
