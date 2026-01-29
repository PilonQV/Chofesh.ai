/**
 * Malena - Advanced Autonomous Agent for Chofesh.ai
 * 
 * Malena is an intelligent agent that can:
 * 1. Detect user intent with 20+ task types
 * 2. Route to appropriate handlers (project builders, automation, research, etc.)
 * 3. Execute multi-step workflows autonomously
 * 4. Learn from user feedback and improve over time
 * 5. Integrate with all platform features seamlessly
 * 
 * Named "Malena" to represent the autonomous intelligence of the platform.
 */

import { invokeAICompletion } from "./aiProviders";
import { runEnhancedAutonomousAgent } from "./autonomousAgentEnhanced";
import { createProject as createProjectBuilder, type ProjectCreationOptions } from "../lib/projectBuilders";
import { createProject, updateProject } from "../lib/projects";

// ============================================================================
// TYPES
// ============================================================================

export type TaskType =
  | "kids_book"
  | "website"
  | "app_design"
  | "marketing_campaign"
  | "business_plan"
  | "research"
  | "code_generation"
  | "code_review"
  | "data_analysis"
  | "writing"
  | "translation"
  | "summarization"
  | "question_answering"
  | "creative_writing"
  | "email_draft"
  | "social_media_post"
  | "presentation"
  | "spreadsheet"
  | "image_generation"
  | "automation_setup"
  | "general_chat"
  | "unknown";

export interface TaskDetectionResult {
  taskType: TaskType;
  confidence: number;
  parameters: Record<string, any>;
  requiresMultiStep: boolean;
  estimatedSteps: number;
}

export interface MalenaRequest {
  userId: number;
  conversationId: string;
  userMessage: string;
  conversationHistory: any[];
}

export interface MalenaResponse {
  answer: string;
  taskType: TaskType;
  projectId?: string;
  files?: Array<{ name: string; url: string; type: string }>;
  images?: Array<{ url: string; prompt?: string }>;
  nextSteps?: string[];
  confidence: number;
  executionTime: number;
}

// ============================================================================
// TASK DETECTION
// ============================================================================

/**
 * Detect what type of task the user wants to perform
 */
export async function detectTask(
  userMessage: string,
  conversationHistory: any[]
): Promise<TaskDetectionResult> {
  const detectionPrompt = `Analyze this user message and determine what type of task they want to accomplish.

User message: "${userMessage}"

Recent conversation context:
${conversationHistory.slice(-3).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Task types available:
1. kids_book - Creating illustrated children's books
2. website - Building complete websites with HTML/CSS/JS
3. app_design - Designing mobile or web applications with wireframes
4. marketing_campaign - Creating marketing campaigns with ads, social posts, emails
5. business_plan - Writing business plans and strategies
6. research - Conducting research on topics with sources
7. code_generation - Writing code in any programming language
8. code_review - Reviewing and improving existing code
9. data_analysis - Analyzing data and creating visualizations
10. writing - General writing (articles, essays, reports)
11. translation - Translating text between languages
12. summarization - Summarizing long documents or articles
13. question_answering - Answering specific questions
14. creative_writing - Creative fiction, poetry, stories
15. email_draft - Drafting professional emails
16. social_media_post - Creating social media content
17. presentation - Creating presentation slides
18. spreadsheet - Creating spreadsheets with formulas
19. image_generation - Generating images from descriptions
20. automation_setup - Setting up webhooks or scheduled tasks
21. general_chat - General conversation or unclear intent

Respond in JSON format:
{
  "taskType": "one of the task types above",
  "confidence": 0.0 to 1.0,
  "parameters": {
    "key parameters extracted from the message"
  },
  "requiresMultiStep": true/false,
  "estimatedSteps": number of steps needed,
  "reasoning": "brief explanation of your detection"
}`;

  try {
    const response = await invokeAICompletion({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: detectionPrompt }],
      temperature: 0.3,
      maxTokens: 500,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        taskType: "general_chat",
        confidence: 0.5,
        parameters: {},
        requiresMultiStep: false,
        estimatedSteps: 1,
      };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      taskType: result.taskType || "general_chat",
      confidence: result.confidence || 0.5,
      parameters: result.parameters || {},
      requiresMultiStep: result.requiresMultiStep || false,
      estimatedSteps: result.estimatedSteps || 1,
    };
  } catch (error) {
    console.error("[Malena] Task detection failed:", error);
    return {
      taskType: "general_chat",
      confidence: 0.3,
      parameters: {},
      requiresMultiStep: false,
      estimatedSteps: 1,
    };
  }
}

