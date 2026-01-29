/**
 * Task Execution Engine
 * 
 * Executes scheduled tasks and manages task lifecycle
 */

import { getDueTasks, markTaskExecuted, createTaskExecution, updateTaskExecution } from "./scheduledTasks";
import { triggerWebhooksForEvent, WEBHOOK_EVENTS } from "./webhooks";
import { invokeAICompletion } from "../_core/aiProviders";
import { createProject } from "./projectBuilders";
import type { TaskType } from "../../drizzle/schema";

/**
 * Execute a single task
 */
export async function executeTask(task: any) {
  console.log(`[Task Executor] Executing task: ${task.name} (${task.id})`);
  
  // Create execution record
  let executionId: string;
  try {
    const result = await createTaskExecution({
      taskId: task.id,
      triggeredBy: "scheduler",
    });
    
    // MySQL insert result has insertId
    const mysqlResult = result as any;
    if (!mysqlResult || typeof mysqlResult.insertId !== 'number') {
      console.error(`[Task Executor] Failed to create execution record for task ${task.id}`);
      return;
    }
    
    executionId = mysqlResult.insertId.toString();
  } catch (error: any) {
    console.error(`[Task Executor] Error creating execution record for task ${task.id}:`, error.message);
    return;
  }
  
  // Update status to running
  await updateTaskExecution({
    executionId,
    status: "running",
  });
  
  // Trigger webhook event
  await triggerWebhooksForEvent(WEBHOOK_EVENTS.TASK_STARTED, {
    taskId: task.id,
    taskName: task.name,
    executionId,
    startedAt: new Date().toISOString(),
  });
  
  try {
    // Execute task based on type
    const result = await executeTaskByType(task);
    
    // Mark as completed
    await updateTaskExecution({
      executionId,
      status: "completed",
      result,
    });
    
    await markTaskExecuted(task.id, "success");
    
    // Trigger webhook event
    await triggerWebhooksForEvent(WEBHOOK_EVENTS.TASK_COMPLETED, {
      taskId: task.id,
      taskName: task.name,
      executionId,
      result,
      completedAt: new Date().toISOString(),
    });
    
    console.log(`[Task Executor] ✓ Task completed: ${task.name}`);
    
    // Send notification if enabled
    if (task.notifyOnComplete) {
      // TODO: Send email/webhook notification
    }
  } catch (error: any) {
    console.error(`[Task Executor] ✗ Task failed: ${task.name}`, error);
    
    // Mark as failed
    await updateTaskExecution({
      executionId,
      status: "failed",
      errorMessage: error.message,
      errorStack: error.stack,
    });
    
    await markTaskExecuted(task.id, "error");
    
    // Trigger webhook event
    await triggerWebhooksForEvent(WEBHOOK_EVENTS.TASK_FAILED, {
      taskId: task.id,
      taskName: task.name,
      executionId,
      error: error.message,
      failedAt: new Date().toISOString(),
    });
    
    // Send notification if enabled
    if (task.notifyOnError) {
      // TODO: Send email/webhook notification
    }
  }
}

/**
 * Execute task based on its type
 */
async function executeTaskByType(task: any): Promise<any> {
  const taskType = task.taskType as TaskType;
  const config = task.taskConfig;
  
  switch (taskType) {
    case "chat_completion":
      return await executeChatCompletion(config);
    
    case "project_builder":
      return await executeProjectBuilder(config);
    
    case "data_analysis":
      return await executeDataAnalysis(config);
    
    case "document_summary":
      return await executeDocumentSummary(config);
    
    case "web_scraping":
      return await executeWebScraping(config);
    
    case "custom_script":
      return await executeCustomScript(config);
    
    default:
      throw new Error(`Unknown task type: ${taskType}`);
  }
}

/**
 * Execute chat completion task
 */
