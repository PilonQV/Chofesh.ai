/**
 * App Designer
 * 
 * Generates complete app designs from concepts:
 * - User flows and journey maps
 * - Wireframes for key screens
 * - Feature specifications
 * - Tech stack recommendations
 * - Database schema
 * - Complete spec document
 */

import { invokeAICompletion } from '../../_core/aiProviders';
import { generateImage } from '../../_core/imageGeneration';

export interface AppConfig {
  concept: string;
  platform?: 'ios' | 'android' | 'web' | 'mobile';
  category?: string;
  targetAudience?: string;
}

export interface AppResult {
  appName: string;
  tagline: string;
  concept: {
    problem: string;
    solution: string;
    valueProposition: string;
  };
  features: Array<{
    name: string;
    description: string;
    priority: 'must-have' | 'should-have' | 'nice-to-have';
  }>;
  userFlows: Array<{
    name: string;
    steps: string[];
    description: string;
  }>;
  screens: Array<{
    name: string;
    description: string;
    wireframeUrl?: string;
  }>;
  techStack: {
    frontend: string[];
    backend: string[];
    database: string;
    hosting: string;
    reasoning: string;
  };
  database: {
    tables: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: string;
        required: boolean;
      }>;
    }>;
  };
  timeline: {
    mvp: string;
    fullLaunch: string;
    phases: Array<{
      phase: string;
      duration: string;
      deliverables: string[];
    }>;
  };
}

/**
 * Create a complete app design
 */
export async function createAppDesign(
  config: AppConfig,
  onProgress?: (step: string, progress: number) => void
): Promise<AppResult> {
  
  onProgress?.('Analyzing app concept...', 10);
  
  // Step 1: Validate and expand concept
  const concept = await analyzeAppConcept(config);
  
  onProgress?.('Defining features...', 25);
  
  // Step 2: Generate feature list
  const features = await generateFeatures(concept, config);
  
  onProgress?.('Mapping user flows...', 40);
  
  // Step 3: Generate user flows
  const userFlows = await generateUserFlows(concept, features, config);
  
  onProgress?.('Designing screens...', 55);
  
  // Step 4: Generate screen descriptions
  const screens = await generateScreens(userFlows, features, config);
  
  onProgress?.('Creating wireframes...', 70);
  
  // Step 5: Generate wireframe images
  const wireframedScreens = await generateWireframes(screens, config, (wireframeProgress) => {
    onProgress?.(`Creating wireframes... (${wireframeProgress}/${Math.min(screens.length, 6)})`, 70 + (wireframeProgress / Math.min(screens.length, 6)) * 15);
  });
  
  onProgress?.('Recommending tech stack...', 85);
  
  // Step 6: Recommend tech stack
  const techStack = await recommendTechStack(concept, features, config);
  
  onProgress?.('Designing database...', 92);
  
  // Step 7: Design database schema
  const database = await designDatabase(features, config);
  
  onProgress?.('Creating timeline...', 96);
  
  // Step 8: Generate development timeline
  const timeline = await generateTimeline(features, config);
  
  onProgress?.('Complete!', 100);
  
  return {
    appName: concept.appName,
    tagline: concept.tagline,
    concept: {
      problem: concept.problem,
      solution: concept.solution,
      valueProposition: concept.valueProposition
    },
    features,
    userFlows,
    screens: wireframedScreens,
    techStack,
    database,
    timeline
  };
}

/**
 * Analyze and expand app concept
 */
