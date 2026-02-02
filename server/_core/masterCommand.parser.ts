/**
 * Master Command System - Command Parser Agent
 * 
 * Parses natural language commands into structured intents.
 */

import type { ParsedCommand, CommandIntent, AgentContext } from './masterCommand.types';

export class CommandParser {
  /**
   * Parse a natural language command into structured intent
   */
  async parse(command: string, context: string | undefined): Promise<ParsedCommand> {
    // Use AI to parse the command
    const prompt = `You are a command parser for a self-modifying AI system. Parse the following command into structured intent.

Command: "${command}"
${context ? `Context: "${context}"` : ''}

Analyze the command and extract:
1. Intent: What type of operation is this? (add_feature, fix_bug, modify_ui, optimize, refactor, remove_feature)
2. Target: What part of the system should be modified? (e.g., "settings page", "credit balance", "homepage")
3. Action: What specific action should be taken? (e.g., "add dark mode toggle", "fix update bug")
4. Constraints: Any constraints or requirements mentioned?

Respond in JSON format:
{
  "intent": "add_feature" | "fix_bug" | "modify_ui" | "optimize" | "refactor" | "remove_feature",
  "target": "string",
  "action": "string",
  "constraints": ["string"] | null
}`;

    try {
      // For now, use simple pattern matching
      // TODO: Replace with AI call to Kimi K2.5
      const parsed = this.simpleParser(command);
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse command: ${error}`);
    }
  }

  /**
   * Simple pattern-based parser (fallback)
   */
  private simpleParser(command: string): ParsedCommand {
    const lowerCommand = command.toLowerCase();
    
    // Detect intent
    let intent: CommandIntent = 'add_feature';
    if (lowerCommand.includes('fix') || lowerCommand.includes('bug')) {
      intent = 'fix_bug';
    } else if (lowerCommand.includes('remove') || lowerCommand.includes('delete')) {
      intent = 'remove_feature';
    } else if (lowerCommand.includes('optimize') || lowerCommand.includes('improve')) {
      intent = 'optimize';
    } else if (lowerCommand.includes('refactor') || lowerCommand.includes('restructure')) {
      intent = 'refactor';
    } else if (lowerCommand.includes('modify') || lowerCommand.includes('change') || lowerCommand.includes('update')) {
      intent = 'modify_ui';
    }

    // Extract target (simplified)
    let target = 'unknown';
    const targetPatterns = [
      'settings page',
      'homepage',
      'chat page',
      'credit balance',
      'navigation',
      'sidebar',
      'header',
      'footer',
      'dashboard',
      'profile page',
    ];
    
    for (const pattern of targetPatterns) {
      if (lowerCommand.includes(pattern)) {
        target = pattern;
        break;
      }
    }

    return {
      intent,
      target,
      action: command, // Use full command as action for now
      constraints: [],
    };
  }

  /**
   * Validate that a parsed command is safe and feasible
   */
  validate(parsed: ParsedCommand): { valid: boolean; reason?: string } {
    // Check for dangerous operations
    const dangerousKeywords = [
      'database',
      'migration',
      'production',
      'deploy',
      'env',
      'secret',
      'password',
      'api key',
    ];

    const lowerAction = parsed.action.toLowerCase();
    for (const keyword of dangerousKeywords) {
      if (lowerAction.includes(keyword)) {
        return {
          valid: false,
          reason: `Command involves dangerous operation: ${keyword}. This requires manual intervention.`,
        };
      }
    }

    // Check for empty or invalid commands
    if (!parsed.action || parsed.action.trim().length < 5) {
      return {
        valid: false,
        reason: 'Command is too short or empty.',
      };
    }

    return { valid: true };
  }

  /**
   * Add log entry to context
   */
  log(context: AgentContext, message: string): void {
    context.logs.push(`[Parser] ${message}`);
  }
}