async function executeChatCompletion(config: any) {
  const { prompt, model = "gpt-4o-mini" } = config;
  
  if (!prompt) {
    throw new Error("Prompt is required for chat completion");
  }
  
  const response = await invokeAICompletion({
    messages: [{ role: "user", content: prompt }],
    model,
  });
  
  return {
    type: "chat_completion",
    model,
    prompt,
    response: response.content,
    usage: response.usage,
  };
}

/**
 * Execute project builder task
 */
async function executeProjectBuilder(config: any) {
  const { message, projectType } = config;
  
  if (!message) {
    throw new Error("Message is required for project builder");
  }
  
  const result = await createProject({
    message,
    onProgress: (step, progress) => {
      console.log(`[Task Executor] Project progress: ${progress}% - ${step}`);
    },
  });
  
  if (!result) {
    throw new Error("Failed to create project");
  }
  
  return {
    type: "project_builder",
    projectType: result.type,
    result: result.result,
  };
}

/**
 * Execute data analysis task
 */
async function executeDataAnalysis(config: any) {
  const { data, analysisType = "summary" } = config;
  
  if (!data) {
    throw new Error("Data is required for data analysis");
  }
  
  const prompt = `Analyze the following data and provide a ${analysisType}:\n\n${JSON.stringify(data, null, 2)}`;
  
  const response = await invokeAICompletion({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o",
  });
  
  return {
    type: "data_analysis",
    analysisType,
    data,
    analysis: response.content,
  };
}

/**
 * Execute document summary task
 */
async function executeDocumentSummary(config: any) {
  const { documentText, summaryLength = "medium" } = config;
  
  if (!documentText) {
    throw new Error("Document text is required for summary");
  }
  
  const lengthInstructions = {
    short: "in 2-3 sentences",
    medium: "in 1-2 paragraphs",
    long: "in detail with key points",
  };
  
  const prompt = `Summarize the following document ${lengthInstructions[summaryLength as keyof typeof lengthInstructions] || ""}:\n\n${documentText}`;
  
  const response = await invokeAICompletion({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o-mini",
  });
  
  return {
    type: "document_summary",
    summaryLength,
    summary: response.content,
  };
}

/**
 * Execute web scraping task
 */
async function executeWebScraping(config: any) {
  const { url, selector } = config;
  
  if (!url) {
    throw new Error("URL is required for web scraping");
  }
  
  // TODO: Implement web scraping with puppeteer or similar
  throw new Error("Web scraping not yet implemented");
}

/**
 * Execute custom script task
 */
async function executeCustomScript(config: any) {
  const { script } = config;
  
  if (!script) {
    throw new Error("Script is required for custom script execution");
  }
  
  // TODO: Implement safe script execution in sandboxed environment
  throw new Error("Custom script execution not yet implemented");
}

/**
 * Process due tasks
 * This should be called periodically (e.g., every minute)
 */
export async function processDueTasks() {
  const dueTasks = await getDueTasks();
  
  if (dueTasks.length === 0) {
    return;
  }
  
  console.log(`[Task Executor] Processing ${dueTasks.length} due tasks`);
  
  // Execute tasks in parallel (with concurrency limit)
  const CONCURRENCY = 5;
  for (let i = 0; i < dueTasks.length; i += CONCURRENCY) {
    const batch = dueTasks.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(task => executeTask(task).catch(error => {
        console.error(`[Task Executor] Error executing task ${task.id}:`, error);
      }))
    );
  }
}

/**
 * Start task execution worker
 * Processes due tasks every minute
 */
export function startTaskExecutionWorker() {
  console.log("[Task Executor] Starting task execution worker");
  
  // Process immediately on start
  processDueTasks().catch(error => {
    console.error("[Task Executor] Error processing tasks:", error);
  });
  
  // Then process every minute
  const interval = setInterval(() => {
    processDueTasks().catch(error => {
      console.error("[Task Executor] Error processing tasks:", error);
    });
  }, 60 * 1000); // Every minute
  
  // Return cleanup function
  return () => {
    console.log("[Task Executor] Stopping task execution worker");
    clearInterval(interval);
  };
}
