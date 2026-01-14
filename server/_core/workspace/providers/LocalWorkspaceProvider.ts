/**
 * Local Workspace Provider
 * 
 * Executes code directly on the server using child_process.
 * Suitable for development and testing, NOT recommended for production
 * with untrusted code due to security concerns.
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
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
  SUPPORTED_LANGUAGES,
} from '../types';
import { BaseWorkspace } from '../BaseWorkspace';

const execAsync = promisify(exec);

// ============================================================================
// Local Workspace Implementation
// ============================================================================

class LocalWorkspace extends BaseWorkspace {
  private workDir: string;
  private initialized: boolean = false;

  constructor(config: WorkspaceConfig) {
    super('local', config);
    this.workDir = path.join(os.tmpdir(), 'chofesh-workspace', this.id);
  }

  async start(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create workspace directory
      await fs.mkdir(this.workDir, { recursive: true });
      
      // Pre-install packages if specified
      if (this.config.packages) {
        for (const pkg of this.config.packages) {
          await this.installPackage(pkg);
        }
      }

      this.initialized = true;
      this.setStatus('active');
      console.log(`[LocalWorkspace] Started workspace ${this.id} at ${this.workDir}`);
    } catch (error) {
      this.setStatus('error');
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.setStatus('stopped');
    console.log(`[LocalWorkspace] Stopped workspace ${this.id}`);
  }

  async destroy(): Promise<void> {
    try {
      // Remove workspace directory
      await fs.rm(this.workDir, { recursive: true, force: true });
      this.setStatus('destroyed');
      console.log(`[LocalWorkspace] Destroyed workspace ${this.id}`);
    } catch (error) {
      console.error(`[LocalWorkspace] Error destroying workspace ${this.id}:`, error);
    }
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  async readFile(filePath: string): Promise<FileReadResult> {
    this.updateActivity();
    const fullPath = this.resolvePath(filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return { content, encoding: 'utf-8' };
  }

  async writeFile(request: FileWriteRequest): Promise<void> {
    this.updateActivity();
    const fullPath = this.resolvePath(request.path);
    
    if (request.createDirs) {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
    }
    
    const content = request.encoding === 'base64' 
      ? Buffer.from(request.content, 'base64').toString('utf-8')
      : request.content;
    
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async listFiles(dirPath: string): Promise<FileInfo[]> {
    this.updateActivity();
    const fullPath = this.resolvePath(dirPath);
    
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const files: FileInfo[] = [];
      
      for (const entry of entries) {
        const filePath = path.join(dirPath, entry.name);
        const stat = await fs.stat(path.join(fullPath, entry.name));
        
        files.push({
          name: entry.name,
          path: filePath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stat.size,
          modifiedAt: stat.mtime,
        });
      }
      
      return files;
    } catch {
      return [];
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    this.updateActivity();
    const fullPath = this.resolvePath(filePath);
    await fs.rm(fullPath, { recursive: true, force: true });
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Code Execution
  // ============================================================================

  async execute(request: ExecuteRequest): Promise<ExecuteResult> {
    this.updateActivity();
    const startTime = Date.now();

    try {
      const langInfo = getLanguageInfo(request.language);
      if (!langInfo) {
        return this.createErrorResult(`Unsupported language: ${request.language}`, Date.now() - startTime);
      }

      // Write any files needed for execution
      if (request.files) {
        for (const file of request.files) {
          await this.writeFile(file);
        }
      }

      // Get execution command
      const execInfo = this.getExecutionInfo(langInfo.id, request.code);
      if (!execInfo) {
        return this.createErrorResult(`Cannot execute ${langInfo.name} code directly`, Date.now() - startTime);
      }

      // Execute the command
      const result = await this.runCommand(
        execInfo.command,
        execInfo.args,
        {
          cwd: request.workingDir ? this.resolvePath(request.workingDir) : this.workDir,
          env: { ...process.env, ...this.config.env, ...request.env },
          timeout: (request.timeout || this.config.timeout || 30) * 1000,
          stdin: request.stdin,
        }
      );

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        status: result.exitCode === 0 ? 'success' : 'error',
        executionTime: Date.now() - startTime,
        output: result.stdout + (result.stderr ? `\n${result.stderr}` : ''),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('TIMEOUT')) {
        return {
          stdout: '',
          stderr: 'Execution timed out',
          exitCode: 124,
          status: 'timeout',
          executionTime: Date.now() - startTime,
        };
      }
      
      return this.createErrorResult(errorMessage, Date.now() - startTime);
    }
  }

  async executeStream(
    request: ExecuteRequest,
    onOutput: (output: TerminalOutput) => void
  ): Promise<ExecuteResult> {
    this.updateActivity();
    const startTime = Date.now();

    try {
      const langInfo = getLanguageInfo(request.language);
      if (!langInfo) {
        const error = `Unsupported language: ${request.language}`;
        onOutput({ type: 'stderr', data: error, timestamp: new Date() });
        return this.createErrorResult(error, Date.now() - startTime);
      }

      const execInfo = this.getExecutionInfo(langInfo.id, request.code);
      if (!execInfo) {
        const error = `Cannot execute ${langInfo.name} code directly`;
        onOutput({ type: 'stderr', data: error, timestamp: new Date() });
        return this.createErrorResult(error, Date.now() - startTime);
      }

      return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let exitCode: number | null = null;

        const child = spawn(execInfo.command, execInfo.args, {
          cwd: request.workingDir ? this.resolvePath(request.workingDir) : this.workDir,
          env: { ...process.env, ...this.config.env, ...request.env },
          timeout: (request.timeout || this.config.timeout || 30) * 1000,
        });

        if (request.stdin && child.stdin) {
          child.stdin.write(request.stdin);
          child.stdin.end();
        }

        child.stdout?.on('data', (data) => {
          const text = data.toString();
          stdout += text;
          onOutput({ type: 'stdout', data: text, timestamp: new Date() });
        });

        child.stderr?.on('data', (data) => {
          const text = data.toString();
          stderr += text;
          onOutput({ type: 'stderr', data: text, timestamp: new Date() });
        });

        child.on('close', (code) => {
          exitCode = code;
          onOutput({ type: 'exit', data: String(code ?? 0), timestamp: new Date() });
          
          resolve({
            stdout,
            stderr,
            exitCode,
            status: code === 0 ? 'success' : 'error',
            executionTime: Date.now() - startTime,
            output: stdout + (stderr ? `\n${stderr}` : ''),
          });
        });

        child.on('error', (error) => {
          onOutput({ type: 'stderr', data: error.message, timestamp: new Date() });
          resolve(this.createErrorResult(error.message, Date.now() - startTime));
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onOutput({ type: 'stderr', data: errorMessage, timestamp: new Date() });
      return this.createErrorResult(errorMessage, Date.now() - startTime);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private resolvePath(filePath: string): string {
    // Prevent path traversal attacks
    const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.workDir, normalized);
  }

  private getExecutionInfo(language: string, code: string): { command: string; args: string[] } | null {
    switch (language) {
      case 'python':
        return { command: 'python3', args: ['-c', code] };
      case 'javascript':
        return { command: 'node', args: ['-e', code] };
      case 'typescript':
        return { command: 'npx', args: ['ts-node', '-e', code] };
      case 'ruby':
        return { command: 'ruby', args: ['-e', code] };
      case 'php':
        return { command: 'php', args: ['-r', code] };
      case 'perl':
        return { command: 'perl', args: ['-e', code] };
      case 'lua':
        return { command: 'lua', args: ['-e', code] };
      case 'bash':
        return { command: 'bash', args: ['-c', code] };
      case 'r':
        return { command: 'Rscript', args: ['-e', code] };
      default:
        return null;
    }
  }

  private async runCommand(
    command: string,
    args: string[],
    options: {
      cwd?: string;
      env?: NodeJS.ProcessEnv;
      timeout?: number;
      stdin?: string;
    }
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env,
        timeout: options.timeout,
      });

      let stdout = '';
      let stderr = '';

      if (options.stdin && child.stdin) {
        child.stdin.write(options.stdin);
        child.stdin.end();
      }

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// ============================================================================
// Local Workspace Provider
// ============================================================================

export class LocalWorkspaceProvider implements IWorkspaceProvider {
  readonly type: WorkspaceType = 'local';
  readonly name = 'Local Execution';
  readonly supportedLanguages = ['python', 'javascript', 'typescript', 'ruby', 'php', 'perl', 'lua', 'bash', 'r'];
  readonly supportsPackageManagement = true;
  readonly supportsFileSystem = true;
  readonly supportsTerminal = true;

  private workspaces: Map<string, LocalWorkspace> = new Map();

  async isAvailable(): Promise<boolean> {
    // Local provider is always available
    return true;
  }

  async create(config: WorkspaceConfig): Promise<IWorkspace> {
    const workspace = new LocalWorkspace(config);
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  async get(workspaceId: string): Promise<IWorkspace | null> {
    return this.workspaces.get(workspaceId) || null;
  }

  async list(): Promise<WorkspaceInfo[]> {
    const infos: WorkspaceInfo[] = [];
    for (const workspace of this.workspaces.values()) {
      infos.push(await workspace.getInfo());
    }
    return infos;
  }

  async cleanup(): Promise<void> {
    for (const workspace of this.workspaces.values()) {
      try {
        await workspace.destroy();
      } catch (error) {
        console.error(`[LocalWorkspaceProvider] Error destroying workspace:`, error);
      }
    }
    this.workspaces.clear();
  }
}
