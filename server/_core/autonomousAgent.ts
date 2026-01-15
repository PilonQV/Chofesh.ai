/**
 * Autonomous Agent System for Chofesh.ai
 * 
 * An intelligent agent that thinks like Manus:
 * - Understands user goals through natural conversation
 * - Plans solutions step-by-step
 * - Researches and gathers information automatically
 * - Chooses the best tools intelligently
 * - Offers options and solutions instead of limitations
 * 
 * Architecture:
 * 1. Intent Understanding Layer - Deeply analyze what the user wants
 * 2. Planning Layer - Break down complex tasks into steps
 * 3. Research Layer - Automatically gather needed information
 * 4. Tool Selection Layer - Choose the right tools intelligently
 * 5. Execution Layer - Execute the plan with user confirmation
 * 6. Feedback Layer - Offer alternatives and next steps
 */

import { searchDuckDuckGo } from "./duckduckgo";
import { enhancedWebSearch } from "./webSearchEnhanced";
import { getRealtimeAnswer } from "./perplexitySonar";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface UserGoal {
  primary: string;              // Main goal (e.g., "Get silver price trend data")
  subGoals: string[];           // Sub-goals (e.g., ["Find historical data", "Create visualization"])
  constraints: string[];        // Constraints (e.g., ["Last 6 months", "Graphic format"])
  context: string;              // Full context from conversation
  requiresRealTimeData: boolean;
  requiresVisualization: boolean;
  requiresCreation: boolean;    // Creating something (image, document, code)
}

export interface AgentPlan {
  steps: AgentStep[];
  estimatedTime: string;
  requiredTools: string[];
  needsUserInput: boolean;
  alternatives: string[];       // Alternative approaches
}

