/**
 * Workspace Abstraction Layer
 * 
 * Provides a unified interface for code execution across different environments:
 * - Local: Direct execution on server (development only)
 * - Docker: Isolated containers with custom environments
 * - Piston: Self-hosted code execution engine (60+ languages)
 * - E2B: Enterprise-grade cloud sandboxes
 * - Remote: WebSocket/SSH connection to external machines
 */

// ============================================================================
// Core Types
// ============================================================================

export type WorkspaceType = 'local' | 'docker' | 'piston' | 'e2b' | 'remote';

export type WorkspaceStatus = 'creating' | 'active' | 'stopped' | 'error' | 'destroyed';

export type PackageManager = 'pip' | 'npm' | 'yarn' | 'pnpm' | 'cargo' | 'go' | 'gem' | 'composer';

export interface WorkspaceConfig {
  type: WorkspaceType;
  name?: string;
  language?: string;
  timeout?: number; // Default execution timeout in seconds
  memoryLimit?: number; // Memory limit in MB
  cpuLimit?: number; // CPU cores
  env?: Record<string, string>; // Environment variables
  packages?: PackageInstallRequest[]; // Pre-install packages
  template?: string; // Template ID for E2B or Docker image
}

export interface WorkspaceInfo {
  id: string;
  type: WorkspaceType;
  status: WorkspaceStatus;
  createdAt: Date;
  lastActivityAt: Date;
  config: WorkspaceConfig;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// File Operations
// ============================================================================

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: Date;
}

export interface FileReadResult {
  content: string;
  encoding: 'utf-8' | 'base64';
}

export interface FileWriteRequest {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
  createDirs?: boolean;
}

// ============================================================================
// Code Execution
// ============================================================================

export interface ExecuteRequest {
  code: string;
  language: string;
  version?: string; // Specific language version
  stdin?: string;
  args?: string[];
  env?: Record<string, string>;
  workingDir?: string;
  timeout?: number; // Seconds
  memoryLimit?: number; // MB
  files?: FileWriteRequest[]; // Files to create before execution
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal?: string;
  status: 'success' | 'error' | 'timeout' | 'memory_exceeded' | 'killed';
  executionTime: number; // Milliseconds
  memoryUsed?: number; // MB
  output?: string; // Combined stdout + stderr
}

// ============================================================================
// Package Management
// ============================================================================

export interface PackageInstallRequest {
  name: string;
  version?: string;
  manager: PackageManager;
}

export interface PackageInstallResult {
  success: boolean;
  package: string;
  version?: string;
  error?: string;
  output?: string;
}

// ============================================================================
// Terminal/Shell Operations
// ============================================================================

export interface TerminalSession {
  id: string;
  workspaceId: string;
  createdAt: Date;
  status: 'active' | 'closed';
}

export interface TerminalOutput {
  type: 'stdout' | 'stderr' | 'exit';
  data: string;
  timestamp: Date;
}

// ============================================================================
// Workspace Interface
// ============================================================================

export interface IWorkspace {
  // Identity
  readonly id: string;
  readonly type: WorkspaceType;
  readonly status: WorkspaceStatus;
  readonly config: WorkspaceConfig;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
  getInfo(): Promise<WorkspaceInfo>;
  
  // File Operations
  readFile(path: string): Promise<FileReadResult>;
  writeFile(request: FileWriteRequest): Promise<void>;
  listFiles(path: string): Promise<FileInfo[]>;
  deleteFile(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  
  // Code Execution
  execute(request: ExecuteRequest): Promise<ExecuteResult>;
  executeStream(request: ExecuteRequest, onOutput: (output: TerminalOutput) => void): Promise<ExecuteResult>;
  
  // Package Management
  installPackage(request: PackageInstallRequest): Promise<PackageInstallResult>;
  listPackages(manager: PackageManager): Promise<string[]>;
  
  // Terminal (optional, not all providers support)
  createTerminal?(): Promise<TerminalSession>;
  sendToTerminal?(sessionId: string, input: string): Promise<void>;
  closeTerminal?(sessionId: string): Promise<void>;
}

// ============================================================================
// Workspace Provider Interface
// ============================================================================

export interface IWorkspaceProvider {
  readonly type: WorkspaceType;
  readonly name: string;
  readonly supportedLanguages: string[];
  readonly supportsPackageManagement: boolean;
  readonly supportsFileSystem: boolean;
  readonly supportsTerminal: boolean;
  
  // Check if provider is available
  isAvailable(): Promise<boolean>;
  
  // Create a new workspace
  create(config: WorkspaceConfig): Promise<IWorkspace>;
  
  // Get existing workspace by ID
  get(workspaceId: string): Promise<IWorkspace | null>;
  