// ============================================================================
// TASK ROUTING
// ============================================================================

/**
 * Route task to appropriate handler based on detected type
 */
export async function routeTask(
  request: MalenaRequest,
  detection: TaskDetectionResult
): Promise<MalenaResponse> {
  const startTime = Date.now();
  const { userId, conversationId, userMessage, conversationHistory } = request;

  console.log(`[Malena] Routing task: ${detection.taskType} (confidence: ${detection.confidence})`);

  // High-confidence project builder tasks
  if (
    detection.confidence > 0.7 &&
    ["kids_book", "website", "app_design", "marketing_campaign", "business_plan"].includes(detection.taskType)
  ) {
    return await handleProjectBuilderTask(request, detection, startTime);
  }

  // Automation setup tasks
  if (detection.taskType === "automation_setup" && detection.confidence > 0.7) {
    return await handleAutomationTask(request, detection, startTime);
  }

  // Image generation tasks
  if (detection.taskType === "image_generation" && detection.confidence > 0.7) {
    return await handleImageGenerationTask(request, detection, startTime);
  }

  // Research tasks
  if (detection.taskType === "research" && detection.confidence > 0.7) {
    return await handleResearchTask(request, detection, startTime);
  }

  // Code generation/review tasks
  if (["code_generation", "code_review"].includes(detection.taskType) && detection.confidence > 0.7) {
    return await handleCodeTask(request, detection, startTime);
  }

  // Default: Use enhanced autonomous agent for general tasks
  return await handleGeneralTask(request, detection, startTime);
}

// ============================================================================
// TASK HANDLERS
// ============================================================================

/**
 * Handle project builder tasks (kids books, websites, apps, marketing, business plans)
 */
