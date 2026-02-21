/**
 * Kimi K2.5 Orchestrator
 * 
 * Uses Kimi K2.5 as the "brain" to analyze queries and route to optimal models.
 * Maximizes Kimi's 256K context and reasoning while minimizing costs.
 */

import OpenAI from 'openai';
import { getCachedDecision, cacheDecision } from './orchestration/orchestratorCache';

const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_BASE_URL = 'https://api.moonshot.ai/v1';

// Diagnostic logging for API key
if (!KIMI_API_KEY) {
  console.info('[Kimi Orchestrator] KIMI_API_KEY not set — Kimi/Moonshot routing disabled (optional).');
} else {
  console.info('[Kimi Orchestrator] API key loaded — Kimi/Moonshot routing enabled.');
}

// Model costs per 1M tokens (input/output)
const MODEL_COSTS = {
  'kimi-k2.5': { input: 0.10, output: 0.60 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'groq-llama': { input: 0.05, output: 0.08 },
};

export interface OrchestrationDecision {
  strategy: 'direct' | 'delegate' | 'hybrid';
  primaryModel: string;
  delegateModel?: string;
  reasoning: string;
  estimatedCost: number;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface QueryAnalysis {
  hasImages: boolean;
  hasCode: boolean;
  requiresVision: boolean;
  requiresReasoning: boolean;
  contextLength: number;
  complexity: 'simple' | 'medium' | 'complex';
  taskType: string[];
}

/**
 * Analyze user query to determine characteristics
 */
export function analyzeQuery(messages: any[]): QueryAnalysis {
  const lastMessage = messages[messages.length - 1];
  const content = typeof lastMessage.content === 'string' 
    ? lastMessage.content 
    : JSON.stringify(lastMessage.content);
  
  const hasImages = messages.some(msg => 
    typeof msg.content !== 'string' && 
    Array.isArray(msg.content) && 
    msg.content.some((part: any) => part.type === 'image_url' || part.type === 'video_url')
  );
  
  const hasCode = /```|function|class|import|const|let|var/.test(content);
  const requiresVision = hasImages || /image|photo|picture|video|screenshot/.test(content.toLowerCase());
  const requiresReasoning = /why|how|explain|analyze|compare|evaluate|reason/.test(content.toLowerCase());
  
  // Estimate context length (rough approximation: 1 token ≈ 4 chars)
  const contextLength = Math.ceil(JSON.stringify(messages).length / 4);
  
  // Determine complexity
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  if (hasImages || hasCode || requiresReasoning || contextLength > 10000) {
    complexity = 'complex';
  } else if (content.length > 500 || messages.length > 5) {
    complexity = 'medium';
  }
  
  // Identify task types
  const taskType: string[] = [];
  if (hasImages) taskType.push('vision');
  if (hasCode) taskType.push('code');
  if (requiresReasoning) taskType.push('reasoning');
  if (/search|find|lookup|what is/.test(content.toLowerCase())) taskType.push('factual');
  if (taskType.length === 0) taskType.push('general');
  
  return {
    hasImages,
    hasCode,
    requiresVision,
    requiresReasoning,
    contextLength,
    complexity,
    taskType,
  };
}

/**
 * Kimi K2.5 makes the routing decision (with caching)
 */
export async function orchestrateWithKimi(
  messages: any[],
  analysis: QueryAnalysis,
  bypassCache: boolean = false
): Promise<OrchestrationDecision> {
  // Check cache first (unless bypassed)
  if (!bypassCache) {
    const lastMessage = messages[messages.length - 1];
    const query = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : JSON.stringify(lastMessage.content);
    
    const cached = getCachedDecision(query);
    
    if (cached.cacheHit && cached.decision) {
      // Return cached decision
      const model = MODEL_COSTS[cached.decision.targetModel as keyof typeof MODEL_COSTS] || MODEL_COSTS['kimi-k2.5'];
      const estimatedTokens = analysis.contextLength + 1000;
      const estimatedCost = (estimatedTokens / 1000000) * (model.input + model.output);
      
      return {
        strategy: cached.decision.shouldDelegate ? 'delegate' : 'direct',
        primaryModel: cached.decision.shouldDelegate ? 'kimi-k2.5' : (cached.decision.targetModel || 'kimi-k2.5'),
        delegateModel: cached.decision.shouldDelegate ? cached.decision.targetModel : undefined,
        reasoning: `[CACHED ${(cached.similarity! * 100).toFixed(0)}%] ${cached.decision.reasoning}`,
        estimatedCost,
        complexity: analysis.complexity,
      };
    }
  }
  const client = new OpenAI({
    apiKey: KIMI_API_KEY,
    baseURL: KIMI_BASE_URL,
  });
  
  const orchestrationPrompt = `You are an AI orchestrator. Analyze this user query and decide the optimal routing strategy.

Query Analysis:
- Has images: ${analysis.hasImages}
- Has code: ${analysis.hasCode}
- Requires vision: ${analysis.requiresVision}
- Requires reasoning: ${analysis.requiresReasoning}
- Context length: ${analysis.contextLength} tokens
- Complexity: ${analysis.complexity}
- Task types: ${analysis.taskType.join(', ')}

Available Models:
1. kimi-k2.5 (YOU): Best for vision, code, reasoning, long context. Cost: $0.10/$0.60 per 1M tokens
2. gpt-4o-mini: Fast, cheap for simple queries. Cost: $0.15/$0.60 per 1M tokens
3. claude-3-haiku: Fast factual responses. Cost: $0.25/$1.25 per 1M tokens
4. groq-llama: Ultra-fast simple responses. Cost: $0.05/$0.08 per 1M tokens

Routing Strategies:
- "direct": You (Kimi) handle the entire query directly
- "delegate": Delegate to a cheaper model, you synthesize the result
- "hybrid": Delegate information gathering, you do reasoning/synthesis

Respond in JSON format:
{
  "strategy": "direct" | "delegate" | "hybrid",
  "primaryModel": "kimi-k2.5" | "gpt-4o-mini" | "claude-3-haiku" | "groq-llama",
  "delegateModel": "gpt-4o-mini" | "claude-3-haiku" | "groq-llama" | null,
  "reasoning": "Brief explanation of your decision",
  "estimatedTokens": number
}

User Query:
${JSON.stringify(messages[messages.length - 1])}`;

  try {
    const response = await client.chat.completions.create({
      model: 'kimi-k2.5',
      messages: [
        { role: 'system', content: 'You are an AI orchestrator. Respond only with valid JSON.' },
        { role: 'user', content: orchestrationPrompt },
      ],
      temperature: 0.6,
      // @ts-ignore - Kimi K2.5 supports thinking parameter
      thinking: { type: 'disabled' }, // Disable thinking for faster routing decisions
    });
    
    let responseText = response.choices[0].message.content || '{}';
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const decision = JSON.parse(responseText);
    
    // Calculate estimated cost
    const estimatedTokens = decision.estimatedTokens || analysis.contextLength + 1000;
    const model = MODEL_COSTS[decision.primaryModel as keyof typeof MODEL_COSTS] || MODEL_COSTS['kimi-k2.5'];
    const estimatedCost = (estimatedTokens / 1000000) * (model.input + model.output);
    
    const orchestrationDecision = {
      strategy: decision.strategy || 'direct',
      primaryModel: decision.primaryModel || 'kimi-k2.5',
      delegateModel: decision.delegateModel,
      reasoning: decision.reasoning || 'Default routing',
      estimatedCost,
      complexity: analysis.complexity,
    };
    
    // Cache the decision for future use
    if (!bypassCache) {
      const lastMessage = messages[messages.length - 1];
      const query = typeof lastMessage.content === 'string' 
        ? lastMessage.content 
        : JSON.stringify(lastMessage.content);
      
      cacheDecision(query, {
        shouldDelegate: orchestrationDecision.strategy === 'delegate',
        targetModel: orchestrationDecision.delegateModel || orchestrationDecision.primaryModel,
        reasoning: orchestrationDecision.reasoning,
      });
    }
    
    return orchestrationDecision;
  } catch (error: any) {
    console.error('[Kimi Orchestrator] Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    });
    
    // Log 401 errors specifically
    if (error.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.error('[Kimi Orchestrator] 401 UNAUTHORIZED ERROR - Check API key!');
      console.error('[Kimi Orchestrator] API key present:', !!KIMI_API_KEY);
      console.error('[Kimi Orchestrator] API key length:', KIMI_API_KEY?.length || 0);
    }
    
    // Fallback to rule-based routing
    return fallbackRouting(analysis);
  }
}

/**
 * Fallback rule-based routing if Kimi orchestration fails
 */
function fallbackRouting(analysis: QueryAnalysis): OrchestrationDecision {
  // Vision or code → Kimi direct
  if (analysis.hasImages || analysis.hasCode || analysis.complexity === 'complex') {
    return {
      strategy: 'direct',
      primaryModel: 'kimi-k2.5',
      reasoning: 'Fallback: Complex task requires Kimi',
      estimatedCost: 0.001,
      complexity: analysis.complexity,
    };
  }
  
  // Simple query → Delegate to cheap model
  if (analysis.complexity === 'simple' && analysis.taskType.includes('factual')) {
    return {
      strategy: 'delegate',
      primaryModel: 'kimi-k2.5',
      delegateModel: 'gpt-4o-mini',
      reasoning: 'Fallback: Simple factual query, delegate to GPT-4o-mini',
      estimatedCost: 0.0003,
      complexity: analysis.complexity,
    };
  }
  
  // Default: Kimi handles directly
  return {
    strategy: 'direct',
    primaryModel: 'kimi-k2.5',
    reasoning: 'Fallback: Default to Kimi',
    estimatedCost: 0.001,
    complexity: analysis.complexity,
  };
}

/**
 * Execute the orchestration decision
 */
export async function executeOrchestration(
  messages: any[],
  decision: OrchestrationDecision,
  options: any = {}
): Promise<string> {
  console.log('[Kimi Orchestrator] Executing:', {
    strategy: decision.strategy,
    primaryModel: decision.primaryModel,
    delegateModel: decision.delegateModel,
    reasoning: decision.reasoning,
  });
  
  if (decision.strategy === 'direct') {
    // Kimi handles directly
    return await callModel(decision.primaryModel, messages, options);
  }
  
  if (decision.strategy === 'delegate' && decision.delegateModel) {
    // Delegate to cheap model, Kimi synthesizes
    const delegateResponse = await callModel(decision.delegateModel, messages, options);
    
    // Kimi synthesizes the response
    const synthesisMessages = [
      ...messages,
      { role: 'assistant', content: delegateResponse },
      { role: 'user', content: 'Please review and enhance this response if needed. Keep it concise.' },
    ];
    
    return await callModel('kimi-k2.5', synthesisMessages, { ...options, thinking: { type: 'disabled' } });
  }
  
  // Hybrid strategy (future enhancement)
  return await callModel(decision.primaryModel, messages, options);
}

/**
 * Call a specific model
 */
async function callModel(model: string, messages: any[], options: any = {}): Promise<string> {
  // This will integrate with your existing model routing system
  // For now, just call Kimi
  const client = new OpenAI({
    apiKey: KIMI_API_KEY,
    baseURL: KIMI_BASE_URL,
  });
  
  const response = await client.chat.completions.create({
    model: model === 'kimi-k2.5' ? 'kimi-k2.5' : 'kimi-k2.5', // TODO: Add other model clients
    messages,
    ...options,
  });
  
  return response.choices[0].message.content || '';
}