  // List all workspaces
  list(): Promise<WorkspaceInfo[]>;
  
  // Cleanup resources
  cleanup(): Promise<void>;
}

// ============================================================================
// Workspace Manager Interface
// ============================================================================

export interface IWorkspaceManager {
  // Register providers
  registerProvider(provider: IWorkspaceProvider): void;
  
  // Get available providers
  getProviders(): IWorkspaceProvider[];
  getProvider(type: WorkspaceType): IWorkspaceProvider | undefined;
  
  // Create workspace with best available provider
  createWorkspace(config: WorkspaceConfig): Promise<IWorkspace>;
  
  // Get workspace by ID
  getWorkspace(workspaceId: string): Promise<IWorkspace | null>;
  
  // List all workspaces across all providers
  listWorkspaces(): Promise<WorkspaceInfo[]>;
  
  // Execute code with automatic workspace selection
  executeCode(request: ExecuteRequest): Promise<ExecuteResult>;
  
  // Cleanup all resources
  cleanup(): Promise<void>;
}

// ============================================================================
// Language Support
// ============================================================================

export interface LanguageInfo {
  id: string;
  name: string;
  version?: string;
  aliases: string[];
  extension: string;
  packageManager?: PackageManager;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  // Popular languages
  { id: 'python', name: 'Python', version: '3.11', aliases: ['py', 'python3'], extension: '.py', packageManager: 'pip' },
  { id: 'javascript', name: 'JavaScript', version: 'Node 20', aliases: ['js', 'node', 'nodejs'], extension: '.js', packageManager: 'npm' },
  { id: 'typescript', name: 'TypeScript', version: '5.0', aliases: ['ts'], extension: '.ts', packageManager: 'npm' },
  { id: 'java', name: 'Java', version: '17', aliases: [], extension: '.java' },
  { id: 'cpp', name: 'C++', version: 'GCC 12', aliases: ['c++', 'cxx'], extension: '.cpp' },
  { id: 'c', name: 'C', version: 'GCC 12', aliases: [], extension: '.c' },
  { id: 'go', name: 'Go', version: '1.21', aliases: ['golang'], extension: '.go', packageManager: 'go' },
  { id: 'rust', name: 'Rust', version: '1.70', aliases: ['rs'], extension: '.rs', packageManager: 'cargo' },
  { id: 'ruby', name: 'Ruby', version: '3.2', aliases: ['rb'], extension: '.rb', packageManager: 'gem' },
  { id: 'php', name: 'PHP', version: '8.2', aliases: [], extension: '.php', packageManager: 'composer' },
  
  // Additional languages
  { id: 'kotlin', name: 'Kotlin', version: '1.9', aliases: ['kt'], extension: '.kt' },
  { id: 'swift', name: 'Swift', version: '5.9', aliases: [], extension: '.swift' },
  { id: 'scala', name: 'Scala', version: '3.3', aliases: [], extension: '.scala' },
  { id: 'haskell', name: 'Haskell', version: 'GHC 9.4', aliases: ['hs'], extension: '.hs' },
  { id: 'lua', name: 'Lua', version: '5.4', aliases: [], extension: '.lua' },
  { id: 'perl', name: 'Perl', version: '5.38', aliases: ['pl'], extension: '.pl' },
  { id: 'r', name: 'R', version: '4.3', aliases: ['rlang'], extension: '.r' },
  { id: 'julia', name: 'Julia', version: '1.9', aliases: ['jl'], extension: '.jl' },
  { id: 'elixir', name: 'Elixir', version: '1.15', aliases: ['ex'], extension: '.ex' },
  { id: 'erlang', name: 'Erlang', version: 'OTP 26', aliases: ['erl'], extension: '.erl' },
  { id: 'clojure', name: 'Clojure', version: '1.11', aliases: ['clj'], extension: '.clj' },
  { id: 'dart', name: 'Dart', version: '3.1', aliases: [], extension: '.dart' },
  { id: 'bash', name: 'Bash', version: '5.2', aliases: ['sh', 'shell'], extension: '.sh' },
  { id: 'powershell', name: 'PowerShell', version: '7.3', aliases: ['ps1', 'pwsh'], extension: '.ps1' },
  { id: 'sql', name: 'SQL', version: 'SQLite 3', aliases: ['sqlite'], extension: '.sql' },
];

/**
 * Get language info by ID or alias
 */
export function getLanguageInfo(language: string): LanguageInfo | undefined {
  const normalized = language.toLowerCase().trim();
  return SUPPORTED_LANGUAGES.find(
    lang => lang.id === normalized || lang.aliases.includes(normalized)
  );
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return getLanguageInfo(language) !== undefined;
}
