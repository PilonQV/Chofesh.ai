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

// OpenRouter model IDs
export const OPENROUTER_MODELS = {
  DEEPSEEK_R1: "deepseek/deepseek-r1-0528:free",
} as const;

/**
 * Invoke a model via OpenRouter's free tier
 * Note: Free tier has rate limits and may have availability constraints
 */
export async function invokeOpenRouter(options: OpenRouterOptions): Promise<OpenRouterResponse> {
  const { messages, model = OPENROUTER_MODELS.DEEPSEEK_R1, temperature = 0.7, max_tokens = 4096, top_p = 1 } = options;
  
  // Get API key from environment
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chofesh.ai",
      "X-Title": "Chofesh.ai",
      // API key required for authentication even on free models
      ...(apiKey && { "Authorization": `Bearer ${apiKey}` }),
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
 * Invoke DeepSeek R1 via OpenRouter's free tier
 * @deprecated Use invokeOpenRouter with model parameter instead
 */
export async function invokeDeepSeekR1(options: OpenRouterOptions): Promise<OpenRouterResponse> {
  return invokeOpenRouter({ ...options, model: OPENROUTER_MODELS.DEEPSEEK_R1 });
}



/**
 * Common refusal patterns that indicate a model declined to respond
 */
export const REFUSAL_PATTERNS = [
  /I (?:can't|cannot|won't|will not|am not able to|'m not able to) (?:help|assist|provide|generate|create|write|fulfill)/i,
  /I (?:don't|do not) (?:feel comfortable|think I should|want to)/i,
  /(?:sorry|apologies|apologize),? (?:but )?I (?:can't|cannot|won't)/i,
  /(?:as an AI|as a language model|as an assistant),? I (?:can't|cannot|shouldn't)/i,
  /(?:this|that|your) (?:request|query|question) (?:violates|goes against|is against)/i,
  /I'm (?:designed|programmed|built) to (?:avoid|decline|refuse|follow)/i,
  /(?:content|safety|ethical) (?:policy|guidelines|standards)/i,
  /(?:harmful|dangerous|illegal|unethical|inappropriate) (?:content|material|information)/i,
  /I (?:must|need to) (?:decline|refuse|pass on)/i,
  /(?:outside|beyond) (?:my|the) (?:capabilities|scope|guidelines)/i,
  // Additional patterns for NSFW refusals
  /I cannot fulfill this request/i,
  /prohibit(?:s|ed)? the creation/i,
  /strict safety guidelines/i,
  /sexually explicit content/i,
  /adult content/i,
  /explicit (?:sexual|adult|mature) (?:content|material)/i,
  /I am programmed to follow/i,
  /against my (?:programming|guidelines|policies)/i,
  /not (?:able|allowed|permitted) to (?:generate|create|write|produce)/i,
  /unable to (?:comply|assist|help) with/i,
  // Grok-specific refusal patterns
  /I'm sorry,? but I must adhere to/i,
  /adhere to guidelines that prioritize/i,
  /prioritize respectful and appropriate content/i,
  /content of an explicit nature/i,
  /I must adhere to guidelines/i,
  /guidelines that prioritize/i,
  /respectful and appropriate content/i,
  /If you're looking for assistance with something else/i,
  /I'd be happy to help with that/i,
  /exploring relationship dynamics in a non-explicit way/i,
];

/**
 * Check if a response indicates the model refused to answer
 */
export function isRefusalResponse(response: string): boolean {
  // Check the entire response for short responses, or first 500 chars for longer ones
  const textToCheck = response.length > 500 ? response.substring(0, 500) : response;
  
  for (const pattern of REFUSAL_PATTERNS) {
    if (pattern.test(textToCheck)) {
      return true;
    }
  }
  
  return false;
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


/**
 * NSFW/Adult content patterns that indicate user is requesting explicit content
 * Used to auto-route age-verified users to uncensored model seamlessly
 */
const NSFW_CONTENT_PATTERNS = [
  // Explicit sexual content requests
  /\b(nsfw|explicit|adult|erotic|sexual|porn|xxx|hentai|lewd)\b/i,
  /\b(nude|naked|undress|strip|topless|bottomless)\b/i,
  /\b(sex|intercourse|foreplay|orgasm|climax)\b/i,
  /\b(fetish|kink|bdsm|bondage|dominat|submissive)\b/i,
  
  // Roleplay and fantasy indicators
  /\b(roleplay|role-play|rp)\s+(as|with|scenario)/i,
  /\b(seduc|flirt|teas|arousing|sensual)\b/i,
  /\b(intimate|passion|lust|desire)\s+(scene|story|content)/i,
  
  // Creative writing requests
  /\b(write|create|generate)\s+(me\s+)?(an?\s+)?(erotic|explicit|adult|nsfw|sexual)/i,
  /\b(story|fiction|narrative|scene)\s+(with|about|involving)\s+(sex|explicit|adult)/i,
  
  // Body parts in sexual context
  /\b(breast|boob|nipple|genital|penis|vagina|ass|butt)\b/i,
  
  // Relationship/dating context with explicit intent
  /\b(girlfriend|boyfriend|wife|husband)\s+(experience|fantasy|roleplay)/i,
  
  // Uncensored/unrestricted requests
  /\b(uncensored|unfiltered|unrestricted|no\s+limits|without\s+restrictions)\b/i,
  /\b(don't\s+hold\s+back|be\s+explicit|get\s+dirty|talk\s+dirty)\b/i,
];

/**
 * Check if a query appears to request NSFW/adult content
 * Used to automatically route age-verified users to uncensored model
 */
export function isNsfwContentRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  for (const pattern of NSFW_CONTENT_PATTERNS) {
    if (pattern.test(lowerQuery)) {
      return true;
    }
  }
  
  return false;
}
