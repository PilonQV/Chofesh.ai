/**
 * Enhanced Autonomous Agent for Chofesh.ai
 * 
 * This is a Manus-level autonomous agent that combines:
 * 1. ReAct Pattern (Reasoning + Acting)
 * 2. Memory System (Short-term + Long-term)
 * 3. Chain of Thought Reasoning
 * 4. Dynamic Tool Selection
 * 5. Self-Correction and Learning
 * 
 * The agent thinks, plans, acts, observes, and learns like Manus.
 */

import { runReActAgent, createLLMFunction } from "./reactAgent";
import { AgentMemoryDB } from "./agentMemoryDB";
import { searchWithGemini } from "./geminiSearch";
import { searchDuckDuckGo } from "./duckduckgo";

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedAgentRequest {
  userId: number;
  conversationId: string;
  userMessage: string;
  conversationHistory: any[];
}

export interface EnhancedAgentResponse {
  answer: string;
  reasoning: string;
  toolsUsed: string[];
  iterations: number;
  confidence: number;
  suggestions: string[];
  wasSuccessful: boolean;
}

// ============================================================================
// LLM PROVIDER INTERFACE
// ============================================================================

/**
 * Interface for calling different LLM providers
 * This abstracts away the specific implementation
 */
export interface LLMProvider {
  name: string;
  call: (messages: any[]) => Promise<string>;
}

// ============================================================================
// ENHANCED AUTONOMOUS AGENT
// ============================================================================

/**
 * Main enhanced autonomous agent that uses ReAct + Memory
 */