export interface AgentStep {
  id: number;
  action: string;               // What to do
  tool?: string;                // Which tool to use
  reasoning: string;            // Why this step
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface ToolCapability {
  name: string;
  description: string;
  canHandle: (goal: UserGoal) => boolean;
  execute: (params: any) => Promise<any>;
  cost: number;                 // Credits cost
  speed: 'fast' | 'medium' | 'slow';
}

export interface AgentResponse {
  thinking: string;             // Agent's reasoning process (visible to user)
  plan?: AgentPlan;            // Proposed plan (if planning phase)
  result?: string;             // Final result (if execution complete)
  options: AgentOption[];      // Options for user to choose
  needsConfirmation: boolean;  // Whether user confirmation is needed
  toolsUsed: string[];         // Tools that were used
}

export interface AgentOption {
  id: string;
  label: string;
  description: string;
  action: () => Promise<any>;
}

// ============================================================================
// LAYER 1: INTENT UNDERSTANDING
// ============================================================================

/**
 * Advanced Intent Patterns
 * Recognizes complex user intentions beyond simple keywords
 */
const INTENT_PATTERNS = {
  dataVisualization: [
    /(?:show|give|get|find|display).*(?:trend|chart|graph|plot|visual)/i,
    /(?:create|make|generate|build).*(?:chart|graph|plot|diagram)/i,
    /(?:price|data|statistics).*(?:over|for|during).*(?:time|period|months|years)/i,
  ],
  realTimeInfo: [
    /(?:current|latest|today|now|recent).*(?:price|news|weather|status)/i,
    /what(?:'s| is).*(?:price|cost|value).*(?:now|today|currently)/i,
    /(?:last|past)\s+\d+\s+(?:days?|weeks?|months?|years?)/i,
  ],
  problemSolving: [
    /how (?:do i|can i|to).*(?:fix|solve|resolve|handle)/i,
    /(?:help|assist).*(?:with|me)/i,
    /(?:issue|problem|error).*(?:with|in)/i,
  ],
  learning: [
    /(?:what|how|why|when|where) (?:is|are|does|do)/i,
    /(?:explain|teach|show).*(?:how|what|why)/i,
    /(?:learn|understand).*(?:about|how)/i,
  ],
  creation: [
    /(?:create|make|generate|build|design|write|code|draw)/i,
  ],
};

/**
 * Deeply understand what the user wants to accomplish
 * Goes beyond simple keyword matching to understand intent and context
 */
export function understandUserGoal(userMessage: string, conversationHistory: any[]): UserGoal {
  const lowerMessage = userMessage.toLowerCase();
  
  // Use advanced pattern matching
  const matchesDataViz = INTENT_PATTERNS.dataVisualization.some(p => p.test(userMessage));
  const matchesRealTime = INTENT_PATTERNS.realTimeInfo.some(p => p.test(userMessage));
  const matchesProblemSolving = INTENT_PATTERNS.problemSolving.some(p => p.test(userMessage));
  const matchesLearning = INTENT_PATTERNS.learning.some(p => p.test(userMessage));
  const matchesCreation = INTENT_PATTERNS.creation.some(p => p.test(userMessage));
  
  // Analyze for primary goal
  let primary = "Provide information";
  const subGoals: string[] = [];
  const constraints: string[] = [];
  
  // Detect creation intent
  const requiresCreation = matchesCreation;
  
  // Detect visualization intent
  const requiresVisualization = matchesDataViz || /\b(graph|chart|plot|visual|diagram|graphic)\b/i.test(userMessage);
  
  // Detect real-time data need
  const requiresRealTimeData = matchesRealTime || /\b(current|latest|today|now|recent|price|news|weather|live)\b/i.test(userMessage);
  
  // Extract time constraints
  const timeMatch = userMessage.match(/\b(last|past|previous)\s+(\d+)\s+(day|week|month|year)s?\b/i);
  if (timeMatch) {
    constraints.push(`Time range: ${timeMatch[0]}`);
  }
  
  // Determine primary goal
  if (requiresVisualization && requiresRealTimeData) {
    primary = "Create data visualization with real-time information";
    subGoals.push("Gather real-time data");
    subGoals.push("Process and format data");
    subGoals.push("Create visualization");
  } else if (requiresRealTimeData) {
    primary = "Provide real-time information";
    subGoals.push("Search for current data");
    subGoals.push("Summarize findings");
  } else if (requiresCreation) {
    if (/\b(image|picture|photo|graphic)\b/i.test(userMessage)) {
      primary = "Generate image";
      subGoals.push("Understand visual requirements");
      subGoals.push("Create image with AI");
    } else if (/\b(code|program|script|function)\b/i.test(userMessage)) {
      primary = "Write code";
      subGoals.push("Understand requirements");
      subGoals.push("Write and test code");
    } else if (/\b(document|report|article)\b/i.test(userMessage)) {
      primary = "Create document";
      subGoals.push("Research topic");
      subGoals.push("Write content");
    }
  }
  
  return {
    primary,
    subGoals,
    constraints,
    context: userMessage,
    requiresRealTimeData,
    requiresVisualization,
    requiresCreation,
  };
}

// ============================================================================
// LAYER 2: PLANNING
// ============================================================================

/**
 * Create a step-by-step plan to accomplish the user's goal
 * Thinks through the problem like Manus does
 */
export function createAgentPlan(goal: UserGoal): AgentPlan {
  const steps: AgentStep[] = [];
  const requiredTools: string[] = [];
  let stepId = 1;
  
  // Step 1: Research (if needed)
  if (goal.requiresRealTimeData) {
    steps.push({
      id: stepId++,
      action: "Search the web for real-time information",
      tool: "web-search",
      reasoning: "User needs current data that I don't have in my training",
      status: 'pending',
    });
    requiredTools.push("web-search");
  }
  
  // Step 2: Data processing (if needed)
  if (goal.requiresVisualization && goal.requiresRealTimeData) {
    steps.push({
      id: stepId++,
      action: "Extract and format the data",
      reasoning: "Need to structure the data for visualization",
      status: 'pending',
    });
  }
  
  // Step 3: Creation (if needed)
  if (goal.requiresCreation) {
    if (goal.requiresVisualization) {
      // For data visualizations, offer options
      steps.push({
        id: stepId++,
        action: "Present visualization options to user",
        reasoning: "Multiple ways to visualize data - let user choose",
        status: 'pending',
      });
    } else if (/image|picture|graphic/i.test(goal.context)) {
      steps.push({
        id: stepId++,
        action: "Generate image with AI",
        tool: "image-generation",
        reasoning: "User wants a visual creation",
        status: 'pending',
      });
      requiredTools.push("image-generation");
    }
  }
  
  // Step 4: Provide result
  steps.push({
    id: stepId++,
    action: "Present findings and offer next steps",
    reasoning: "Give user the information and suggest what they can do next",
    status: 'pending',
  });
  
  // Estimate time
  const estimatedTime = steps.length <= 2 ? "< 10 seconds" : 
                       steps.length <= 4 ? "10-30 seconds" : 
                       "30-60 seconds";
  
  // Determine if user input is needed
  const needsUserInput = goal.requiresVisualization || 
                        (goal.requiresCreation && requiredTools.includes("image-generation"));
  
  // Generate alternatives
  const alternatives: string[] = [];
  if (goal.requiresVisualization) {
    alternatives.push("I can provide the raw data and you can create the chart yourself");
    alternatives.push("I can guide you to free online tools for creating charts");
  }
  if (goal.requiresRealTimeData) {
    alternatives.push("I can provide links to reliable sources where you can find this information");
  }
  
  return {
    steps,
    estimatedTime,
    requiredTools,
    needsUserInput,
    alternatives,
  };
}

// ============================================================================
// LAYER 3: RESEARCH
// ============================================================================

/**
 * Automatically research and gather information needed for the task
 */
export async function conductResearch(goal: UserGoal): Promise<{
  data: any;
  sources: string[];
  summary: string;
}> {
  if (!goal.requiresRealTimeData) {
    return { data: null, sources: [], summary: "" };
  }
  
  console.log(`[Autonomous Agent] Conducting research for: ${goal.primary}`);
  
  try {
    // Use enhanced web search
    const searchResults = await enhancedWebSearch(goal.context);
    
    // Try to get a direct answer from Perplexity Sonar
    let directAnswer = "";
    try {
      directAnswer = await getRealtimeAnswer(goal.context);
    } catch {
      // Continue without direct answer
    }
    
    const sources = searchResults.map(r => r.url || "").filter(Boolean);
    const summary = directAnswer || 
                   searchResults.map(r => r.description).join("\n\n");
    
    return {
      data: searchResults,
      sources,
      summary,
    };
  } catch (error) {
    console.error("[Autonomous Agent] Research failed:", error);
    return {
      data: null,
      sources: [],
      summary: "Unable to gather real-time information at this moment.",
    };
  }
}

// ============================================================================
// LAYER 4: TOOL SELECTION
// ============================================================================

/**
 * Intelligently choose the best tools for the task
 */
export function selectBestTools(goal: UserGoal, plan: AgentPlan): ToolCapability[] {
  const tools: ToolCapability[] = [];
  
  // Web Search Tool
  if (goal.requiresRealTimeData) {
    tools.push({
      name: "web-search",
      description: "Search the web for current information",
      canHandle: (g) => g.requiresRealTimeData,
      execute: async (params) => await enhancedWebSearch(params.query),
      cost: 0,
      speed: 'medium',
    });
  }
  
  // Image Generation Tool
  if (goal.requiresCreation && /image|picture|graphic/i.test(goal.context)) {
    tools.push({
      name: "image-generation",
      description: "Generate images with AI",
      canHandle: (g) => g.requiresCreation && /image|picture/i.test(g.context),
      execute: async (params) => {
        // Will be implemented with actual image generation
        return { url: "generated-image-url" };
      },
      cost: 3,
      speed: 'slow',
    });
  }
  
  return tools;
}

// ============================================================================
// LAYER 5: EXECUTION
// ============================================================================

/**
 * Execute the plan step by step
 */
export async function executePlan(
  plan: AgentPlan,
  goal: UserGoal
): Promise<{ results: any[]; thinking: string }> {
  const results: any[] = [];
  let thinking = "Let me work through this step by step:\n\n";
  
  for (const step of plan.steps) {
    thinking += `**Step ${step.id}: ${step.action}**\n`;
    thinking += `*Reasoning: ${step.reasoning}*\n\n`;
    
    step.status = 'in-progress';
    
    try {
      if (step.tool === 'web-search') {
        const research = await conductResearch(goal);
        step.result = research;
        results.push(research);
        thinking += `✓ Found ${research.sources.length} sources\n\n`;
      }
      
      step.status = 'completed';
    } catch (error: any) {
      step.status = 'failed';
      step.error = error.message;
      thinking += `✗ Failed: ${error.message}\n\n`;
    }
  }
  
  return { results, thinking };
}

// ============================================================================
// LAYER 6: FEEDBACK
// ============================================================================

/**
 * Generate helpful options and next steps for the user
 */
export function generateOptions(
  goal: UserGoal,
  plan: AgentPlan,
  results: any[]
): AgentOption[] {
  const options: AgentOption[] = [];
  
  // Option 1: View detailed results
  if (results.length > 0) {
    options.push({
      id: "view-details",
      label: "View Detailed Results",
      description: "See all the information I found",
      action: async () => results,
    });
  }
  
  // Option 2: Create visualization (if applicable)
  if (goal.requiresVisualization) {
    options.push({
      id: "create-chart",
      label: "Create a Chart",
      description: "Generate a visual chart from the data (3 credits)",
      action: async () => ({ type: "chart-generation" }),
    });
    
    options.push({
      id: "export-data",
      label: "Export Data",
      description: "Get the data in CSV/JSON format",
      action: async () => ({ type: "data-export" }),
    });
  }
  
  // Option 3: Learn more
  options.push({
    id: "learn-more",
    label: "Learn More",
    description: "Get additional information or context",
    action: async () => ({ type: "deep-dive" }),
  });
  
  // Option 4: Try different approach
  if (plan.alternatives.length > 0) {
    options.push({
      id: "alternative",
      label: "Try Different Approach",
      description: plan.alternatives[0],
      action: async () => ({ type: "alternative" }),
    });
  }
  
  return options;
}

// ============================================================================
// MAIN AUTONOMOUS AGENT ORCHESTRATOR
// ============================================================================

/**
 * Main function that orchestrates the entire autonomous agent flow
 */
export async function runAutonomousAgent(
  userMessage: string,
  conversationHistory: any[]
): Promise<AgentResponse> {
  console.log("[Autonomous Agent] Starting...");
  
  // Layer 1: Understand the goal
  const goal = understandUserGoal(userMessage, conversationHistory);
  console.log("[Autonomous Agent] Goal understood:", goal.primary);
  
  // Layer 2: Create a plan
  const plan = createAgentPlan(goal);
  console.log("[Autonomous Agent] Plan created with", plan.steps.length, "steps");
  
  // Layer 3 & 4: Research and select tools
  const tools = selectBestTools(goal, plan);
  console.log("[Autonomous Agent] Selected", tools.length, "tools");
  
  // Layer 5: Execute the plan
  const { results, thinking } = await executePlan(plan, goal);
  console.log("[Autonomous Agent] Execution complete");
  
  // Layer 6: Generate options
  const options = generateOptions(goal, plan, results);
  
  // Determine if we need user confirmation
  const needsConfirmation = plan.needsUserInput || 
                           tools.some(t => t.cost > 0);
  
  // Build final response
  let result = "";
  if (results.length > 0 && results[0].summary) {
    result = results[0].summary;
  }
  
  return {
    thinking,
    plan: needsConfirmation ? plan : undefined,
    result: result || undefined,
    options,
    needsConfirmation,
    toolsUsed: tools.map(t => t.name),
  };
}
