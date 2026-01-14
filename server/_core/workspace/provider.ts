/**
 * Workspace Provider Interfaces
 * 
 * Defines the contract for workspace implementations that support
 * file system operations, process execution, and package management.
 */

export type WorkspaceType = "local" | "docker" | "remote" | "piston";

export type PackageManager = "pip" | "npm" | "yarn" | "pnpm" | "cargo" | "go" | "gem" | "composer";

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal?: string;
  timedOut?: boolean;
  executionTime?: number;
}

export interface FileInfo {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
}

export interface FileSystemProvider {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listDir(path: string): Promise<string[]>;
  fileExists?(path: string): Promise<boolean>;
}

export interface ProcessProvider {
  execute(command: string, args: string[], options?: ExecuteOptions): Promise<ExecuteResult>;
  executeCode?(code: string, language: string, options?: CodeExecuteOptions): Promise<ExecuteResult>;
}

export interface ExecuteOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number; // seconds
  stdin?: string;
}

export interface CodeExecuteOptions extends ExecuteOptions {
  version?: string;
  memoryLimit?: number; // MB
}

export interface PackageProvider {
  installPackage(manager: PackageManager, packageName: string, version?: string): Promise<ExecuteResult>;
  listPackages?(manager: PackageManager): Promise<string[]>;
}

export interface WorkspaceProvider extends FileSystemProvider, ProcessProvider {
  type: WorkspaceType;
  name: string;
  supportedLanguages?: string[];
  supportsPackageManagement?: boolean;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isAvailable?(): Promise<boolean>;
}

export interface EnhancedWorkspaceProvider extends WorkspaceProvider, Partial<PackageProvider> {
  executeCode(code: string, language: string, options?: CodeExecuteOptions): Promise<ExecuteResult>;
}

/**
 * Language information for code execution
 */
export interface LanguageInfo {
  id: string;
  name: string;
  version?: string;
  aliases: string[];
  extension: string;
  packageManager?: PackageManager;
}

/**
 * Supported languages with their configurations
 */
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
  { id: 'csharp', name: 'C#', version: '.NET 7', aliases: ['cs', 'c#'], extension: '.cs' },
  { id: 'fsharp', name: 'F#', version: '.NET 7', aliases: ['fs', 'f#'], extension: '.fs' },
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