export async function runEnhancedAutonomousAgent(
  request: EnhancedAgentRequest,
  llmProvider: LLMProvider
): Promise<EnhancedAgentResponse> {
  const startTime = Date.now();
  const { userId, conversationId, userMessage, conversationHistory } = request;
  
  console.log("[Enhanced Agent] Starting for user", userId);
  
  // ============================================================================
  // STEP 1: MEMORY RETRIEVAL
  // ============================================================================
  
  // Add user message to short-term memory
  await AgentMemoryDB.shortTerm.addMessage(conversationId, userId, 'user', userMessage);
  
  // Get full context from memory
  const memoryContext = await AgentMemoryDB.getFullContext(userId, conversationId, userMessage);
  console.log("[Enhanced Agent] Memory context loaded:", {
    recentMessages: memoryContext.recentMessages.length,
    pastInteractions: memoryContext.relevantPastInteractions.length,
    episodes: memoryContext.relevantEpisodes.length,
  });
  
  // ============================================================================
  // STEP 2: ENHANCED PROMPT WITH MEMORY
  // ============================================================================
  
  // Build context-aware prompt that includes memory
  const enhancedPrompt = buildEnhancedPrompt(userMessage, memoryContext);
  
  // ============================================================================
  // STEP 3: RUN REACT AGENT
  // ============================================================================
  
  // Create LLM function wrapper
  const llmFunction = createLLMFunction(
    llmProvider.name,
    'default',
    llmProvider.call
  );
  
  // Run the ReAct agent loop
  console.log("[Enhanced Agent] Running ReAct loop...");
  const reactResult = await runReActAgent(
    enhancedPrompt,
    conversationHistory,
    llmFunction,
    10 // max iterations
  );
  
  console.log("[Enhanced Agent] ReAct loop completed:", {
    iterations: reactResult.iterations,
    toolsUsed: reactResult.toolsUsed,
  });
  
  // ============================================================================
  // STEP 4: EVALUATE RESULT
  // ============================================================================
  
  const wasSuccessful = evaluateSuccess(reactResult, userMessage);
  const confidence = calculateConfidence(reactResult);
  
  // ============================================================================
  // STEP 5: UPDATE MEMORY
  // ============================================================================
  
  // Add assistant response to short-term memory
  await AgentMemoryDB.shortTerm.addMessage(conversationId, userId, 'assistant', reactResult.finalAnswer);
  
  // Record interaction in long-term memory
  const duration = Date.now() - startTime;
  await AgentMemoryDB.longTerm.recordInteraction(
    userId,
    userMessage,
    reactResult.finalAnswer,
    reactResult.toolsUsed,
    wasSuccessful,
    duration
  );
  
  // Record episode if significant
  if (reactResult.toolsUsed.length > 0) {
    await AgentMemoryDB.episodic.recordEpisode(
      userId,
      reactResult.toolsUsed[0], // Use first tool as episode type
      `User asked: "${userMessage}"`,
      `Used tools: ${reactResult.toolsUsed.join(', ')}`,
      reactResult.finalAnswer,
      wasSuccessful ? 'success' : 'partial',
      reactResult.toolsUsed,
      duration
    );
  }
  
  // Record tool usage statistics
  for (const tool of reactResult.toolsUsed) {
    await AgentMemoryDB.toolPreferences.recordUsage(userId, tool, wasSuccessful, duration);
  }
  
  // ============================================================================
  // STEP 6: GENERATE SUGGESTIONS
  // ============================================================================
  
  const suggestions = generateSmartSuggestions(
    userMessage,
    reactResult,
    memoryContext
  );
  
  // ============================================================================
  // STEP 7: RETURN ENHANCED RESPONSE
  // ============================================================================
  
  return {
    answer: reactResult.finalAnswer,
    reasoning: reactResult.reasoning,
    toolsUsed: reactResult.toolsUsed,
    iterations: reactResult.iterations,
    confidence,
    suggestions,
    wasSuccessful,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build an enhanced prompt that includes memory context
 */
function buildEnhancedPrompt(
  userMessage: string,
  memoryContext: ReturnType<typeof AgentMemory.getFullContext>
): string {
  let prompt = userMessage;
  
  // Add conversation history context
  if (memoryContext.recentMessages.length > 0) {
    const recentContext = memoryContext.recentMessages
      .slice(-5)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    prompt += `\n\nRecent conversation:\n${recentContext}`;
  }
  
  // Add relevant past interactions
  if (memoryContext.relevantPastInteractions.length > 0) {
    const pastContext = memoryContext.relevantPastInteractions
      .map(i => `Past: User asked "${i.userQuery}" and we ${i.wasSuccessful ? 'successfully' : 'partially'} resolved it using ${i.toolsUsed.join(', ')}`)
      .join('\n');
    prompt += `\n\nRelevant past experience:\n${pastContext}`;
  }
  
  // Add user preferences
  if (memoryContext.userPreferences.preferredResponseStyle) {
    prompt += `\n\nUser prefers ${memoryContext.userPreferences.preferredResponseStyle} responses.`;
  }
  
  // Add preferred tools
  if (memoryContext.preferredTools.length > 0) {
    const toolNames = memoryContext.preferredTools.map(t => t.toolName).join(', ');
    prompt += `\n\nUser has had success with these tools: ${toolNames}`;
  }
  
  return prompt;
}

/**
 * Evaluate if the agent was successful
 */
function evaluateSuccess(
  reactResult: any,
  userMessage: string
): boolean {
  // Success criteria:
  // 1. Agent provided a final answer
  // 2. Used appropriate tools
  // 3. Didn't hit max iterations without completing
  
  if (!reactResult.finalAnswer || reactResult.finalAnswer.length < 10) {
    return false;
  }
  
  if (reactResult.iterations >= 10 && !reactResult.finalAnswer.includes("silver")) {
    return false; // Hit max iterations without good answer
  }
  
  // Check if answer seems relevant
  const userWords = userMessage.toLowerCase().split(/\s+/);
  const answerWords = reactResult.finalAnswer.toLowerCase().split(/\s+/);
  const overlap = userWords.filter(w => answerWords.includes(w)).length;
  
  return overlap >= 2; // At least 2 words overlap
}

/**
 * Calculate confidence score (0-1)
 */
function calculateConfidence(reactResult: any): number {
  let confidence = 0.5; // Start at 50%
  
  // Higher confidence if completed in fewer iterations
  if (reactResult.iterations <= 3) {
    confidence += 0.2;
  } else if (reactResult.iterations <= 6) {
    confidence += 0.1;
  }
  
  // Higher confidence if used tools successfully
  if (reactResult.toolsUsed.length > 0) {
    confidence += 0.2;
  }
  
  // Higher confidence if answer is substantial
  if (reactResult.finalAnswer && reactResult.finalAnswer.length > 100) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

/**
 * Generate smart follow-up suggestions
 */
function generateSmartSuggestions(
  userMessage: string,
  reactResult: any,
  memoryContext: any
): string[] {
  const suggestions: string[] = [];
  
  // Suggest related queries based on tools used
  if (reactResult.toolsUsed.includes('search')) {
    suggestions.push("Would you like me to search for more recent information?");
    suggestions.push("I can compare this with historical data if you'd like");
  }
  
  // Suggest visualization if data-related
  if (/price|data|trend|statistic/i.test(userMessage)) {
    suggestions.push("I can help you visualize this data in a chart");
    suggestions.push("Would you like to see the trend over time?");
  }
  
  // Suggest deeper analysis
  if (reactResult.iterations <= 3) {
    suggestions.push("I can provide more detailed analysis if needed");
  }
  
  // Suggest related topics from past interactions
  if (memoryContext.relevantPastInteractions.length > 0) {
    const pastTopic = memoryContext.relevantPastInteractions[0].userQuery;
    suggestions.push(`This relates to your earlier question about "${pastTopic.substring(0, 50)}..."`);
  }
  
  return suggestions.slice(0, 3); // Return top 3
}

// ============================================================================
// QUICK INTEGRATION WRAPPER
// ============================================================================

/**
 * Simplified wrapper for easy integration with existing code
 */
export async function runManusLikeAgent(
  userMessage: string,
  conversationHistory: any[],
  userId: number,
  llmProvider: LLMProvider
): Promise<string> {
  const conversationId = `conv-${userId}-${Date.now()}`;
  
  const result = await runEnhancedAutonomousAgent(
    {
      userId,
      conversationId,
      userMessage,
      conversationHistory,
    },
    llmProvider
  );
  
  // Format response with reasoning (optional, can be hidden)
  let response = result.answer;
  
  // Add suggestions
  if (result.suggestions.length > 0) {
    response += "\n\n**What would you like to do next?**\n";
    response += result.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
  }
  
  return response;
}
