/**
 * ReAct Agent Integration with Chofesh.ai Chat System
 * 
 * This module integrates the ReAct autonomous agent with the existing
 * chat infrastructure, providing a seamless Manus-like experience.
 */

import { invokeAICompletion } from "./aiProviders";
import { runManusLikeAgent, type LLMProvider } from "./autonomousAgentEnhanced";

// ============================================================================
// LLM PROVIDER IMPLEMENTATION
// ============================================================================

/**
 * Creates an LLM provider that uses the existing invokeLLM function
 */
export function createChofeshLLMProvider(): LLMProvider {
  return {
    name: "kimi-orchestrator",
    call: async (messages: any[]): Promise<string> => {
      // Call AI with Kimi orchestration enabled
      // Don't pass model - let orchestrator decide
      const result = await invokeAICompletion({
        messages,
        temperature: 0.7,
        maxTokens: 4096,
        useOrchestration: true, // Enable Kimi orchestration
      });
      
      return result.content;
    }
  };
}

// ============================================================================
// INTEGRATION FUNCTION
// ============================================================================

/**
 * Run the ReAct autonomous agent for a chat message
 * This is the main integration point
 */
export async function runReActForChat(
  userMessage: string,
  conversationHistory: any[],
  userId: number
): Promise<{
  content: string;
  reasoning?: string;
  toolsUsed: string[];
  confidence: number;
}> {
  try {
    // Create LLM provider
    const llmProvider = createChofeshLLMProvider();
    
    // Run the Manus-like agent
    const response = await runManusLikeAgent(
      userMessage,
      conversationHistory,
      userId,
      llmProvider
    );
    
    return {
      content: response,
      toolsUsed: [],
      confidence: 0.8,
    };
  } catch (error: any) {
    console.error("[ReAct Integration] Error:", error);
    throw error;
  }
}

// ============================================================================
// DETECTION: WHEN TO USE REACT AGENT
// ============================================================================

/**
 * Determines if a query should use the ReAct agent
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Skip ReAct for simple queries (identity, greetings, basic facts)
 * - Route simple queries directly to fast LLMs (Groq/Cerebras)
 * - Reserve ReAct for complex queries needing tools
 * 
 * Use ReAct for:
 * - Questions requiring real-time information
 * - Multi-step reasoning tasks
 * - Complex problem-solving
 * - Tasks requiring tool use (search, calculate, image generation)
 * 
 * Skip ReAct for:
 * - Identity questions ("who are you", "what model")
 * - Greetings ("hello", "hi", "how are you")
 * - Basic facts that don't need tools
 * - Short simple questions (<10 words)
 */
export function shouldUseReActAgent(userMessage: string): boolean {
  const message = userMessage.toLowerCase();
  
  // SKIP REACT: Simple identity questions ("who are you", "what model")
  const isIdentityQuestion = /\b(who are you|what (are you|is your|model|llm|ai)|your (name|model|identity))\b/i.test(userMessage);
  if (isIdentityQuestion) {
    console.log('[ReAct Router] Skipping ReAct for identity question - routing to fast LLM');
    return false;
  }
  
  // SKIP REACT: Greetings and pleasantries
  const isGreeting = /^(hi|hello|hey|good (morning|afternoon|evening)|how are you|thanks|thank you)\b/i.test(userMessage.trim());
  if (isGreeting) {
    console.log('[ReAct Router] Skipping ReAct for greeting - routing to fast LLM');
    return false;
  }
  
  // SKIP REACT: Very short simple questions (<10 words, no tool indicators)
  const wordCount = userMessage.split(/\s+/).length;
  const hasToolIndicators = /\b(search|find|look up|get data|fetch|calculate|generate|create)\b/i.test(userMessage);
  if (wordCount < 10 && !hasToolIndicators) {
    console.log(`[ReAct Router] Skipping ReAct for short simple question (${wordCount} words) - routing to fast LLM`);
    return false;
  }
  
  // USE REACT: Real-time information queries
  const needsRealTimeInfo = /\b(current|latest|today|now|recent|price|news|weather)\b/i.test(userMessage);
  if (needsRealTimeInfo) {
    console.log('[ReAct Router] Using ReAct for real-time information query');
    return true;
  }
  
  // USE REACT: Multi-step reasoning
  const needsReasoning = /\b(how to|step by step|explain|analyze|compare)\b/i.test(userMessage);
  if (needsReasoning) {
    console.log('[ReAct Router] Using ReAct for multi-step reasoning');
    return true;
  }
  
  // USE REACT: Complex questions (>15 words)
  const isComplex = wordCount > 15;
  if (isComplex) {
    console.log(`[ReAct Router] Using ReAct for complex question (${wordCount} words)`);
    return true;
  }
  
  // USE REACT: Tool-requiring tasks
  const needsTools = /\b(search|find|look up|get data|fetch|calculate|generate|create)\b/i.test(userMessage);
  if (needsTools) {
    console.log('[ReAct Router] Using ReAct for tool-requiring task');
    return true;
  }
  
  // DEFAULT: Skip ReAct for everything else (simple questions)
  console.log('[ReAct Router] Skipping ReAct for simple question - routing to fast LLM');
  return false;
}

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

/**
 * Format the ReAct agent response for display in chat
 */
export function formatReActResponse(
  answer: string,
  reasoning?: string,
  toolsUsed?: string[],
  showReasoning: boolean = false
): string {
  let formatted = answer;
  
  // Optionally show reasoning (for debugging or transparency)
  if (showReasoning && reasoning) {
    formatted += "\n\n---\n**Agent Reasoning:**\n" + reasoning;
  }
  
  // Optionally show tools used (for transparency)
  if (toolsUsed && toolsUsed.length > 0 && showReasoning) {
    formatted += `\n\n*Tools used: ${toolsUsed.join(', ')}*`;
  }
  
  return formatted;
}
