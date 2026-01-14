/**
 * Local Workspace Provider
 * 
 * Executes code directly on the server using child_process.
 * Suitable for development and testing.
 */

import { promises as fs } from "fs";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import { 
  EnhancedWorkspaceProvider, 
  ExecuteResult, 
  CodeExecuteOptions,
  PackageManager,
  getLanguageInfo,
} from "./provider";

const execAsync = promisify(exec);

export class LocalWorkspace implements EnhancedWorkspaceProvider {
  type = "local" as const;
  name = "Local Execution";
  supportedLanguages = ['python', 'javascript', 'typescript', 'ruby', 'php', 'perl', 'lua', 'bash', 'r'];
  supportsPackageManagement = true;

  async connect(): Promise<void> {
    // No-op for local
  }

  async disconnect(): Promise<void> {
    // No-op for local
  }

  async isAvailable(): Promise<boolean> {
    return true; // Local is always available
  }

  // File operations
  async readFile(path: string): Promise<string> {
    return fs.readFile(path, "utf-8");
  }

  async writeFile(path: string, content: string): Promise<void> {
    return fs.writeFile(path, content, "utf-8");
  }

  async deleteFile(path: string): Promise<void> {
    return fs.unlink(path);
  }

  async listDir(path: string): Promise<string[]> {
    return fs.readdir(path);
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  // Process execution
  async execute(
    command: string, 
    args: string[],
    options?: { cwd?: string; env?: Record<string, string>; timeout?: number; stdin?: string }
  ): Promise<ExecuteResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        env: { ...process.env, ...options?.env },
        timeout: (options?.timeout || 30) * 1000,
      });

      let stdout = '';
      let stderr = '';

      if (options?.stdin && child.stdin) {
        child.stdin.write(options.stdin);
        child.stdin.end();
      }

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code, signal) => {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
          signal: signal || undefined,
          timedOut: signal === 'SIGTERM',
          executionTime: Date.now() - startTime,
        });
      });

      child.on('error', (error) => {
        resolve({
          stdout,
          stderr: error.message,
          exitCode: 1,
          executionTime: Date.now() - startTime,
        });
      });
    });
  }

  async executeCode(code: string, language: string, options?: CodeExecuteOptions): Promise<ExecuteResult> {
    const startTime = Date.now();
    const langInfo = getLanguageInfo(language);
    const langId = langInfo?.id || language.toLowerCase();

    const execInfo = this.getExecutionCommand(langId, code);
    if (!execInfo) {
      return {
        stdout: '',
        stderr: `Cannot execute ${language} code directly. Use a compiled language workspace.`,
        exitCode: 1,
        executionTime: Date.now() - startTime,
      };
    }

    return this.execute(execInfo.command, execInfo.args, {
      cwd: options?.cwd,
      env: options?.env,
      timeout: options?.timeout,
      stdin: options?.stdin,
    });
  }

  // Package management
  async installPackage(
    manager: PackageManager, 
    packageName: string, 
    version?: string
  ): Promise<ExecuteResult> {
    const command = this.getPackageInstallCommand(manager, packageName, version);
    if (!command) {
      return {
        stdout: '',
        stderr: `Package manager '${manager}' not supported`,
        exitCode: 1,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 120000 });
      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  async listPackages(manager: PackageManager): Promise<string[]> {
    const command = this.getPackageListCommand(manager);
    if (!command) return [];

    try {
      const { stdout } = await execAsync(command);
      return stdout.split('\n').filter(line => line.trim());
    } catch {
      return [];
    }
  }

  // Helper methods
  private getExecutionCommand(language: string, code: string): { command: string; args: string[] } | null {
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

  private getPackageInstallCommand(
    manager: PackageManager, 
    packageName: string, 
    version?: string
  ): string | null {
    const pkg = version ? `${packageName}==${version}` : packageName;
    
    switch (manager) {
      case 'pip':
        return `pip install ${pkg}`;
      case 'npm':
        return `npm install ${version ? `${packageName}@${version}` : packageName}`;
      case 'yarn':
        return `yarn add ${version ? `${packageName}@${version}` : packageName}`;
      case 'pnpm':
        return `pnpm add ${version ? `${packageName}@${version}` : packageName}`;
      case 'cargo':
        return `cargo add ${packageName}${version ? `@${version}` : ''}`;
      case 'go':
        return `go get ${packageName}${version ? `@${version}` : ''}`;
      case 'gem':
        return `gem install ${packageName}${version ? ` -v ${version}` : ''}`;
      case 'composer':
        return `composer require ${packageName}${version ? `:${version}` : ''}`;
      default:
        return null;
    }
  }

  private getPackageListCommand(manager: PackageManager): string | null {
    switch (manager) {
      case 'pip':
        return 'pip list --format=freeze';
      case 'npm':
        return 'npm list --depth=0';
      case 'yarn':
        return 'yarn list --depth=0';
      case 'pnpm':
        return 'pnpm list --depth=0';
      case 'cargo':
        return 'cargo tree --depth=1';
      case 'go':
        return 'go list -m all';
      case 'gem':
        return 'gem list';
      case 'composer':
        return 'composer show';
      default:
        return null;
    }
  }
}
