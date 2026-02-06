/**
 * Complexity Scoring System
 * 
 * Determines query complexity (0-100) to decide when expensive Kimi API is needed.
 * Score < 80: Use free APIs (Groq, Cerebras, Gemini)
 * Score >= 80: Use Kimi 2.5 (paid API)
 * 
 * This ensures 95% of queries use free APIs, reserving Kimi for truly complex scenarios.
 */

export interface ComplexityFactors {
  queryLength: number;
  hasMultipleSteps: boolean;
  requiresReasoning: boolean;
  hasVision: boolean;
  requiresTools: boolean;
  contextLength: number;
  isCodeGeneration: boolean;
  requiresVerification: boolean;
}

/**
 * Calculate complexity score (0-100)
 */
export function calculateComplexityScore(factors: ComplexityFactors): number {
  let score = 0;
  
  // Query length (0-15 points)
  if (factors.queryLength > 500) score += 15;
  else if (factors.queryLength > 200) score += 10;
  else if (factors.queryLength > 100) score += 5;
  
  // Multi-step reasoning (0-25 points)
  if (factors.hasMultipleSteps) {
    score += 25;
  }
  
  // Reasoning complexity (0-20 points)
  if (factors.requiresReasoning) {
    score += 20;
  }
  
  // Vision analysis (0-15 points)
  if (factors.hasVision) {
    score += 15;
  }
  
  // Tool usage (0-15 points)
  if (factors.requiresTools) {
    score += 15;
  }
  
  // Context length (0-10 points)
  if (factors.contextLength > 100000) score += 10; // >100K tokens
  else if (factors.contextLength > 50000) score += 5; // >50K tokens
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Analyze query to extract complexity factors
 */
export function analyzeQueryComplexity(
  query: string,
  conversationHistory: any[],
  hasImages: boolean = false
): ComplexityFactors {
  const queryLower = query.toLowerCase();
  
  // Multi-step indicators
  const multiStepKeywords = [
    "first", "then", "after that", "next", "finally",
    "step by step", "break down", "analyze and",
    "compare and", "research and", "find and"
  ];
  const hasMultipleSteps = multiStepKeywords.some(kw => queryLower.includes(kw));
  
  // Reasoning indicators
  const reasoningKeywords = [
    "why", "how", "explain", "analyze", "evaluate",
    "compare", "contrast", "reason", "logic", "proof",
    "deduce", "infer", "conclude", "justify"
  ];
  const requiresReasoning = reasoningKeywords.some(kw => queryLower.includes(kw));
  
  // Tool usage indicators
  const toolKeywords = [
    "search", "calculate", "generate image", "create",
    "execute", "run code", "fetch", "get data",
    "web search", "look up", "find information"
  ];
  const requiresTools = toolKeywords.some(kw => queryLower.includes(kw));
  
  // Code generation indicators
  const codeKeywords = [
    "write code", "implement", "function", "class",
    "algorithm", "program", "script", "api",
    "debug", "refactor", "optimize code"
  ];
  const isCodeGeneration = codeKeywords.some(kw => queryLower.includes(kw));
  
  // Verification indicators
  const verificationKeywords = [
    "verify", "double check", "confirm", "validate",
    "make sure", "ensure", "check if", "is this correct"
  ];
  const requiresVerification = verificationKeywords.some(kw => queryLower.includes(kw));
  
  // Estimate context length (rough approximation)
  const avgCharsPerToken = 4;
  const contextLength = conversationHistory.reduce((sum, msg) => {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    return sum + Math.ceil(content.length / avgCharsPerToken);
  }, 0);
  
  return {
    queryLength: query.length,
    hasMultipleSteps,
    requiresReasoning,
    hasVision: hasImages,
    requiresTools,
    contextLength,
    isCodeGeneration,
    requiresVerification,
  };
}

/**
 * Determine if Kimi API should be used based on complexity
 */
export function shouldUseKimi(
  query: string,
  conversationHistory: any[],
  hasImages: boolean = false,
  forceKimi: boolean = false
): { useKimi: boolean; score: number; reason: string } {
  // User explicitly requested Kimi
  if (forceKimi) {
    return {
      useKimi: true,
      score: 100,
      reason: "User explicitly requested Kimi verification"
    };
  }
  
  // Analyze complexity
  const factors = analyzeQueryComplexity(query, conversationHistory, hasImages);
  const score = calculateComplexityScore(factors);
  
  // Threshold: 80+ = use Kimi (paid), <80 = use free APIs
  const useKimi = score >= 80;
  
  // Generate reason
  let reason = "";
  if (useKimi) {
    const reasons: string[] = [];
    if (factors.hasMultipleSteps) reasons.push("multi-step reasoning");
    if (factors.requiresReasoning) reasons.push("complex reasoning");
    if (factors.hasVision) reasons.push("vision analysis");
    if (factors.requiresTools) reasons.push("tool usage");
    if (factors.contextLength > 50000) reasons.push("long context");
    if (factors.requiresVerification) reasons.push("verification requested");
    
    reason = `High complexity (${score}/100): ${reasons.join(", ")}`;
  } else {
    reason = `Low complexity (${score}/100): using free APIs`;
  }
  
  return { useKimi, score, reason };
}

/**
 * Log complexity decision for monitoring
 */
export function logComplexityDecision(
  query: string,
  decision: { useKimi: boolean; score: number; reason: string }
) {
  console.log(`[Complexity Scoring] ${decision.useKimi ? "🔴 KIMI (PAID)" : "🟢 FREE API"}`);
  console.log(`[Complexity Scoring] Score: ${decision.score}/100`);
  console.log(`[Complexity Scoring] Reason: ${decision.reason}`);
  console.log(`[Complexity Scoring] Query preview: ${query.substring(0, 100)}...`);
}
