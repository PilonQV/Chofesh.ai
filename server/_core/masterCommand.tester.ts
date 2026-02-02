/**
 * Master Command System - Testing Agent
 * 
 * Runs tests to verify changes don't break functionality.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { TestResults, AgentContext } from './masterCommand.types';

const execAsync = promisify(exec);

export class Tester {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Run tests
   */
  async runTests(context: AgentContext): Promise<TestResults> {
    this.log(context, 'Running tests...');

    try {
      // Run vitest
      const { stdout, stderr } = await execAsync('pnpm test --run', {
        cwd: this.projectPath,
        timeout: 60000, // 60 second timeout
      });

      const results = this.parseTestOutput(stdout + stderr);
      this.log(context, `Tests completed: ${results.passedTests}/${results.totalTests} passed`);

      return results;
    } catch (error: any) {
      // Tests failed
      const output = error.stdout + error.stderr;
      const results = this.parseTestOutput(output);
      this.log(context, `Tests failed: ${results.failedTests} failures`);

      return results;
    }
  }

  /**
   * Parse test output
   */
  private parseTestOutput(output: string): TestResults {
    // Simple parser for vitest output
    // Format: "Test Files  X passed | Y failed (Z total)"
    
    const passedMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);
    const totalMatch = output.match(/\((\d+)\s+total\)/);

    const passedTests = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failedTests = failedMatch ? parseInt(failedMatch[1]) : 0;
    const totalTests = totalMatch ? parseInt(totalMatch[1]) : passedTests + failedTests;

    const errors = this.extractErrors(output);

    return {
      passed: failedTests === 0,
      totalTests,
      passedTests,
      failedTests,
      errors,
    };
  }

  /**
   * Extract error messages from output
   */
  private extractErrors(output: string): Array<{ test: string; error: string; stack?: string }> {
    const errors: Array<{ test: string; error: string; stack?: string }> = [];

    // Look for error patterns in vitest output
    const errorPattern = /FAIL\s+(.+?)\n(.+?)(?=FAIL|$)/gs;
    let match;

    while ((match = errorPattern.exec(output)) !== null) {
      errors.push({
        test: match[1].trim(),
        error: match[2].trim().slice(0, 200), // Limit error message length
      });
    }

    return errors;
  }

  /**
   * Add log entry to context
   */
  private log(context: AgentContext, message: string): void {
    context.logs.push(`[Tester] ${message}`);
  }
}
