/**
 * ReAct Agent Implementation for Chofesh.ai
 * 
 * ReAct = Reasoning + Acting
 * 
 * This implements the ReAct pattern where the agent:
 * 1. THOUGHT: Reasons about what to do next (Chain of Thought)
 * 2. ACTION: Executes a tool or takes an action
 * 3. OBSERVATION: Analyzes the result
 * 4. REPEAT: Continues until the goal is achieved
 * 
 * This makes the agent think and act like Manus - iteratively solving
 * problems through reasoning and tool use.
 */

import { searchDuckDuckGo } from "./duckduckgo";
import { enhancedWebSearch } from "./webSearchEnhanced";
import { searchWithGemini } from "./geminiSearch";

// ============================================================================
// TYPES
// ============================================================================

export interface ReActStep {
  thought: string;      // Agent's reasoning
  action?: string;      // Action to take (tool name)
  actionInput?: any;    // Input for the action
  observation?: string; // Result of the action
  isComplete: boolean;  // Whether the task is done
}

export interface ReActResult {
  steps: ReActStep[];
  finalAnswer: string;
  reasoning: string;    // Full reasoning chain
  toolsUsed: string[];
  iterations: number;
}

export interface Tool {
  name: string;
  description: string;
  execute: (input: any) => Promise<string>;
}

// ============================================================================
// AVAILABLE TOOLS
// ============================================================================

const TOOLS: Tool[] = [
  {
    name: "search",
    description: "Search the web for current information. Use this when you need real-time data, current prices, news, or any information that changes over time. Input should be a search query string.",
    execute: async (query: string) => {
      try {
        // Use Gemini search for best results
        const result = await searchWithGemini(query);
        return result.text;
      } catch (error) {
        console.error("Gemini search failed, falling back to DuckDuckGo:", error);
        // Fallback to DuckDuckGo
        const results = await searchDuckDuckGo(query);
        return results.slice(0, 3).map(r => `${r.title}: ${r.description}`).join('\n\n');
      }
    }
  },
  {
    name: "calculate",
    description: "Perform mathematical calculations. Input should be a mathematical expression as a string (e.g., '(123 + 456) * 2').",
    execute: async (expression: string) => {
      try {
        // Safe eval using Function constructor
        const result = Function(`'use strict'; return (${expression})`)();
        return `Result: ${result}`;
      } catch (error: any) {
        return `Error in calculation: ${error.message}`;
      }
    }
  },
  {
    name: "think",
    description: "Use this to think through a problem step-by-step without taking any external action. Input should be your reasoning about the problem.",
    execute: async (reasoning: string) => {
      return `Thought process recorded: ${reasoning}`;
    }
  },
  {
    name: "final_answer",
    description: "Use this when you have gathered all necessary information and are ready to provide the final answer to the user. Input should be your complete answer.",
    execute: async (answer: string) => {
      return answer;
    }
  }
];

// ============================================================================
// REACT PROMPTING
// ============================================================================

/**
 * Creates the ReAct system prompt that guides the LLM to follow
 * the Thought-Action-Observation pattern
 */
function createReActPrompt(userQuery: string, conversationHistory: any[]): string {
  const toolDescriptions = TOOLS.map(t => `- ${t.name}: ${t.description}`).join('\n');
  
  return `You are an autonomous AI agent that solves problems using the ReAct (Reasoning and Acting) framework.

You think step-by-step and can use tools to gather information and solve problems.

AVAILABLE TOOLS:
${toolDescriptions}

INSTRUCTIONS:
You MUST follow this exact format for each step:

Thought: [Your reasoning about what to do next]
Action: [The tool name to use, or "final_answer" when done]
Action Input: [The input for the tool]

After each action, you will receive an observation. Then you continue:

Observation: [Result from the tool]
Thought: [Your reasoning about the observation]
Action: [Next tool to use]
Action Input: [Input for the tool]

Continue this process until you have enough information to answer the user's question.
When you're ready to provide the final answer, use:

Thought: [Your final reasoning]
Action: final_answer
Action Input: [Your complete answer to the user]

IMPORTANT RULES:
1. Always start with a Thought
2. Use tools to gather information - don't make up facts
3. For current/real-time information (prices, news, weather), ALWAYS use the search tool
4. Think step-by-step and show your reasoning
5. When you have enough information, provide a final_answer
6. Maximum 10 iterations - be efficient

USER QUERY: ${userQuery}

Begin! Start with your first Thought.`;
}

// ============================================================================
// REACT AGENT EXECUTION
// ============================================================================

/**
 * Runs the ReAct agent loop
 * This is the core of the autonomous agent system
 */
