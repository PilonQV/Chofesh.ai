/**
 * Master Command System - Type Definitions
 * 
 * This system enables admin users to give natural language commands
 * that automatically modify the Chofesh codebase.
 */

export interface MasterCommandRequest {
  command: string;           // Natural language command
  context?: string;          // Optional additional context
  dryRun?: boolean;         // Preview changes without applying
}

export interface MasterCommandResponse {
  success: boolean;
  commandId: string;
  plan: ImplementationPlan;
  execution?: ExecutionResult;
  error?: string;
  logs: string[];
}

export interface ParsedCommand {
  intent: CommandIntent;
  target: string;           // What to modify (e.g., "settings page", "credit balance")
  action: string;           // What to do (e.g., "add dark mode toggle", "fix update bug")
  constraints?: string[];   // Any constraints or requirements
}

export type CommandIntent = 
  | 'add_feature' 
  | 'fix_bug' 
  | 'modify_ui' 
  | 'optimize' 
  | 'refactor'
  | 'remove_feature';

export interface CodeAnalysis {
  relevantFiles: string[];
  currentImplementation: string;
  dependencies: string[];
  relatedComponents: string[];
}

export interface ImplementationPlan {
  steps: ImplementationStep[];
  filesToModify: string[];
  filesToCreate: string[];
  filesToDelete: string[];
  estimatedComplexity: 'simple' | 'medium' | 'complex';
  estimatedTime: number;
  risks: string[];
  rollbackStrategy: string;
}

export interface ImplementationStep {
  id: number;
  description: string;
  files: string[];
  action: 'create' | 'modify' | 'delete';
  code?: string;
  reasoning: string;
}

export interface ExecutionResult {
  changes: FileChange[];
  testsPass: boolean;
  checkpointId?: string;
  versionId?: string;
  executionTime: number;
}

export interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete';
  diff?: string;
  linesAdded: number;
  linesRemoved: number;
  content?: string;
}

export interface TestResults {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errors: TestError[];
  coverage?: number;
}

export interface TestError {
  test: string;
  error: string;
  stack?: string;
}

export interface DeploymentResult {
  checkpointId: string;
  versionId: string;
  timestamp: string;
  changes: FileChange[];
  message: string;
}

export interface CommandLog {
  id: string;
  timestamp: Date;
  adminId: string;
  command: string;
  parsedIntent: ParsedCommand;
  plan: ImplementationPlan;
  changes: FileChange[];
  checkpointId?: string;
  versionId?: string;
  success: boolean;
  testsPass: boolean;
  error?: string;
  executionTime: number;
}

export interface AgentContext {
  projectPath: string;
  command: MasterCommandRequest;
  parsed?: ParsedCommand;
  analysis?: CodeAnalysis;
  plan?: ImplementationPlan;
  logs: string[];
}
