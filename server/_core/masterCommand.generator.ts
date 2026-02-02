/**
 * Master Command System - Code Generation Agent
 * 
 * Generates or modifies code based on implementation plan.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ImplementationPlan, FileChange, AgentContext } from './masterCommand.types';
import { callKimiAPI, withTimeout } from './masterCommand.aiClient';

export class CodeGenerator {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Generate code changes based on plan
   */
  async generate(
    plan: ImplementationPlan,
    context: AgentContext
  ): Promise<FileChange[]> {
    console.log('[Generator] Generating code changes...');
    this.log(context, 'Generating code changes...');

    const changes: FileChange[] = [];

    for (const step of plan.steps) {
      for (const file of step.files) {
        try {
          console.log(`[Generator] Processing file: ${path.relative(this.projectPath, file)}`);
          const change = await this.generateFileChange(file, step.action, step.description, step.code);
          changes.push(change);
          this.log(context, `Generated change for: ${path.relative(this.projectPath, file)}`);
        } catch (error: any) {
          console.warn(`[Generator] Error for ${file}:`, error.message);
          this.log(context, `Error generating change for ${file}: ${error}`);
        }
      }
    }

    return changes;
  }

  /**
   * Generate change for a single file
   */
  private async generateFileChange(
    filePath: string,
    action: 'create' | 'modify' | 'delete',
    description: string,
    code?: string
  ): Promise<FileChange> {
    const relativePath = path.relative(this.projectPath, filePath);

    if (action === 'delete') {
      return {
        path: relativePath,
        action: 'delete',
        linesAdded: 0,
        linesRemoved: await this.countLines(filePath),
      };
    }

    if (action === 'create') {
      const content = code || `// TODO: Implement ${description}\n`;
      return {
        path: relativePath,
        action: 'create',
        content,
        linesAdded: content.split('\n').length,
        linesRemoved: 0,
      };
    }

    // Modify existing file
    const originalContent = await fs.promises.readFile(filePath, 'utf-8');
    const modifiedContent = await this.modifyFile(originalContent, description, code);
    
    const originalLines = originalContent.split('\n').length;
    const modifiedLines = modifiedContent.split('\n').length;

    return {
      path: relativePath,
      action: 'modify',
      content: modifiedContent,
      diff: this.createSimpleDiff(originalContent, modifiedContent),
      linesAdded: Math.max(0, modifiedLines - originalLines),
      linesRemoved: Math.max(0, originalLines - modifiedLines),
    };
  }

  /**
   * Modify file content using AI
   */
  private async modifyFile(
    originalContent: string,
    description: string,
    code?: string
  ): Promise<string> {
    // If specific code provided, use it
    if (code) {
      return code;
    }

    // Try AI-powered code generation (with 45s timeout)
    try {
      console.log('[Generator] Calling AI for code modification...');
      const prompt = `You are a code modification agent. Modify the following code according to the description.

Description: ${description}

Original Code:
\`\`\`
${originalContent}
\`\`\`

Provide the complete modified code. Only output the code, no explanations.`;

      const response = await withTimeout(
        callKimiAPI([{ role: 'user', content: prompt }], 0.2),
        45000, // 45 second timeout (longer for code generation)
        'AI code generation'
      );
      console.log('[Generator] AI code modification complete');

      const content = response.content;
      if (content) {
        // Extract code from markdown code blocks if present
        const codeMatch = content.match(/```(?:typescript|javascript|tsx|jsx)?\n([\s\S]*?)```/);
        if (codeMatch) {
          return codeMatch[1].trim();
        }
        return content.trim();
      }
    } catch (aiError: any) {
      console.warn('[Generator] AI code generation failed, using fallback');
      console.warn('[Generator] Error:', aiError.message);
    }

    // Fallback: just add a comment
    const comment = `// Master Command: ${description}\n`;
    return comment + originalContent;
  }

  /**
   * Create simple diff
   */
  private createSimpleDiff(original: string, modified: string): string {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    const diff: string[] = [];
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < Math.min(maxLines, 20); i++) {
      if (originalLines[i] !== modifiedLines[i]) {
        if (originalLines[i]) {
          diff.push(`- ${originalLines[i]}`);
        }
        if (modifiedLines[i]) {
          diff.push(`+ ${modifiedLines[i]}`);
        }
      }
    }
    
    return diff.join('\n');
  }

  /**
   * Count lines in file
   */
  private async countLines(filePath: string): Promise<number> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return content.split('\n').length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Apply changes to files
   */
  async applyChanges(changes: FileChange[], context: AgentContext): Promise<void> {
    this.log(context, `Applying ${changes.length} changes...`);

    for (const change of changes) {
      const fullPath = path.join(this.projectPath, change.path);

      try {
        if (change.action === 'delete') {
          await fs.promises.unlink(fullPath);
          this.log(context, `Deleted: ${change.path}`);
        } else if (change.action === 'create' || change.action === 'modify') {
          if (change.content) {
            // Ensure directory exists
            await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.promises.writeFile(fullPath, change.content, 'utf-8');
            this.log(context, `${change.action === 'create' ? 'Created' : 'Modified'}: ${change.path}`);
          }
        }
      } catch (error) {
        this.log(context, `Error applying change to ${change.path}: ${error}`);
        throw error;
      }
    }
  }

  /**
   * Add log entry to context
   */
  private log(context: AgentContext, message: string): void {
    context.logs.push(`[Generator] ${message}`);
  }
}