async function analyzeAppConcept(config: AppConfig) {
  const prompt = `Analyze this app concept and provide a comprehensive overview:

Concept: ${config.concept}
Platform: ${config.platform || 'mobile'}
Target Audience: ${config.targetAudience || 'general users'}

Provide:
1. App name (catchy, memorable)
2. Tagline (one sentence value proposition)
3. Problem statement (what problem does it solve?)
4. Solution description (how does it solve it?)
5. Value proposition (why would users choose this?)

Format as JSON:
{
  "appName": "App Name",
  "tagline": "Compelling tagline",
  "problem": "Problem statement",
  "solution": "Solution description",
  "valueProposition": "Unique value proposition"
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to analyze app concept');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate feature list
 */
async function generateFeatures(concept: any, config: AppConfig) {
  const prompt = `Generate a comprehensive feature list for this app:

App: ${concept.appName}
Problem: ${concept.problem}
Solution: ${concept.solution}
Platform: ${config.platform || 'mobile'}

Provide 10-15 features categorized by priority:
- Must-have: Core features for MVP
- Should-have: Important but not critical
- Nice-to-have: Future enhancements

Format as JSON array:
[
  {
    "name": "Feature Name",
    "description": "Detailed feature description",
    "priority": "must-have"
  }
]`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to generate features');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate user flows
 */
async function generateUserFlows(concept: any, features: any[], config: AppConfig) {
  const mustHaveFeatures = features.filter(f => f.priority === 'must-have');
  
  const prompt = `Create user flows for the core features of this app:

App: ${concept.appName}
Core Features: ${mustHaveFeatures.map(f => f.name).join(', ')}

For each core feature, provide:
1. Flow name
2. Step-by-step user journey
3. Description of the flow

Format as JSON array:
[
  {
    "name": "User Registration Flow",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "description": "How users sign up and onboard"
  }
]`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to generate user flows');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate screen descriptions
 */
async function generateScreens(userFlows: any[], features: any[], config: AppConfig) {
  const prompt = `Design the key screens for this app based on the user flows:

User Flows: ${JSON.stringify(userFlows)}

For each important screen, provide:
1. Screen name
2. Detailed description of layout, components, and interactions

Format as JSON array:
[
  {
    "name": "Home Screen",
    "description": "Detailed description of screen layout, components, buttons, navigation, etc."
  }
]`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to generate screens');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate wireframe images (limit to 6 key screens)
 */
async function generateWireframes(
  screens: any[],
  config: AppConfig,
  onProgress?: (current: number) => void
) {
  const platform = config.platform || 'mobile';
  const maxWireframes = 6; // Limit to avoid too many image generations
  const keyScreens = screens.slice(0, maxWireframes);
  
  const wireframedScreens = [];
  
  for (let i = 0; i < keyScreens.length; i++) {
    const screen = keyScreens[i];
    
    const wireframePrompt = `${platform} app wireframe for: ${screen.name}

Layout: ${screen.description}

Style: Clean wireframe, black and white, professional UI/UX design, ${platform} interface guidelines
Elements: Show buttons, text fields, navigation, icons as simple shapes
Quality: High-fidelity wireframe, clear and professional`;

    try {
      const wireframeResult = await generateImage({
        prompt: wireframePrompt,
      });
      
      wireframedScreens.push({
        ...screen,
        wireframeUrl: wireframeResult.url
      });
    } catch (error) {
      console.error(`Failed to generate wireframe for ${screen.name}:`, error);
      wireframedScreens.push(screen);
    }
    
    onProgress?.(i + 1);
  }
  
  // Add remaining screens without wireframes
  if (screens.length > maxWireframes) {
    wireframedScreens.push(...screens.slice(maxWireframes));
  }
  
  return wireframedScreens;
}

/**
 * Recommend tech stack
 */
async function recommendTechStack(concept: any, features: any[], config: AppConfig) {
  const platform = config.platform || 'mobile';
  
  const prompt = `Recommend a modern tech stack for this app:

App: ${concept.appName}
Platform: ${platform}
Features: ${features.map(f => f.name).join(', ')}

Provide recommendations for:
1. Frontend framework/language
2. Backend framework/language
3. Database (SQL/NoSQL)
4. Hosting/deployment platform
5. Reasoning for each choice

Consider: scalability, cost, developer availability, time to market

Format as JSON:
{
  "frontend": ["Technology 1", "Technology 2"],
  "backend": ["Technology 1", "Technology 2"],
  "database": "Database choice",
  "hosting": "Hosting platform",
  "reasoning": "Explanation of tech stack choices"
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to recommend tech stack');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Design database schema
 */
async function designDatabase(features: any[], config: AppConfig) {
  const prompt = `Design a database schema for this app based on the features:

Features: ${JSON.stringify(features)}

Provide:
1. List of tables/collections
2. Fields for each table with types and constraints

Format as JSON:
{
  "tables": [
    {
      "name": "users",
      "fields": [
        {"name": "id", "type": "uuid", "required": true},
        {"name": "email", "type": "string", "required": true}
      ]
    }
  ]
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to design database');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate development timeline
 */
async function generateTimeline(features: any[], config: AppConfig) {
  const mustHaveCount = features.filter(f => f.priority === 'must-have').length;
  const shouldHaveCount = features.filter(f => f.priority === 'should-have').length;
  
  const prompt = `Create a realistic development timeline for this app:

Must-have features: ${mustHaveCount}
Should-have features: ${shouldHaveCount}
Platform: ${config.platform || 'mobile'}

Provide:
1. MVP timeline (weeks)
2. Full launch timeline (weeks)
3. Development phases with deliverables

Format as JSON:
{
  "mvp": "X weeks",
  "fullLaunch": "Y weeks",
  "phases": [
    {
      "phase": "Phase 1: Foundation",
      "duration": "2 weeks",
      "deliverables": ["Deliverable 1", "Deliverable 2"]
    }
  ]
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o-mini',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate timeline');
  }

  return JSON.parse(jsonMatch[0]);
}
