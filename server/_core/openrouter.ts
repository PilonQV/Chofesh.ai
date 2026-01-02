/**
 * OpenRouter API Helper for DeepSeek R1 Free
 * Provides access to DeepSeek R1 reasoning model via OpenRouter's free tier
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterOptions {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Invoke DeepSeek R1 via OpenRouter's free tier
 * Note: Free tier has rate limits and may have availability constraints
 */
export async function invokeDeepSeekR1(options: OpenRouterOptions): Promise<OpenRouterResponse> {
  const { messages, temperature = 0.7, max_tokens = 4096, top_p = 1 } = options;
  
  // Use the free DeepSeek R1 model on OpenRouter
  const model = "deepseek/deepseek-r1-0528:free";
  
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chofesh.ai",
      "X-Title": "Chofesh.ai",
      // OpenRouter free tier doesn't require API key for free models
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data as OpenRouterResponse;
}

/**
 * Check if a query requires complex reasoning
 * Used by Smart Router to determine if DeepSeek R1 should be used
 */
export function isComplexReasoningQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Math and calculation patterns
  const mathPatterns = [
    /\b(calculate|compute|solve|equation|formula|integral|derivative|proof|theorem)\b/,
    /\b(math|mathematics|algebra|calculus|geometry|trigonometry|statistics)\b/,
    /\d+\s*[\+\-\*\/\^]\s*\d+/, // Basic math operations
    /\b(sum|product|factorial|logarithm|exponential)\b/,
  ];
  
  // Code and programming patterns
  const codePatterns = [
    /\b(code|program|function|algorithm|debug|fix|implement|refactor)\b/,
    /\b(python|javascript|typescript|java|c\+\+|rust|go|sql)\b/,
    /\b(api|database|backend|frontend|server|client)\b/,
    /```[\s\S]*```/, // Code blocks
  ];
  
  // Logic and reasoning patterns
  const reasoningPatterns = [
    /\b(explain|analyze|compare|evaluate|reason|logic|deduce|infer)\b/,
    /\b(why|how does|what if|suppose|assume|given that)\b/,
    /\b(step by step|step-by-step|think through|break down)\b/,
    /\b(pros and cons|advantages|disadvantages|trade-offs)\b/,
  ];
  
  // Complex question indicators
  const complexIndicators = [
    /\b(complex|complicated|difficult|challenging|advanced)\b/,
    /\b(optimize|optimization|efficient|performance)\b/,
    /\b(design|architecture|system|structure)\b/,
  ];
  
  // Check all patterns
  const allPatterns = [...mathPatterns, ...codePatterns, ...reasoningPatterns, ...complexIndicators];
  
  for (const pattern of allPatterns) {
    if (pattern.test(lowerQuery)) {
      return true;
    }
  }
  
  // Also check query length - longer queries often need more reasoning
  if (query.length > 500) {
    return true;
  }
  
  return false;
}
