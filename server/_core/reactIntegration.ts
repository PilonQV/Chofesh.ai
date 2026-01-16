/**
 * ReAct Agent Integration with Chofesh.ai Chat System
 * 
 * This module integrates the ReAct autonomous agent with the existing
 * chat infrastructure, providing a seamless Manus-like experience.
 */

import { invokeLLM, type Message, type InvokeResult } from "./llm";
import { runManusLikeAgent, type LLMProvider } from "./autonomousAgentEnhanced";

// ============================================================================
// LLM PROVIDER IMPLEMENTATION
// ============================================================================

/**
 * Creates an LLM provider that uses the existing invokeLLM function
 */
export function createChofeshLLMProvider(): LLMProvider {
  return {
    name: "chofesh-llm",
    call: async (messages: any[]): Promise<string> => {
      // Convert to proper Message format
      const formattedMessages: Message[] = messages.map(m => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      }));
      
      // Call the existing LLM
      const result: InvokeResult = await invokeLLM({
        messages: formattedMessages,
        maxTokens: 4096,
      });
      
      // Extract text response
      const content = result.choices[0]?.message?.content;
      if (typeof content === 'string') {
        return content;
      }
      
      // Handle array content (multimodal)
      if (Array.isArray(content)) {
        const textParts = content
          .filter(c => c.type === 'text')
          .map(c => 'text' in c ? c.text : '')
          .join('\n');
        return textParts;
      }
      
      return "";
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
 * Use ReAct for:
 * - Questions requiring real-time information
 * - Multi-step reasoning tasks
 * - Complex problem-solving
 * - Tasks requiring tool use
 */
export function shouldUseReActAgent(userMessage: string): boolean {
  const message = userMessage.toLowerCase();
  
  // Real-time information queries
  const needsRealTimeInfo = /\b(current|latest|today|now|recent|price|news|weather)\b/i.test(userMessage);
  
  // Multi-step reasoning
  const needsReasoning = /\b(how to|step by step|explain|analyze|compare|calculate)\b/i.test(userMessage);
  
  // Complex questions
  const isComplex = userMessage.split(/\s+/).length > 15; // Long queries tend to be complex
  
  // Tool-requiring tasks
  const needsTools = /\b(search|find|look up|get data|fetch)\b/i.test(userMessage);
  
  return needsRealTimeInfo || needsReasoning || isComplex || needsTools;
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
