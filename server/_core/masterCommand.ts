/**
 * Master Command System - Main Orchestrator
 * 
 * Coordinates all agents to execute self-modifying commands.
 */

import type { 
  MasterCommandRequest, 
  MasterCommandResponse, 
  AgentContext 
} from './masterCommand.types';
import { CommandParser } from './masterCommand.parser';
import { CodeAnalyzer } from './masterCommand.analyzer';
import { Planner } from './masterCommand.planner';
import { CodeGenerator } from './masterCommand.generator';
import { Tester } from './masterCommand.tester';
import { Deployer } from './masterCommand.deployer';

export class MasterCommandSystem {
  private projectPath: string;
  private parser: CommandParser;
  private analyzer: CodeAnalyzer;
  private planner: Planner;
  private generator: CodeGenerator;
  private tester: Tester;
  private deployer: Deployer;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.parser = new CommandParser();
    this.analyzer = new CodeAnalyzer(projectPath);
    this.planner = new Planner();
    this.generator = new CodeGenerator(projectPath);
    this.tester = new Tester(projectPath);
    this.deployer = new Deployer(projectPath);
  }

  /**
   * Execute a master command
   */
  async execute(request: MasterCommandRequest): Promise<MasterCommandResponse> {
    const commandId = this.generateCommandId();
    const context: AgentContext = {
      projectPath: this.projectPath,
      command: request,
      logs: [],
    };

    try {
      this.log(context, `Starting Master Command: ${request.command}`);

      // 1. Parse command
      const parsed = await this.parser.parse(request.command, request.context);
      context.parsed = parsed;
      
      // Validate command
      const validation = this.parser.validate(parsed);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }

      // 2. Analyze codebase
      const analysis = await this.analyzer.analyze(parsed, context);
      context.analysis = analysis;

      // 3. Create plan
      const plan = await this.planner.createPlan(parsed, analysis, context);
      context.plan = plan;

      // If dry run, return plan without executing
      if (request.dryRun) {
        return {
          success: true,
          commandId,
          plan,
          logs: context.logs,
        };
      }

      // 4. Generate code
      const changes = await this.generator.generate(plan, context);

      // 5. Apply changes
      await this.generator.applyChanges(changes, context);

      // 6. Run tests
      const testResults = await this.tester.runTests(context);

      // 7. Deploy (create checkpoint)
      const deployment = await this.deployer.deploy(
        changes,
        request.command,
        context
      );

      this.log(context, 'Master Command completed successfully');

      return {
        success: true,
        commandId,
        plan,
        execution: {
          changes,
          testsPass: testResults.passed,
          checkpointId: deployment.checkpointId,
          versionId: deployment.versionId,
          executionTime: 0, // TODO: Track execution time
        },
        logs: context.logs,
      };

    } catch (error: any) {
      this.log(context, `Error: ${error.message}`);

      return {
        success: false,
        commandId,
        plan: context.plan || {
          steps: [],
          filesToModify: [],
          filesToCreate: [],
          filesToDelete: [],
          estimatedComplexity: 'simple',
          estimatedTime: 0,
          risks: [],
          rollbackStrategy: '',
        },
        error: error.message,
        logs: context.logs,
      };
    }
  }

  /**
   * Generate unique command ID
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add log entry
   */
  private log(context: AgentContext, message: string): void {
    context.logs.push(`[MasterCommand] ${message}`);
  }
}
