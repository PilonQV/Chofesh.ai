/**
 * Base Workspace Class
 * 
 * Provides common functionality for all workspace implementations.
 * Specific providers extend this class and implement abstract methods.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  IWorkspace,
  WorkspaceType,
  WorkspaceStatus,
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
} from './types';

export abstract class BaseWorkspace implements IWorkspace {
  readonly id: string;
  readonly type: WorkspaceType;
  protected _status: WorkspaceStatus;
  readonly config: WorkspaceConfig;
  protected createdAt: Date;
  protected lastActivityAt: Date;

  constructor(type: WorkspaceType, config: WorkspaceConfig) {
    this.id = uuidv4();
    this.type = type;
    this._status = 'creating';
    this.config = config;
    this.createdAt = new Date();
    this.lastActivityAt = new Date();
  }

  get status(): WorkspaceStatus {
    return this._status;
  }

  protected updateActivity(): void {
    this.lastActivityAt = new Date();
  }

  protected setStatus(status: WorkspaceStatus): void {
    this._status = status;
  }

  // ============================================================================
  // Lifecycle Methods (must be implemented by subclasses)
  // ============================================================================

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract destroy(): Promise<void>;

  async getInfo(): Promise<WorkspaceInfo> {
    return {
      id: this.id,
      type: this.type,
      status: this._status,
      createdAt: this.createdAt,
      lastActivityAt: this.lastActivityAt,
      config: this.config,
    };
  }

  // ============================================================================
  // File Operations (must be implemented by subclasses)
  // ============================================================================

  abstract readFile(path: string): Promise<FileReadResult>;
  abstract writeFile(request: FileWriteRequest): Promise<void>;
  abstract listFiles(path: string): Promise<FileInfo[]>;
  abstract deleteFile(path: string): Promise<void>;
  abstract fileExists(path: string): Promise<boolean>;

  // ============================================================================
  // Code Execution (must be implemented by subclasses)
  // ============================================================================

  abstract execute(request: ExecuteRequest): Promise<ExecuteResult>;

  /**
   * Execute code with streaming output
   * Default implementation calls execute() and returns result
   * Subclasses can override for real streaming support
   */
  async executeStream(
    request: ExecuteRequest,
    onOutput: (output: TerminalOutput) => void
  ): Promise<ExecuteResult> {
    const result = await this.execute(request);
    
    // Emit stdout
    if (result.stdout) {
      onOutput({
        type: 'stdout',
        data: result.stdout,
        timestamp: new Date(),
      });
    }
    
    // Emit stderr
    if (result.stderr) {
      onOutput({
        type: 'stderr',
        data: result.stderr,
        timestamp: new Date(),
      });
    }
    
    // Emit exit
    onOutput({
      type: 'exit',
      data: String(result.exitCode ?? 0),
      timestamp: new Date(),
    });
    
    return result;
  }

  // ============================================================================
  // Package Management (default implementations, can be overridden)
  // ============================================================================

  async installPackage(request: PackageInstallRequest): Promise<PackageInstallResult> {
    const command = this.getPackageInstallCommand(request);
    if (!command) {
      return {
        success: false,
        package: request.name,
        error: `Package manager '${request.manager}' not supported`,
      };
    }

    try {
      const result = await this.execute({
        code: command,
        language: 'bash',
        timeout: 120, // 2 minutes for package installation
      });

      return {
        success: result.exitCode === 0,
        package: request.name,
        version: request.version,
        output: result.output,
        error: result.exitCode !== 0 ? result.stderr : undefined,
      };
    } catch (error) {
      return {
        success: false,
        package: request.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async listPackages(manager: PackageManager): Promise<string[]> {
    const command = this.getPackageListCommand(manager);
    if (!command) {
      return [];
    }

    try {
      const result = await this.execute({
        code: command,
        language: 'bash',
        timeout: 30,
      });

      if (result.exitCode === 0) {
        return result.stdout.split('\n').filter(line => line.trim());
      }
      return [];
    } catch {
      return [];
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  protected getPackageInstallCommand(request: PackageInstallRequest): string | null {
    const pkg = request.version ? `${request.name}==${request.version}` : request.name;
    
    switch (request.manager) {
      case 'pip':
        return `pip install ${pkg}`;
      case 'npm':
        return `npm install ${request.version ? `${request.name}@${request.version}` : request.name}`;
      case 'yarn':
        return `yarn add ${request.version ? `${request.name}@${request.version}` : request.name}`;
      case 'pnpm':
        return `pnpm add ${request.version ? `${request.name}@${request.version}` : request.name}`;
      case 'cargo':
        return `cargo add ${request.name}${request.version ? `@${request.version}` : ''}`;
      case 'go':
        return `go get ${request.name}${request.version ? `@${request.version}` : ''}`;
      case 'gem':
        return `gem install ${request.name}${request.version ? ` -v ${request.version}` : ''}`;
      case 'composer':
        return `composer require ${request.name}${request.version ? `:${request.version}` : ''}`;
      default:
        return null;
    }
  }

  protected getPackageListCommand(manager: PackageManager): string | null {
    switch (manager) {
      case 'pip':
        return 'pip list --format=freeze';
      case 'npm':
        return 'npm list --depth=0 --json';
      case 'yarn':
        return 'yarn list --depth=0 --json';
      case 'pnpm':
        return 'pnpm list --depth=0 --json';
      case 'cargo':
        return 'cargo tree --depth=1';
      case 'go':
        return 'go list -m all';
      case 'gem':
        return 'gem list';
      case 'composer':
        return 'composer show --format=json';
      default:
        return null;
    }
  }

  protected getExecutionCommand(request: ExecuteRequest): { command: string; args: string[] } | null {
    const langInfo = getLanguageInfo(request.language);
    if (!langInfo) {
      return null;
    }

    switch (langInfo.id) {
      case 'python':
        return { command: 'python3', args: ['-c', request.code] };
      case 'javascript':
        return { command: 'node', args: ['-e', request.code] };
      case 'typescript':
        return { command: 'npx', args: ['ts-node', '-e', request.code] };
      case 'ruby':
        return { command: 'ruby', args: ['-e', request.code] };
      case 'php':
        return { command: 'php', args: ['-r', request.code] };
      case 'perl':
        return { command: 'perl', args: ['-e', request.code] };
      case 'lua':
        return { command: 'lua', args: ['-e', request.code] };
      case 'bash':
        return { command: 'bash', args: ['-c', request.code] };
      case 'powershell':
        return { command: 'pwsh', args: ['-Command', request.code] };
      default:
        // For compiled languages, we need to write to file first
        return null;
    }
  }

  protected createErrorResult(error: string, executionTime: number = 0): ExecuteResult {
    return {
      stdout: '',
      stderr: error,
      exitCode: 1,
      status: 'error',
      executionTime,
      output: error,
    };
  }

  protected createSuccessResult(stdout: string, stderr: string, executionTime: number): ExecuteResult {
    return {
      stdout,
      stderr,
      exitCode: 0,
      status: 'success',
      executionTime,
      output: stdout + (stderr ? `\n${stderr}` : ''),
    };
  }
}
