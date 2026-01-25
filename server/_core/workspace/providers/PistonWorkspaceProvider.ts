/**
 * Piston Workspace Provider
 * 
 * Uses the Piston code execution engine for secure, isolated code execution.
 * Supports 60+ programming languages with Docker-based isolation.
 * 
 * Can use:
 * - Self-hosted Piston instance (recommended for production)
 * - Public Piston API (rate limited to 5 req/sec)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  IWorkspaceProvider,
  IWorkspace,
  WorkspaceType,
  WorkspaceConfig,
  WorkspaceInfo,
  FileInfo,
  FileReadResult,
  FileWriteRequest,
  ExecuteRequest,
  ExecuteResult,
  TerminalOutput,
  PackageInstallRequest,
  PackageInstallResult,
  PackageManager,
  getLanguageInfo,
} from '../types';
import { BaseWorkspace } from '../BaseWorkspace';

// Piston API configuration
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

// Piston language version mapping
const PISTON_LANGUAGES: Record<string, { language: string; version: string }> = {
  'python': { language: 'python', version: '3.10.0' },
  'javascript': { language: 'javascript', version: '18.15.0' },
  'typescript': { language: 'typescript', version: '5.0.3' },
  'java': { language: 'java', version: '15.0.2' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'c': { language: 'c', version: '10.2.0' },
  'go': { language: 'go', version: '1.16.2' },
  'rust': { language: 'rust', version: '1.68.2' },
  'ruby': { language: 'ruby', version: '3.0.1' },
  'php': { language: 'php', version: '8.2.3' },
  'kotlin': { language: 'kotlin', version: '1.8.20' },
  'swift': { language: 'swift', version: '5.3.3' },
  'scala': { language: 'scala', version: '3.2.2' },
  'haskell': { language: 'haskell', version: '9.0.1' },
  'lua': { language: 'lua', version: '5.4.4' },
  'perl': { language: 'perl', version: '5.36.0' },
  'r': { language: 'rscript', version: '4.1.1' },
  'julia': { language: 'julia', version: '1.8.5' },
  'elixir': { language: 'elixir', version: '1.11.3' },
  'erlang': { language: 'erlang', version: '23.0' },
  'clojure': { language: 'clojure', version: '1.10.3' },
  'dart': { language: 'dart', version: '2.19.6' },
  'bash': { language: 'bash', version: '5.2.0' },
  'powershell': { language: 'powershell', version: '7.1.4' },
  'sql': { language: 'sqlite3', version: '3.36.0' },
  'csharp': { language: 'csharp.net', version: '5.0.201' },
  'fsharp': { language: 'fsharp.net', version: '5.0.201' },
  'cobol': { language: 'cobol', version: '3.1.2' },
  'fortran': { language: 'fortran', version: '10.2.0' },
  'pascal': { language: 'pascal', version: '3.2.2' },
  'nim': { language: 'nim', version: '1.6.2' },
  'crystal': { language: 'crystal', version: '1.0.0' },
  'zig': { language: 'zig', version: '0.10.1' },
  'ocaml': { language: 'ocaml', version: '4.12.0' },
  'racket': { language: 'racket', version: '8.3' },
  'prolog': { language: 'prolog', version: '8.2.4' },
  'lisp': { language: 'lisp', version: '2.1.2' },
};

// ============================================================================
// Piston Workspace Implementation
// ============================================================================

class PistonWorkspace extends BaseWorkspace {
  private files: Map<string, string> = new Map();

  constructor(config: WorkspaceConfig) {
    super('piston', config);
  }

  async start(): Promise<void> {
    this.setStatus('active');
    console.log(`[PistonWorkspace] Started workspace ${this.id}`);
  }

  async stop(): Promise<void> {
    this.setStatus('stopped');
    console.log(`[PistonWorkspace] Stopped workspace ${this.id}`);
  }

  async destroy(): Promise<void> {
    this.files.clear();
    this.setStatus('destroyed');
    console.log(`[PistonWorkspace] Destroyed workspace ${this.id}`);
  }

  // ============================================================================
  // File Operations (in-memory for Piston)
  // ============================================================================

  async readFile(path: string): Promise<FileReadResult> {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    return { content, encoding: 'utf-8' };
  }

  async writeFile(request: FileWriteRequest): Promise<void> {
    this.files.set(request.path, request.content);
  }

  async listFiles(path: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    for (const [filePath, content] of this.files) {
      if (filePath.startsWith(path) || path === '/') {
        files.push({
          name: filePath.split('/').pop() || filePath,
          path: filePath,
          type: 'file',
          size: content.length,
        });
      }
    }
    return files;
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(path);
  }

  async fileExists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  // ============================================================================
  // Code Execution
  // ============================================================================

  async execute(request: ExecuteRequest): Promise<ExecuteResult> {
    this.updateActivity();
    const startTime = Date.now();

    try {
      const langInfo = getLanguageInfo(request.language);
      const langId = langInfo?.id || request.language.toLowerCase();
      const pistonLang = PISTON_LANGUAGES[langId];

      if (!pistonLang) {
        return this.createErrorResult(
          `Language '${request.language}' not supported by Piston. Supported: ${Object.keys(PISTON_LANGUAGES).join(', ')}`,
          Date.now() - startTime
        );
      }

      // Prepare files for Piston
      const files: Array<{ name: string; content: string }> = [];
      
      // Main code file
      const extension = this.getFileExtension(langId);
      files.push({
        name: `main${extension}`,
        content: request.code,
      });

      // Add any additional files
      if (request.files) {
        for (const file of request.files) {
          files.push({
            name: file.path,
            content: file.content,
          });
        }
      }

      // Call Piston API
      const response = await fetch(`${PISTON_API_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLang.language,
          version: pistonLang.version,
          files,
          stdin: request.stdin || '',
          args: request.args || [],
          compile_timeout: 10000,
          run_timeout: (request.timeout || 30) * 1000,
          compile_memory_limit: -1,
          run_memory_limit: (request.memoryLimit || 256) * 1024 * 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return this.createErrorResult(
          `Piston API error: ${response.status} ${response.statusText} - ${errorText}`,
          Date.now() - startTime
        );
      }

      const result = await response.json();

      // Handle compilation errors
      if (result.compile && result.compile.code !== 0) {
        return {
          stdout: result.compile.stdout || '',
          stderr: result.compile.stderr || result.compile.output || 'Compilation failed',
          exitCode: result.compile.code,
          status: 'error',
          executionTime: Date.now() - startTime,
          output: result.compile.output || result.compile.stderr,
        };
      }

      // Handle runtime results
      const run = result.run || {};
      const stdout = run.stdout || '';
      const stderr = run.stderr || '';
      const exitCode = run.code ?? 0;

      // Check for timeout
      if (run.signal === 'SIGKILL' || run.signal === 'SIGTERM') {
        return {
          stdout,
          stderr,
          exitCode: 124,
          signal: run.signal,
          status: 'timeout',
          executionTime: Date.now() - startTime,
          output: stdout + stderr,
        };
      }

      return {
        stdout,
        stderr,
        exitCode,
        signal: run.signal,
        status: exitCode === 0 ? 'success' : 'error',
        executionTime: Date.now() - startTime,
        output: run.output || stdout + stderr,
      };
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error',
        Date.now() - startTime
      );
    }
  }

  // ============================================================================
  // Package Management (not supported by Piston)
  // ============================================================================

  async installPackage(request: PackageInstallRequest): Promise<PackageInstallResult> {
    return {
      success: false,
      package: request.name,
      error: 'Package installation not supported by Piston. Use Docker or E2B for package management.',
    };
  }

  async listPackages(manager: PackageManager): Promise<string[]> {
    return [];
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      'python': '.py',
      'javascript': '.js',
      'typescript': '.ts',
      'java': '.java',
      'cpp': '.cpp',
      'c': '.c',
      'go': '.go',
      'rust': '.rs',
      'ruby': '.rb',
      'php': '.php',
      'kotlin': '.kt',
      'swift': '.swift',
      'scala': '.scala',
      'haskell': '.hs',
      'lua': '.lua',
      'perl': '.pl',
      'r': '.r',
      'julia': '.jl',
      'elixir': '.ex',
      'erlang': '.erl',
      'clojure': '.clj',
      'dart': '.dart',
      'bash': '.sh',
      'powershell': '.ps1',
      'sql': '.sql',
      'csharp': '.cs',
      'fsharp': '.fs',
    };
    return extensions[language] || '.txt';
  }
}

// ============================================================================
// Piston Workspace Provider
// ============================================================================

export class PistonWorkspaceProvider implements IWorkspaceProvider {
  readonly type: WorkspaceType = 'piston';
  readonly name = 'Piston Code Execution';
  readonly supportedLanguages = Object.keys(PISTON_LANGUAGES);
  readonly supportsPackageManagement = false;
  readonly supportsFileSystem = true; // In-memory only
  readonly supportsTerminal = false;

  private workspaces: Map<string, PistonWorkspace> = new Map();
  private availabilityCache: { available: boolean; checkedAt: number } | null = null;
  private readonly CACHE_TTL = 60000; // 1 minute

  async isAvailable(): Promise<boolean> {
    // Check cache
    if (this.availabilityCache && Date.now() - this.availabilityCache.checkedAt < this.CACHE_TTL) {
      return this.availabilityCache.available;
    }

    try {
      const response = await fetch(`${PISTON_API_URL}/runtimes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const available = response.ok;
      this.availabilityCache = { available, checkedAt: Date.now() };
      return available;
    } catch {
      this.availabilityCache = { available: false, checkedAt: Date.now() };
      return false;
    }
  }

  async create(config: WorkspaceConfig): Promise<IWorkspace> {
    const workspace = new PistonWorkspace(config);
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  async get(workspaceId: string): Promise<IWorkspace | null> {
    return this.workspaces.get(workspaceId) || null;
  }

  async list(): Promise<WorkspaceInfo[]> {
    const infos: WorkspaceInfo[] = [];
    for (const workspace of Array.from(this.workspaces.values())) {
      infos.push(await workspace.getInfo());
    }
    return infos;
  }

  async cleanup(): Promise<void> {
    for (const workspace of Array.from(this.workspaces.values())) {
      try {
        await workspace.destroy();
      } catch (error) {
        console.error(`[PistonWorkspaceProvider] Error destroying workspace:`, error);
      }
    }
    this.workspaces.clear();
  }

  /**
   * Get available runtimes from Piston
   */
  async getRuntimes(): Promise<Array<{ language: string; version: string; aliases: string[] }>> {
    try {
      const response = await fetch(`${PISTON_API_URL}/runtimes`);
      if (!response.ok) {
        return [];
      }
      return await response.json();
    } catch {
      return [];
    }
  }
}
