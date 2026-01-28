/**
 * Task Planner - Breaks down complex requests into executable steps
 * 
 * This module analyzes user requests and creates detailed execution plans
 * for the autonomous agent system.
 */

import { invokeLLM } from '../llm';

// ============================================================================
// TYPES
// ============================================================================

export interface TaskStep {
  id: number;
  description: string;
  tool: string;
  inputs: Record<string, any>;
  dependencies: number[]; // IDs of steps that must complete first
  estimatedTime: number; // seconds
  priority: 'high' | 'medium' | 'low';
}

export interface TaskPlan {
  goal: string;
  category: 'website' | 'crm' | 'campaign' | 'document' | 'general';
  steps: TaskStep[];
  estimatedTotalTime: number;
  complexity: 'simple' | 'moderate' | 'complex';
  deliverables: string[];
}

export interface PlanningRequest {
  userRequest: string;
  conversationHistory?: any[];
  userPreferences?: Record<string, any>;
}

// ============================================================================
// TASK PLANNER
// ============================================================================

/**
 * Analyzes a user request and creates a detailed execution plan
 */
export async function createTaskPlan(request: PlanningRequest): Promise<TaskPlan> {
  console.log('[TaskPlanner] Creating plan for:', request.userRequest);
  
  // Analyze the request to determine category
  const category = await categorizeRequest(request.userRequest);
  console.log('[TaskPlanner] Category:', category);
  
  // Generate detailed plan based on category
  const plan = await generatePlan(request, category);
  
  console.log('[TaskPlanner] Plan created with', plan.steps.length, 'steps');
  return plan;
}

/**
 * Categorize the user request
 */
async function categorizeRequest(userRequest: string): Promise<TaskPlan['category']> {
  const lowerRequest = userRequest.toLowerCase();
  
  // Website keywords
  if (lowerRequest.match(/website|landing page|web app|site|homepage|portfolio/)) {
    return 'website';
  }
  
  // CRM keywords
  if (lowerRequest.match(/crm|customer management|sales pipeline|contact management/)) {
    return 'crm';
  }
  
  // Campaign keywords
  if (lowerRequest.match(/campaign|marketing|social media|advertising|promotion/)) {
    return 'campaign';
  }
  
  // Document keywords
  if (lowerRequest.match(/document|report|presentation|proposal|business plan/)) {
    return 'document';
  }
  
  return 'general';
}

/**
 * Generate a detailed execution plan
 */
async function generatePlan(
  request: PlanningRequest,
  category: TaskPlan['category']
): Promise<TaskPlan> {
  // Use LLM to create detailed plan
  const prompt = `You are an expert project planner. Create a detailed execution plan for the following request:

User Request: "${request.userRequest}"
Category: ${category}

Generate a JSON plan with the following structure:
{
  "goal": "Clear statement of what will be delivered",
  "complexity": "simple|moderate|complex",
  "deliverables": ["List of final outputs"],
  "steps": [
    {
      "id": 1,
      "description": "What to do",
      "tool": "code_generation|image_generation|web_search|file_operation|deployment",
      "inputs": {"key": "value"},
      "dependencies": [],
      "estimatedTime": 60,
      "priority": "high|medium|low"
    }
  ]
}

Guidelines:
- Break down into 5-15 steps
- Each step should be atomic and executable
- Include all necessary steps (research, design, implementation, testing, packaging)
- Estimate realistic time for each step
- Identify dependencies between steps
- For websites: include design, coding, assets, testing, deployment
- For CRMs: include schema design, backend, frontend, auth, testing
- For campaigns: include research, strategy, creative, content, distribution
- For documents: include research, outline, writing, formatting, review

Return ONLY the JSON, no explanation.`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a project planning expert. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
    });
    
    const response = result.choices[0].message.content as string;
    
    // Parse the LLM response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM did not return valid JSON');
    }
    
    const planData = JSON.parse(jsonMatch[0]);
    
    // Calculate total estimated time
    const estimatedTotalTime = planData.steps.reduce(
      (sum: number, step: TaskStep) => sum + step.estimatedTime,
      0
    );
    
    return {
      goal: planData.goal,
      category,
      steps: planData.steps,
      estimatedTotalTime,
      complexity: planData.complexity,
      deliverables: planData.deliverables,
    };
  } catch (error) {
    console.error('[TaskPlanner] Failed to generate plan:', error);
    
    // Fallback to template-based planning
    return generateTemplatePlan(request.userRequest, category);
  }
}

