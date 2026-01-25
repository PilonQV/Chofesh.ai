/**
 * Piston Workspace Provider
 * 
 * Uses the Piston code execution engine for secure, isolated code execution.
 * Supports 60+ programming languages with Docker-based isolation.
 */

import { 
  WorkspaceProvider, 
  EnhancedWorkspaceProvider,
  ExecuteResult, 
  CodeExecuteOptions,
  getLanguageInfo,
} from "./provider";

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

export class PistonWorkspace implements EnhancedWorkspaceProvider {
  type = "piston" as const;
  name = "Piston Code Execution";
  supportedLanguages = Object.keys(PISTON_LANGUAGES);
  supportsPackageManagement = false;

  private files: Map<string, string> = new Map();
  private availabilityCache: { available: boolean; checkedAt: number } | null = null;
  private readonly CACHE_TTL = 60000; // 1 minute

  async connect(): Promise<void> {
    console.log('[PistonWorkspace] Connected');
  }

  async disconnect(): Promise<void> {
    this.files.clear();
    console.log('[PistonWorkspace] Disconnected');
  }

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

  // File operations (in-memory for Piston)
  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (!content) throw new Error(`File not found: ${path}`);
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(path);
  }

  async listDir(path: string): Promise<string[]> {
    const files: string[] = [];
    for (const filePath of Array.from(this.files.keys())) {
      if (filePath.startsWith(path) || path === '/') {
        files.push(filePath);
      }
    }
    return files;
  }

  async fileExists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  // Process execution
  async execute(command: string, args: string[]): Promise<ExecuteResult> {
    // For Piston, we interpret the command as bash
    const code = `${command} ${args.join(' ')}`;
    return this.executeCode(code, 'bash');
  }

  async executeCode(code: string, language: string, options?: CodeExecuteOptions): Promise<ExecuteResult> {
    const startTime = Date.now();

    try {
      const langInfo = getLanguageInfo(language);
      const langId = langInfo?.id || language.toLowerCase();
      const pistonLang = PISTON_LANGUAGES[langId];

      if (!pistonLang) {
        return {
          stdout: '',
          stderr: `Language '${language}' not supported by Piston. Supported: ${Object.keys(PISTON_LANGUAGES).join(', ')}`,
          exitCode: 1,
          executionTime: Date.now() - startTime,
        };
      }

      // Prepare files for Piston
      const extension = this.getFileExtension(langId);
      const files = [{ name: `main${extension}`, content: code }];

      // Call Piston API
      const response = await fetch(`${PISTON_API_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonLang.language,
          version: options?.version || pistonLang.version,
          files,
          stdin: options?.stdin || '',
          compile_timeout: 10000,
          run_timeout: (options?.timeout || 30) * 1000,
          compile_memory_limit: -1,
          run_memory_limit: (options?.memoryLimit || 256) * 1024 * 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          stdout: '',
          stderr: `Piston API error: ${response.status} ${response.statusText} - ${errorText}`,
          exitCode: 1,
          executionTime: Date.now() - startTime,
        };
      }

      const result = await response.json();

      // Handle compilation errors
      if (result.compile && result.compile.code !== 0) {
        return {
          stdout: result.compile.stdout || '',
          stderr: result.compile.stderr || result.compile.output || 'Compilation failed',
          exitCode: result.compile.code,
          executionTime: Date.now() - startTime,
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
          timedOut: true,
          executionTime: Date.now() - startTime,
        };
      }

      return {
        stdout,
        stderr,
        exitCode,
        signal: run.signal,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        executionTime: Date.now() - startTime,
      };
    }
  }

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

  /**
   * Get available runtimes from Piston
   */
  async getRuntimes(): Promise<Array<{ language: string; version: string; aliases: string[] }>> {
    try {
      const response = await fetch(`${PISTON_API_URL}/runtimes`);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }
}