export async function runReActAgent(
  userQuery: string,
  conversationHistory: any[],
  llmFunction: (prompt: string) => Promise<string>,
  maxIterations: number = 10
): Promise<ReActResult> {
  const steps: ReActStep[] = [];
  const toolsUsed: string[] = [];
  let iteration = 0;
  let isComplete = false;
  let finalAnswer = "";
  
  // Build the initial prompt
  const systemPrompt = createReActPrompt(userQuery, conversationHistory);
  let context = systemPrompt;
  
  // ReAct Loop: Thought -> Action -> Observation -> Repeat
  while (!isComplete && iteration < maxIterations) {
    iteration++;
    console.log(`[ReAct Agent] Iteration ${iteration}/${maxIterations}`);
    
    try {
      // Get LLM response (Thought + Action)
      const llmResponse = await llmFunction(context);
      console.log(`[ReAct Agent] LLM Response:\n${llmResponse}`);
      
      // Parse the response
      const parsed = parseReActResponse(llmResponse);
      
      if (!parsed.thought) {
        console.error("[ReAct Agent] No thought found in response");
        break;
      }
      
      // Create step with thought
      const step: ReActStep = {
        thought: parsed.thought,
        action: parsed.action,
        actionInput: parsed.actionInput,
        isComplete: false,
      };
      
      // If no action specified, this might be the final answer in the thought
      if (!parsed.action) {
        step.isComplete = true;
        isComplete = true;
        finalAnswer = parsed.thought;
        steps.push(step);
        break;
      }
      
      // Execute the action
      const tool = TOOLS.find(t => t.name === parsed.action);
      
      if (!tool) {
        step.observation = `Error: Unknown tool "${parsed.action}". Available tools: ${TOOLS.map(t => t.name).join(', ')}`;
        steps.push(step);
        context += `\n\n${llmResponse}\nObservation: ${step.observation}\n`;
        continue;
      }
      
      // Check if this is the final answer
      if (parsed.action === 'final_answer') {
        step.observation = parsed.actionInput;
        step.isComplete = true;
        isComplete = true;
        finalAnswer = parsed.actionInput;
        steps.push(step);
        break;
      }
      
      // Execute the tool
      console.log(`[ReAct Agent] Executing tool: ${parsed.action}`);
      toolsUsed.push(parsed.action);
      
      try {
        const observation = await tool.execute(parsed.actionInput);
        step.observation = observation;
        console.log(`[ReAct Agent] Observation: ${observation.substring(0, 200)}...`);
      } catch (error: any) {
        step.observation = `Error executing ${parsed.action}: ${error.message}`;
        console.error(`[ReAct Agent] Tool execution error:`, error);
      }
      
      steps.push(step);
      
      // Add to context for next iteration
      context += `\n\n${llmResponse}\nObservation: ${step.observation}\n`;
      
    } catch (error: any) {
      console.error(`[ReAct Agent] Error in iteration ${iteration}:`, error);
      steps.push({
        thought: `Error occurred: ${error.message}`,
        isComplete: true,
      });
      break;
    }
  }
  
  // If we hit max iterations without completing, synthesize an answer
  if (!isComplete) {
    finalAnswer = "I've analyzed the information but reached the iteration limit. Based on what I've gathered: " + 
                  (steps[steps.length - 1]?.observation || "Unable to complete the task fully.");
  }
  
  // Build reasoning chain
  const reasoning = steps.map((step, i) => {
    let text = `**Step ${i + 1}:**\n`;
    text += `*Thought:* ${step.thought}\n`;
    if (step.action) {
      text += `*Action:* ${step.action}(${JSON.stringify(step.actionInput)})\n`;
    }
    if (step.observation) {
      text += `*Observation:* ${step.observation}\n`;
    }
    return text;
  }).join('\n');
  
  return {
    steps,
    finalAnswer,
    reasoning,
    toolsUsed: Array.from(new Set(toolsUsed)), // Remove duplicates
    iterations: iteration,
  };
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Parses the LLM response to extract Thought, Action, and Action Input
 */
function parseReActResponse(response: string): {
  thought: string;
  action?: string;
  actionInput?: any;
} {
  const lines = response.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let thought = "";
  let action: string | undefined;
  let actionInput: any;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract Thought
    if (line.toLowerCase().startsWith('thought:')) {
      thought = line.substring(line.indexOf(':') + 1).trim();
      // Continue reading until we hit Action or end
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].toLowerCase().startsWith('action:')) {
          break;
        }
        thought += ' ' + lines[j];
      }
    }
    
    // Extract Action
    if (line.toLowerCase().startsWith('action:')) {
      action = line.substring(line.indexOf(':') + 1).trim();
    }
    
    // Extract Action Input
    if (line.toLowerCase().startsWith('action input:')) {
      actionInput = line.substring(line.indexOf(':') + 1).trim();
      // Continue reading until we hit next section or end
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].toLowerCase().startsWith('thought:') || 
            lines[j].toLowerCase().startsWith('action:') ||
            lines[j].toLowerCase().startsWith('observation:')) {
          break;
        }
        actionInput += ' ' + lines[j];
      }
    }
  }
  
  return { thought, action, actionInput };
}

// ============================================================================
// HELPER: LLM WRAPPER
// ============================================================================

/**
 * Creates an LLM function wrapper for use with ReAct agent
 * This abstracts away the specific LLM implementation
 */
export function createLLMFunction(
  provider: string,
  model: string,
  apiCall: (messages: any[]) => Promise<string>
): (prompt: string) => Promise<string> {
  return async (prompt: string) => {
    const messages = [
      { role: 'user', content: prompt }
    ];
    return await apiCall(messages);
  };
}