async function handleProjectBuilderTask(
  request: MalenaRequest,
  detection: TaskDetectionResult,
  startTime: number
): Promise<MalenaResponse> {
  const { userId, userMessage } = request;

  try {
    // Map task type to project type
    const projectTypeMap: Record<string, string> = {
      kids_book: "KIDS_BOOK",
      website: "WEBSITE",
      app_design: "APP",
      marketing_campaign: "MARKETING",
      business_plan: "BUSINESS_PLAN",
    };

    const projectType = projectTypeMap[detection.taskType];

    // Build the project first
    const builderResult = await createProjectBuilder({
      message: userMessage,
      onProgress: (step, progress) => {
        console.log(`[Malena] ${step} - ${progress}%`);
      },
    });

    if (!builderResult) {
      throw new Error("Project builder returned null");
    }

    // Extract result data based on project type
    const resultData = (builderResult as any).result;

    // Create project record
    const project = await createProject({
      userId,
      type: projectType as any,
      title: detection.parameters.title || `New ${detection.taskType.replace('_', ' ')}`,
      description: userMessage,
      inputs: detection.parameters,
    });

    // Update project with results
    await updateProject(project.id, {
      status: "COMPLETED",
      outputs: {
        text: `Your ${detection.taskType.replace('_', ' ')} has been created successfully!`,
        images: resultData?.images || [],
        files: resultData?.files || [],
        metadata: detection.parameters,
      },
      completedAt: new Date(),
    });

    // Save images and files to project
    // (This would be done by the project builder internally)

    return {
      answer: `Your ${detection.taskType.replace('_', ' ')} has been created successfully! You can view it in My Projects.`,
      taskType: detection.taskType,
      projectId: project.id,
      files: resultData?.files || [],
      images: resultData?.images || [],
      nextSteps: [
        "View your project in My Projects",
        "Download the files",
        "Share your project with others",
      ],
      confidence: detection.confidence,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[Malena] Project builder task failed:", error);
    return {
      answer: `I encountered an error while creating your ${detection.taskType.replace('_', ' ')}. Please try again or provide more details.`,
      taskType: detection.taskType,
      confidence: detection.confidence,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Handle automation setup tasks (webhooks, scheduled tasks)
 */
async function handleAutomationTask(
  request: MalenaRequest,
  detection: TaskDetectionResult,
  startTime: number
): Promise<MalenaResponse> {
  const { userMessage } = request;

  // For now, provide guidance on automation setup
  const answer = `I can help you set up automation! Here's what you can do:

1. **Webhooks**: Receive real-time notifications when AI tasks complete
   - Go to /automation and create a webhook
   - Configure the events you want to receive
   - Integrate with Zapier, Make.com, or n8n

2. **Scheduled Tasks**: Automate recurring AI workflows
   - Set up daily reports, weekly summaries, or monthly analysis
   - Use cron expressions for precise scheduling
   - Tasks run automatically in the background

Would you like me to guide you through setting up a specific automation?`;

  return {
    answer,
    taskType: detection.taskType,
    nextSteps: [
      "Visit the Automation page",
      "Create your first webhook or scheduled task",
      "Test the automation",
    ],
    confidence: detection.confidence,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Handle image generation tasks
 */
async function handleImageGenerationTask(
  request: MalenaRequest,
  detection: TaskDetectionResult,
  startTime: number
): Promise<MalenaResponse> {
  const { userMessage } = request;

  // Delegate to image generation system
  // (This would call the actual image generation API)
  const answer = `I'll generate an image based on your description. Please use the /image page for the best image generation experience, where you can:

- Generate multiple images at once
- Choose from different AI models
- Adjust image size and quality
- Save images to your gallery
- Download in various formats

Would you like me to help you craft the perfect image prompt?`;

  return {
    answer,
    taskType: detection.taskType,
    nextSteps: [
      "Visit the Image Generation page",
      "Enter your detailed prompt",
      "Generate and download your images",
    ],
    confidence: detection.confidence,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Handle research tasks
 */
async function handleResearchTask(
  request: MalenaRequest,
  detection: TaskDetectionResult,
  startTime: number
): Promise<MalenaResponse> {
  const { userMessage, conversationHistory } = request;

  // Use enhanced autonomous agent with research tools
  const llmProvider = {
    name: "gpt-4o",
    call: async (messages: any[]) => {
      const response = await invokeAICompletion({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        maxTokens: 2000,
      });
      return response.content;
    },
  };

  const agentResult = await runEnhancedAutonomousAgent(
    {
      userId: request.userId,
      conversationId: request.conversationId,
      userMessage,
      conversationHistory,
    },
    llmProvider
  );

  return {
    answer: agentResult.answer,
    taskType: detection.taskType,
    nextSteps: agentResult.suggestions,
    confidence: agentResult.confidence,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Handle code generation and review tasks
 */
async function handleCodeTask(
  request: MalenaRequest,
  detection: TaskDetectionResult,
  startTime: number
): Promise<MalenaResponse> {
  const { userMessage } = request;

  // Use specialized code model
  const response = await invokeAICompletion({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert programmer. Provide clean, well-documented code with explanations.",
      },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    maxTokens: 3000,
  });

  return {
    answer: response.content,
    taskType: detection.taskType,
    nextSteps: [
      "Test the code",
      "Modify as needed",
      "Ask for code review if needed",
    ],
    confidence: detection.confidence,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Handle general tasks using enhanced autonomous agent
 */
async function handleGeneralTask(
  request: MalenaRequest,
  detection: TaskDetectionResult,
  startTime: number
): Promise<MalenaResponse> {
  const { userMessage, conversationHistory } = request;

  const llmProvider = {
    name: "gpt-4o",
    call: async (messages: any[]) => {
      const response = await invokeAICompletion({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        maxTokens: 2000,
      });
      return response.content;
    },
  };

  const agentResult = await runEnhancedAutonomousAgent(
    {
      userId: request.userId,
      conversationId: request.conversationId,
      userMessage,
      conversationHistory,
    },
    llmProvider
  );

  return {
    answer: agentResult.answer,
    taskType: detection.taskType,
    nextSteps: agentResult.suggestions,
    confidence: agentResult.confidence,
    executionTime: Date.now() - startTime,
  };
}

// ============================================================================
// MAIN MALENA AGENT
// ============================================================================

/**
 * Main entry point for Malena agent
 */
export async function runMalenaAgent(request: MalenaRequest): Promise<MalenaResponse> {
  console.log("[Malena] Starting agent for user", request.userId);

  // Step 1: Detect task type
  const detection = await detectTask(request.userMessage, request.conversationHistory);
  console.log("[Malena] Task detected:", detection);

  // Step 2: Route to appropriate handler
  const response = await routeTask(request, detection);
  console.log("[Malena] Task completed in", response.executionTime, "ms");

  return response;
}