/**
 * Generate a template-based plan as fallback
 */
function generateTemplatePlan(userRequest: string, category: TaskPlan['category']): TaskPlan {
  switch (category) {
    case 'website':
      return {
        goal: `Build a complete website based on: ${userRequest}`,
        category: 'website',
        complexity: 'moderate',
        deliverables: ['HTML/CSS/JS files', 'Images and assets', 'Deployment guide'],
        estimatedTotalTime: 600, // 10 minutes
        steps: [
          {
            id: 1,
            description: 'Research and gather requirements',
            tool: 'web_search',
            inputs: { query: userRequest },
            dependencies: [],
            estimatedTime: 60,
            priority: 'high',
          },
          {
            id: 2,
            description: 'Design website layout and structure',
            tool: 'code_generation',
            inputs: { task: 'design wireframe' },
            dependencies: [1],
            estimatedTime: 90,
            priority: 'high',
          },
          {
            id: 3,
            description: 'Generate hero image',
            tool: 'image_generation',
            inputs: { prompt: 'hero image for ' + userRequest },
            dependencies: [2],
            estimatedTime: 30,
            priority: 'medium',
          },
          {
            id: 4,
            description: 'Write HTML structure',
            tool: 'code_generation',
            inputs: { task: 'create HTML' },
            dependencies: [2],
            estimatedTime: 120,
            priority: 'high',
          },
          {
            id: 5,
            description: 'Write CSS styles',
            tool: 'code_generation',
            inputs: { task: 'create CSS' },
            dependencies: [4],
            estimatedTime: 120,
            priority: 'high',
          },
          {
            id: 6,
            description: 'Add JavaScript interactivity',
            tool: 'code_generation',
            inputs: { task: 'create JavaScript' },
            dependencies: [5],
            estimatedTime: 90,
            priority: 'medium',
          },
          {
            id: 7,
            description: 'Test responsiveness',
            tool: 'code_execution',
            inputs: { code: 'test responsive design' },
            dependencies: [6],
            estimatedTime: 60,
            priority: 'high',
          },
          {
            id: 8,
            description: 'Package files for deployment',
            tool: 'file_operation',
            inputs: { action: 'zip' },
            dependencies: [7],
            estimatedTime: 30,
            priority: 'high',
          },
        ],
      };
    
    case 'crm':
      return {
        goal: `Build a complete CRM system based on: ${userRequest}`,
        category: 'crm',
        complexity: 'complex',
        deliverables: ['Database schema', 'Backend API', 'Admin dashboard', 'Setup guide'],
        estimatedTotalTime: 1200, // 20 minutes
        steps: [
          {
            id: 1,
            description: 'Define CRM requirements and features',
            tool: 'web_search',
            inputs: { query: 'CRM features for ' + userRequest },
            dependencies: [],
            estimatedTime: 90,
            priority: 'high',
          },
          {
            id: 2,
            description: 'Design database schema',
            tool: 'code_generation',
            inputs: { task: 'create database schema' },
            dependencies: [1],
            estimatedTime: 150,
            priority: 'high',
          },
          {
            id: 3,
            description: 'Generate backend API',
            tool: 'code_generation',
            inputs: { task: 'create Express.js API' },
            dependencies: [2],
            estimatedTime: 300,
            priority: 'high',
          },
          {
            id: 4,
            description: 'Create admin dashboard UI',
            tool: 'code_generation',
            inputs: { task: 'create React dashboard' },
            dependencies: [3],
            estimatedTime: 400,
            priority: 'high',
          },
          {
            id: 5,
            description: 'Add authentication system',
            tool: 'code_generation',
            inputs: { task: 'implement JWT auth' },
            dependencies: [3],
            estimatedTime: 150,
            priority: 'high',
          },
          {
            id: 6,
            description: 'Test all CRUD operations',
            tool: 'code_execution',
            inputs: { code: 'test API endpoints' },
            dependencies: [4, 5],
            estimatedTime: 90,
            priority: 'high',
          },
          {
            id: 7,
            description: 'Package and document',
            tool: 'file_operation',
            inputs: { action: 'package_project' },
            dependencies: [6],
            estimatedTime: 60,
            priority: 'high',
          },
        ],
      };
    
    case 'campaign':
      return {
        goal: `Create a complete marketing campaign for: ${userRequest}`,
        category: 'campaign',
        complexity: 'moderate',
        deliverables: ['Campaign strategy', 'Creative assets', 'Content calendar', 'Performance tracking'],
        estimatedTotalTime: 900, // 15 minutes
        steps: [
          {
            id: 1,
            description: 'Research target market and competitors',
            tool: 'web_search',
            inputs: { query: 'market research for ' + userRequest },
            dependencies: [],
            estimatedTime: 120,
            priority: 'high',
          },
          {
            id: 2,
            description: 'Develop campaign strategy',
            tool: 'code_generation',
            inputs: { task: 'create campaign strategy document' },
            dependencies: [1],
            estimatedTime: 180,
            priority: 'high',
          },
          {
            id: 3,
            description: 'Generate campaign visuals',
            tool: 'image_generation',
            inputs: { prompt: 'marketing visuals for ' + userRequest },
            dependencies: [2],
            estimatedTime: 120,
            priority: 'high',
          },
          {
            id: 4,
            description: 'Write campaign copy',
            tool: 'code_generation',
            inputs: { task: 'write marketing copy' },
            dependencies: [2],
            estimatedTime: 150,
            priority: 'high',
          },
          {
            id: 5,
            description: 'Create content calendar',
            tool: 'code_generation',
            inputs: { task: 'create content calendar' },
            dependencies: [3, 4],
            estimatedTime: 120,
            priority: 'medium',
          },
          {
            id: 6,
            description: 'Set up performance tracking',
            tool: 'code_generation',
            inputs: { task: 'create analytics dashboard' },
            dependencies: [5],
            estimatedTime: 150,
            priority: 'medium',
          },
          {
            id: 7,
            description: 'Package campaign materials',
            tool: 'file_operation',
            inputs: { action: 'package_campaign' },
            dependencies: [6],
            estimatedTime: 60,
            priority: 'high',
          },
        ],
      };
    
    default:
      return {
        goal: `Complete the task: ${userRequest}`,
        category: 'general',
        complexity: 'simple',
        deliverables: ['Task result'],
        estimatedTotalTime: 180, // 3 minutes
        steps: [
          {
            id: 1,
            description: 'Analyze and execute task',
            tool: 'code_generation',
            inputs: { task: userRequest },
            dependencies: [],
            estimatedTime: 180,
            priority: 'high',
          },
        ],
      };
  }
}

/**
 * Validate a task plan
 */
export function validatePlan(plan: TaskPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for empty steps
  if (plan.steps.length === 0) {
    errors.push('Plan has no steps');
  }
  
  // Check for circular dependencies
  const visited = new Set<number>();
  const recursionStack = new Set<number>();
  
  function hasCycle(stepId: number): boolean {
    if (recursionStack.has(stepId)) return true;
    if (visited.has(stepId)) return false;
    
    visited.add(stepId);
    recursionStack.add(stepId);
    
    const step = plan.steps.find(s => s.id === stepId);
    if (step) {
      for (const depId of step.dependencies) {
        if (hasCycle(depId)) return true;
      }
    }
    
    recursionStack.delete(stepId);
    return false;
  }
  
  for (const step of plan.steps) {
    if (hasCycle(step.id)) {
      errors.push(`Circular dependency detected for step ${step.id}`);
      break;
    }
  }
  
  // Check for invalid dependencies
  const stepIds = new Set(plan.steps.map(s => s.id));
  for (const step of plan.steps) {
    for (const depId of step.dependencies) {
      if (!stepIds.has(depId)) {
        errors.push(`Step ${step.id} depends on non-existent step ${depId}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
