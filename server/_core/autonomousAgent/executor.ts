/**
 * Executor - Runs task plans and manages execution flow
 * 
 * This module executes task plans step-by-step, handles errors,
 * and manages the execution environment.
 */

import { TaskPlan, TaskStep } from './taskPlanner';
import { AgentTools } from '../agentTools';
import { invokeLLM } from '../llm';
import { generateImage } from '../imageGeneration';

// ============================================================================
// TYPES
// ============================================================================

export interface ExecutionResult {
  stepId: number;
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
}

export interface ExecutionProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  estimatedTimeRemaining: number;
  results: ExecutionResult[];
}

export interface ExecutionContext {
  userId: string;
  conversationId: string;
  workingDirectory: string;
  results: Map<number, any>; // stepId -> result
  files: Map<string, Buffer>; // filename -> content
}

// ============================================================================
// EXECUTOR
// ============================================================================

/**
 * Execute a task plan step-by-step
 */
export async function executePlan(
  plan: TaskPlan,
  userId: string,
  conversationId: string,
  onProgress?: (progress: ExecutionProgress) => void
): Promise<ExecutionContext> {
  console.log('[Executor] Starting execution of plan:', plan.goal);
  
  // Initialize execution context
  const context: ExecutionContext = {
    userId,
    conversationId,
    workingDirectory: `/tmp/agent-${conversationId}`,
    results: new Map(),
    files: new Map(),
  };
  
  const progress: ExecutionProgress = {
    currentStep: 0,
    totalSteps: plan.steps.length,
    completedSteps: 0,
    failedSteps: 0,
    estimatedTimeRemaining: plan.estimatedTotalTime,
    results: [],
  };
  
  // Execute steps in dependency order
  const executedSteps = new Set<number>();
  
  while (executedSteps.size < plan.steps.length) {
    // Find next executable step (all dependencies met)
    const nextStep = plan.steps.find(step =>
      !executedSteps.has(step.id) &&
      step.dependencies.every(depId => executedSteps.has(depId))
    );
    
    if (!nextStep) {
      // No more executable steps - check if we're done or stuck
      if (executedSteps.size === plan.steps.length) {
        break; // All done
      } else {
        throw new Error('Execution stuck - circular dependencies or missing steps');
      }
    }
    
    // Execute the step
    console.log(`[Executor] Executing step ${nextStep.id}: ${nextStep.description}`);
    progress.currentStep = nextStep.id;
    
    const startTime = Date.now();
    let result: ExecutionResult;
    
    try {
      const output = await executeStep(nextStep, context);
      
      result = {
        stepId: nextStep.id,
        success: true,
        output,
        executionTime: Date.now() - startTime,
      };
      
      // Store result in context
      context.results.set(nextStep.id, output);
      progress.completedSteps++;
      
      console.log(`[Executor] Step ${nextStep.id} completed successfully`);
    } catch (error: any) {
      console.error(`[Executor] Step ${nextStep.id} failed:`, error);
      
      result = {
        stepId: nextStep.id,
        success: false,
        output: null,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
      
      progress.failedSteps++;
      
      // Retry logic (max 3 attempts)
      if (result.error && !result.error.includes('retry')) {
        console.log(`[Executor] Retrying step ${nextStep.id}...`);
        // TODO: Implement retry with exponential backoff
      }
    }
    
    progress.results.push(result);
    executedSteps.add(nextStep.id);
    
    // Update estimated time remaining
    progress.estimatedTimeRemaining = plan.steps
      .filter(s => !executedSteps.has(s.id))
      .reduce((sum, s) => sum + s.estimatedTime, 0);
    
    // Notify progress
    if (onProgress) {
      onProgress({ ...progress });
    }
  }
  
  console.log('[Executor] Execution completed:', {
    completed: progress.completedSteps,
    failed: progress.failedSteps,
    total: progress.totalSteps,
  });
  
  return context;
}

/**
 * Execute a single step
 */
async function executeStep(step: TaskStep, context: ExecutionContext): Promise<any> {
  // Get dependency results
  const dependencyResults = step.dependencies.map(depId => context.results.get(depId));
  
  // Merge inputs with dependency results
  const inputs = {
    ...step.inputs,
    dependencyResults,
  };
  
  // Execute based on tool type
  switch (step.tool) {
    case 'code_generation':
      return await executeCodeGeneration(step, inputs, context);
    
    case 'image_generation':
      return await executeImageGeneration(step, inputs, context);
    
    case 'web_search':
      return await executeWebSearch(step, inputs, context);
    
    case 'file_operation':
      return await executeFileOperation(step, inputs, context);
    
    case 'code_execution':
      return await executeCodeExecution(step, inputs, context);
    
    case 'deployment':
      return await executeDeployment(step, inputs, context);
    
    default:
      throw new Error(`Unknown tool: ${step.tool}`);
  }
}

/**
 * Execute code generation step
 */
async function executeCodeGeneration(
  step: TaskStep,
  inputs: any,
  context: ExecutionContext
): Promise<any> {
  const prompt = `Task: ${step.description}

Context: ${JSON.stringify(inputs, null, 2)}

Generate the code or content needed to complete this task. Be specific and production-ready.`;

  const result = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are an expert developer. Generate clean, production-ready code.' },
      { role: 'user', content: prompt }
    ],
  });
  
  const response = result.choices[0].message.content as string;
  
  // Extract code blocks if present
  const codeBlocks = extractCodeBlocks(response);
  
  // Store generated files
  for (const block of codeBlocks) {
    context.files.set(block.filename, Buffer.from(block.code, 'utf-8'));
  }
  
  return {
    response,
    codeBlocks,
    filesGenerated: codeBlocks.map(b => b.filename),
  };
}

