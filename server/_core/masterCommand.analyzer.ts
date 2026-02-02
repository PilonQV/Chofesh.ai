/**
 * Master Command System - Code Analysis Agent
 * 
 * Analyzes the codebase to understand current implementation
 * and identify relevant files for modification.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { CodeAnalysis, ParsedCommand, AgentContext } from './masterCommand.types';

export class CodeAnalyzer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Analyze codebase based on parsed command
   */
  async analyze(parsed: ParsedCommand, context: AgentContext): Promise<CodeAnalysis> {
    this.log(context, `Analyzing codebase for: ${parsed.target}`);

    const relevantFiles = await this.findRelevantFiles(parsed);
    const dependencies = await this.findDependencies(relevantFiles);
    const relatedComponents = await this.findRelatedComponents(parsed);
    const currentImplementation = await this.getCurrentImplementation(relevantFiles);

    this.log(context, `Found ${relevantFiles.length} relevant files`);

    return {
      relevantFiles,
      currentImplementation,
      dependencies,
      relatedComponents,
    };
  }

  /**
   * Find files relevant to the command
   */
  private async findRelevantFiles(parsed: ParsedCommand): Promise<string[]> {
    const files: string[] = [];

    // Map target to file patterns
    const targetToPatterns: Record<string, string[]> = {
      'settings page': ['**/Settings.tsx', '**/settings/**/*.tsx'],
      'homepage': ['**/Home.tsx', '**/pages/index.tsx'],
      'chat page': ['**/Chat.tsx', '**/pages/chat.tsx'],
      'credit balance': ['**/Credits.tsx', '**/components/*Credit*.tsx'],
      'navigation': ['**/Navigation.tsx', '**/Nav.tsx', '**/Sidebar.tsx'],
      'header': ['**/Header.tsx', '**/AppBar.tsx'],
      'footer': ['**/Footer.tsx'],
      'dashboard': ['**/Dashboard.tsx', '**/pages/dashboard.tsx'],
      'profile page': ['**/Profile.tsx', '**/pages/profile.tsx'],
    };

    const patterns = targetToPatterns[parsed.target] || [`**/*${parsed.target}*.tsx`];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: path.join(this.projectPath, 'client/src'),
        absolute: true,
      });
      files.push(...matches);
    }

    // Always include routers.ts for API changes
    if (parsed.intent === 'add_feature' && parsed.action.toLowerCase().includes('api')) {
      files.push(path.join(this.projectPath, 'server/routers.ts'));
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Find dependencies of the relevant files
   */
  private async findDependencies(files: string[]): Promise<string[]> {
    const dependencies: string[] = [];

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (importPath.startsWith('.') || importPath.startsWith('@/')) {
            dependencies.push(importPath);
          }
        }
      } catch (error) {
        // Ignore errors reading files
      }
    }

    return [...new Set(dependencies)];
  }

  /**
   * Find related components based on command
   */
  private async findRelatedComponents(parsed: ParsedCommand): Promise<string[]> {
    const components: string[] = [];

    // Search for related components based on keywords in action
    const keywords = parsed.action.toLowerCase().split(' ');
    const componentPatterns = keywords.map(keyword => `**/*${keyword}*.tsx`);

    for (const pattern of componentPatterns) {
      try {
        const matches = await glob(pattern, {
          cwd: path.join(this.projectPath, 'client/src/components'),
          absolute: true,
        });
        components.push(...matches);
      } catch (error) {
        // Ignore glob errors
      }
    }

    return [...new Set(components)].slice(0, 10); // Limit to 10 components
  }

  /**
   * Get current implementation from relevant files
   */
  private async getCurrentImplementation(files: string[]): Promise<string> {
    const implementations: string[] = [];

    for (const file of files.slice(0, 5)) { // Limit to first 5 files
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const relativePath = path.relative(this.projectPath, file);
        implementations.push(`\n=== ${relativePath} ===\n${content.slice(0, 1000)}...\n`);
      } catch (error) {
        // Ignore errors
      }
    }

    return implementations.join('\n');
  }

  /**
   * Add log entry to context
   */
  private log(context: AgentContext, message: string): void {
    context.logs.push(`[Analyzer] ${message}`);
  }
}
