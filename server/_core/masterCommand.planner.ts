/**
 * Master Command System - Planning Agent
 * 
 * Creates implementation plans based on command and code analysis.
 */

import type { ImplementationPlan, ImplementationStep, ParsedCommand, CodeAnalysis, AgentContext } from './masterCommand.types';
import { callKimiAPI, withTimeout } from './masterCommand.aiClient';

export class Planner {
  /**
   * Create implementation plan
   */
  async createPlan(
    parsed: ParsedCommand,
    analysis: CodeAnalysis,
    context: AgentContext
  ): Promise<ImplementationPlan> {
    console.log('[Planner] Creating implementation plan...');
    this.log(context, 'Creating implementation plan...');

    const steps = await this.generateSteps(parsed, analysis);
    const complexity = this.estimateComplexity(steps);
    const time = this.estimateTime(complexity);
    const risks = this.identifyRisks(parsed, analysis);
    const rollbackStrategy = this.createRollbackStrategy();

    const filesToModify = [...new Set(steps.filter(s => s.action === 'modify').flatMap(s => s.files))];
    const filesToCreate = [...new Set(steps.filter(s => s.action === 'create').flatMap(s => s.files))];
    const filesToDelete = [...new Set(steps.filter(s => s.action === 'delete').flatMap(s => s.files))];

    this.log(context, `Plan created: ${steps.length} steps, ${complexity} complexity`);

    return {
      steps,
      filesToModify,
      filesToCreate,
      filesToDelete,
      estimatedComplexity: complexity,
      estimatedTime: time,
      risks,
      rollbackStrategy,
    };
  }

  /**
   * Generate implementation steps
   */
  private async generateSteps(
    parsed: ParsedCommand,
    analysis: CodeAnalysis
  ): Promise<ImplementationStep[]> {
    console.log('[Planner] Generating implementation steps...');
    // Try AI-powered planning first (with 30s timeout)
    try {
      console.log('[Planner] Calling AI model...');
      const prompt = `You are a technical planner for a self-modifying AI system. Create detailed implementation steps.

Command Intent: ${parsed.intent}
Target: ${parsed.target}
Action: ${parsed.action}
Constraints: ${parsed.constraints?.join(', ') || 'None'}

Relevant Files:
${analysis.relevantFiles.slice(0, 5).join('\n')}

Create a step-by-step implementation plan. Each step should:
1. Have a clear description
2. List files to modify/create/delete
3. Explain the reasoning

Respond in JSON format:
{
  "steps": [
    {
      "description": "string",
      "files": ["path/to/file.ts"],
      "action": "modify" | "create" | "delete",
      "reasoning": "string"
    }
  ]
}`;

      const response = await withTimeout(
        callKimiAPI([{ role: 'user', content: prompt }], 0.3),
        30000, // 30 second timeout
        'AI planning'
      );
      console.log('[Planner] AI response received');

      const content = response.content;
      if (content) {
        const result = JSON.parse(content);
        return result.steps.map((step: any, index: number) => ({
          id: index + 1,
          description: step.description,
          files: step.files,
          action: step.action,
          reasoning: step.reasoning,
        }));
      }
    } catch (aiError: any) {
      console.warn('[Planner] AI planning failed, falling back to simple planner');
      console.warn('[Planner] Error:', aiError.message);
    }

    // Fallback to simple planning
    console.log('[Planner] Using simple rule-based planner');
    const steps: ImplementationStep[] = [];

    switch (parsed.intent) {
      case 'add_feature':
        steps.push({
          id: 1,
          description: `Add ${parsed.action} to ${parsed.target}`,
          files: analysis.relevantFiles.slice(0, 1),
          action: 'modify',
          reasoning: 'Modify existing component to add new feature',
        });
        break;

      case 'fix_bug':
        steps.push({
          id: 1,
          description: `Fix bug: ${parsed.action}`,
          files: analysis.relevantFiles.slice(0, 1),
          action: 'modify',
          reasoning: 'Modify component to fix reported bug',
        });
        break;

      case 'modify_ui':
        steps.push({
          id: 1,
          description: `Update UI: ${parsed.action}`,
          files: analysis.relevantFiles.slice(0, 1),
          action: 'modify',
          reasoning: 'Modify component UI based on request',
        });
        break;

      case 'remove_feature':
        steps.push({
          id: 1,
          description: `Remove ${parsed.action} from ${parsed.target}`,
          files: analysis.relevantFiles.slice(0, 1),
          action: 'modify',
          reasoning: 'Remove feature from component',
        });
        break;

      case 'optimize':
        steps.push({
          id: 1,
          description: `Optimize ${parsed.target}: ${parsed.action}`,
          files: analysis.relevantFiles.slice(0, 1),
          action: 'modify',
          reasoning: 'Optimize component performance',
        });
        break;

      case 'refactor':
        steps.push({
          id: 1,
          description: `Refactor ${parsed.target}: ${parsed.action}`,
          files: analysis.relevantFiles.slice(0, 1),
          action: 'modify',
          reasoning: 'Refactor component for better structure',
        });
        break;
    }

    return steps;
  }

  /**
   * Estimate complexity
   */
  private estimateComplexity(steps: ImplementationStep[]): 'simple' | 'medium' | 'complex' {
    const totalFiles = new Set(steps.flatMap(s => s.files)).size;

    if (totalFiles <= 1 && steps.length <= 2) {
      return 'simple';
    } else if (totalFiles <= 3 && steps.length <= 5) {
      return 'medium';
    } else {
      return 'complex';
    }
  }

  /**
   * Estimate time in seconds
   */
  private estimateTime(complexity: 'simple' | 'medium' | 'complex'): number {
    switch (complexity) {
      case 'simple':
        return 30;
      case 'medium':
        return 60;
      case 'complex':
        return 120;
    }
  }

  /**
   * Identify risks
   */
  private identifyRisks(parsed: ParsedCommand, analysis: CodeAnalysis): string[] {
    const risks: string[] = [];

    if (analysis.relevantFiles.length === 0) {
      risks.push('No relevant files found - may need to create new files');
    }

    if (analysis.dependencies.length > 10) {
      risks.push('Many dependencies - changes may affect multiple components');
    }

    if (parsed.intent === 'refactor') {
      risks.push('Refactoring may break existing functionality');
    }

    return risks;
  }

  /**
   * Create rollback strategy
   */
  private createRollbackStrategy(): string {
    return 'Automatic checkpoint created before changes. Use webdev_rollback_checkpoint to revert.';
  }

  /**
   * Add log entry to context
   */
  private log(context: AgentContext, message: string): void {
    context.logs.push(`[Planner] ${message}`);
  }
}
