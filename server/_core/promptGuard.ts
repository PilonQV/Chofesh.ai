/**
 * Llama Prompt Guard 2 - Detect and block prompt injection attacks
 * Uses Groq's Llama Prompt Guard 2 86M model
 */
import { TRPCError } from "@trpc/server";

export type PromptGuardResult = {
  isInjection: boolean;
  confidence: number;
  classification: "safe" | "injection" | "jailbreak";
  rawResponse?: string;
};

/**
 * Check if a prompt contains injection attempts using Llama Prompt Guard 2
 */
export async function checkPromptInjection(
  prompt: string,
  apiKey?: string
): Promise<PromptGuardResult> {
  const groqApiKey = apiKey || process.env.GROQ_API_KEY;
  
  if (!groqApiKey) {
    // If no API key, skip check (fail open for better UX)
    return {
      isInjection: false,
      confidence: 0,
      classification: "safe",
    };
  }

  try {
    // Call Groq API with Prompt Guard 2 model
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-prompt-guard-2-86m",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.0, // Use deterministic output for security checks
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      console.error(`Prompt Guard API error: ${response.status} ${response.statusText}`);
      // Fail open - don't block users if the security check fails
      return {
        isInjection: false,
        confidence: 0,
        classification: "safe",
      };
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.toLowerCase() || "";

    // Parse the classification result
    // Prompt Guard 2 returns: "safe", "injection", or "jailbreak"
    let classification: "safe" | "injection" | "jailbreak" = "safe";
    let isInjection = false;
    let confidence = 0;

    if (result.includes("injection")) {
      classification = "injection";
      isInjection = true;
      confidence = 0.9;
    } else if (result.includes("jailbreak")) {
      classification = "jailbreak";
      isInjection = true;
      confidence = 0.95;
    } else if (result.includes("safe")) {
      classification = "safe";
      isInjection = false;
      confidence = 0.1;
    }

    return {
      isInjection,
      confidence,
      classification,
      rawResponse: result,
    };
  } catch (error) {
    console.error("Prompt Guard check failed:", error);
    // Fail open - don't block users if the security check fails
    return {
      isInjection: false,
      confidence: 0,
      classification: "safe",
    };
  }
}

/**
 * Middleware to check prompts before processing
 * Throws TRPCError if injection is detected
 */
export async function validatePromptSecurity(
  prompt: string,
  apiKey?: string,
  throwOnInjection: boolean = true
): Promise<void> {
  const result = await checkPromptInjection(prompt, apiKey);

  if (result.isInjection && throwOnInjection) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Potential prompt injection detected (${result.classification}). Please rephrase your request.`,
    });
  }
}