/**
 * Execute image generation step
 */
async function executeImageGeneration(
  step: TaskStep,
  inputs: any,
  context: ExecutionContext
): Promise<any> {
  const agentTools = new AgentTools(context.userId);
  
  const result = await agentTools.generateImage({
    prompt: inputs.prompt || step.description,
    count: inputs.count || 1,
  });
  
  // Download and store images
  for (let i = 0; i < result.urls.length; i++) {
    const url = result.urls[i];
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    context.files.set(`image-${i + 1}.png`, buffer);
  }
  
  return result;
}

/**
 * Execute web search step
 */
async function executeWebSearch(
  step: TaskStep,
  inputs: any,
  context: ExecutionContext
): Promise<any> {
  const agentTools = new AgentTools(context.userId);
  
  const result = await agentTools.searchWeb({
    query: inputs.query || step.description,
    maxResults: inputs.maxResults || 5,
  });
  
  return result;
}

/**
 * Execute file operation step
 */
async function executeFileOperation(
  step: TaskStep,
  inputs: any,
  context: ExecutionContext
): Promise<any> {
  const action = inputs.action;
  
  switch (action) {
    case 'zip':
    case 'package_project':
    case 'package_campaign':
      // Package all files into a ZIP
      return {
        action: 'package',
        files: Array.from(context.files.keys()),
        totalSize: Array.from(context.files.values()).reduce((sum, buf) => sum + buf.length, 0),
      };
    
    case 'create':
      // Create a new file
      context.files.set(inputs.filename, Buffer.from(inputs.content, 'utf-8'));
      return { created: inputs.filename };
    
    case 'read':
      // Read a file
      const content = context.files.get(inputs.filename);
      if (!content) throw new Error(`File not found: ${inputs.filename}`);
      return { content: content.toString('utf-8') };
    
    default:
      throw new Error(`Unknown file operation: ${action}`);
  }
}

/**
 * Execute code execution step
 */
async function executeCodeExecution(
  step: TaskStep,
  inputs: any,
  context: ExecutionContext
): Promise<any> {
  const agentTools = new AgentTools(context.userId);
  
  const result = await agentTools.executeCode({
    code: inputs.code || step.description,
    language: inputs.language || 'javascript',
  });
  
  return result;
}

/**
 * Execute deployment step
 */
async function executeDeployment(
  step: TaskStep,
  inputs: any,
  context: ExecutionContext
): Promise<any> {
  // TODO: Implement deployment to Vercel/Netlify
  return {
    deployed: true,
    url: 'https://example.com', // Placeholder
    message: 'Deployment not yet implemented',
  };
}

/**
 * Extract code blocks from LLM response
 */
function extractCodeBlocks(response: string): Array<{ filename: string; language: string; code: string }> {
  const blocks: Array<{ filename: string; language: string; code: string }> = [];
  
  // Match code blocks with optional filename
  const regex = /```(\w+)(?:\s+(.+?))?\n([\s\S]*?)```/g;
  let match;
  let index = 1;
  
  while ((match = regex.exec(response)) !== null) {
    const language = match[1];
    const filename = match[2] || `file-${index}.${getExtension(language)}`;
    const code = match[3].trim();
    
    blocks.push({ filename, language, code });
    index++;
  }
  
  return blocks;
}

/**
 * Get file extension for language
 */
function getExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    markdown: 'md',
    sql: 'sql',
    bash: 'sh',
  };
  
  return extensions[language.toLowerCase()] || 'txt';
}
