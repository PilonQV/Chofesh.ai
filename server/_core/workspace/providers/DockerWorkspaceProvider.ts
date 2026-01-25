/**
 * Docker Workspace Provider
 * 
 * Executes code in isolated Docker containers with full control over
 * the execution environment, packages, and resources.
 * 
 * Features:
 * - Custom Docker images for specific language environments
 * - Package management support
 * - Persistent file system within container
 * - Resource limits (CPU, memory)
 * - Network isolation
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
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

const execAsync = promisify(exec);

// Default Docker images for each language
const DOCKER_IMAGES: Record<string, string> = {
  'python': 'python:3.11-slim',
  'javascript': 'node:20-slim',
  'typescript': 'node:20-slim',
  'java': 'openjdk:17-slim',
  'cpp': 'gcc:12',
  'c': 'gcc:12',
  'go': 'golang:1.21-alpine',
  'rust': 'rust:1.70-slim',
  'ruby': 'ruby:3.2-slim',
  'php': 'php:8.2-cli',
  'kotlin': 'openjdk:17-slim',
  'scala': 'hseeberger/scala-sbt:17.0.2_1.6.2_3.1.1',
  'haskell': 'haskell:9.4',
  'lua': 'nickblah/lua:5.4',
  'perl': 'perl:5.38',
  'r': 'r-base:4.3.0',
  'julia': 'julia:1.9',
  'elixir': 'elixir:1.15',
  'erlang': 'erlang:26',
  'clojure': 'clojure:openjdk-17-tools-deps',
  'dart': 'dart:stable',
  'bash': 'bash:5.2',
};

// ============================================================================
// Docker Workspace Implementation
// ============================================================================

class DockerWorkspace extends BaseWorkspace {
  private containerId: string | null = null;
  private containerName: string;
  private image: string;

  constructor(config: WorkspaceConfig) {
    super('docker', config);
    this.containerName = `chofesh-workspace-${this.id.substring(0, 8)}`;
    
    // Determine Docker image
    const langInfo = getLanguageInfo(config.language || 'python');
    const langId = langInfo?.id || 'python';
    this.image = config.template || DOCKER_IMAGES[langId] || 'python:3.11-slim';
  }

  async start(): Promise<void> {
    if (this.containerId) {
      console.log(`[DockerWorkspace] Container already running: ${this.containerId}`);
      return;
    }

    try {
      // Build docker run command
      const args = [
        'run',
        '-d', // Detached mode
        '--name', this.containerName,
        '--rm', // Remove container when stopped
        '-w', '/workspace', // Working directory
      ];

      // Add resource limits
      if (this.config.memoryLimit) {
        args.push('-m', `${this.config.memoryLimit}m`);
      }
      if (this.config.cpuLimit) {
        args.push('--cpus', String(this.config.cpuLimit));
      }

      // Add environment variables
      if (this.config.env) {
        for (const [key, value] of Object.entries(this.config.env)) {
          args.push('-e', `${key}=${value}`);
        }
      }

      // Add network isolation
      args.push('--network', 'none');

      // Add image and command to keep container running
      args.push(this.image, 'tail', '-f', '/dev/null');

      // Start container
      const { stdout } = await execAsync(`docker ${args.join(' ')}`);
      this.containerId = stdout.trim();
      this.setStatus('active');

      console.log(`[DockerWorkspace] Started container ${this.containerId} (${this.containerName})`);

      // Pre-install packages if specified
      if (this.config.packages) {
        for (const pkg of this.config.packages) {
          await this.installPackage(pkg);
        }
      }
    } catch (error) {
      this.setStatus('error');
      throw new Error(`Failed to start Docker container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.containerId) return;

    try {
      await execAsync(`docker stop ${this.containerId}`);
      this.setStatus('stopped');
      console.log(`[DockerWorkspace] Stopped container ${this.containerId}`);
    } catch (error) {
      console.error(`[DockerWorkspace] Error stopping container:`, error);
    }
  }

  async destroy(): Promise<void> {
    if (this.containerId) {
      try {
        await execAsync(`docker rm -f ${this.containerId}`);
        console.log(`[DockerWorkspace] Destroyed container ${this.containerId}`);
      } catch (error) {
        console.error(`[DockerWorkspace] Error destroying container:`, error);
      }
    }
    this.containerId = null;
    this.setStatus('destroyed');
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  async readFile(path: string): Promise<FileReadResult> {
    this.updateActivity();
    if (!this.containerId) throw new Error('Container not running');

    const { stdout } = await execAsync(`docker exec ${this.containerId} cat /workspace/${path}`);
    return { content: stdout, encoding: 'utf-8' };
  }

  async writeFile(request: FileWriteRequest): Promise<void> {
    this.updateActivity();
    if (!this.containerId) throw new Error('Container not running');

    // Create parent directories if needed
    if (request.createDirs) {
      const dir = request.path.split('/').slice(0, -1).join('/');
      if (dir) {
        await execAsync(`docker exec ${this.containerId} mkdir -p /workspace/${dir}`);
      }
    }

    // Write file content using echo and base64 to handle special characters
    const base64Content = Buffer.from(request.content).toString('base64');
    await execAsync(`docker exec ${this.containerId} sh -c "echo '${base64Content}' | base64 -d > /workspace/${request.path}"`);
  }

  async listFiles(path: string): Promise<FileInfo[]> {
    this.updateActivity();
    if (!this.containerId) throw new Error('Container not running');

    try {
      const { stdout } = await execAsync(`docker exec ${this.containerId} ls -la /workspace/${path}`);
      const lines = stdout.split('\n').slice(1); // Skip total line
      const files: FileInfo[] = [];

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 9) {
          const name = parts.slice(8).join(' ');
          if (name !== '.' && name !== '..') {
            files.push({
              name,
              path: `${path}/${name}`.replace(/^\/+/, ''),
              type: parts[0].startsWith('d') ? 'directory' : 'file',
              size: parseInt(parts[4]) || 0,
            });
          }
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  async deleteFile(path: string): Promise<void> {
    this.updateActivity();
    if (!this.containerId) throw new Error('Container not running');
    await execAsync(`docker exec ${this.containerId} rm -rf /workspace/${path}`);
  }

  async fileExists(path: string): Promise<boolean> {
    if (!this.containerId) return false;
    try {
      await execAsync(`docker exec ${this.containerId} test -e /workspace/${path}`);
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

    if (!this.containerId) {
      return this.createErrorResult('Container not running', 0);
    }

    try {
      const langInfo = getLanguageInfo(request.language);
      const langId = langInfo?.id || request.language.toLowerCase();

      // Write any files needed for execution
      if (request.files) {
        for (const file of request.files) {
          await this.writeFile(file);
        }
      }

      // Get execution command
      const execCmd = this.getDockerExecutionCommand(langId, request.code);
      if (!execCmd) {
        return this.createErrorResult(`Cannot execute ${request.language} code`, Date.now() - startTime);
      }

      // Build docker exec command
      const timeout = request.timeout || this.config.timeout || 30;
      const dockerCmd = `timeout ${timeout}s docker exec ${this.containerId} ${execCmd}`;

      const { stdout, stderr } = await execAsync(dockerCmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return {
        stdout,
        stderr,
        exitCode: 0,
        status: 'success',
        executionTime: Date.now() - startTime,
        output: stdout + (stderr ? `\n${stderr}` : ''),
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Check for timeout
      if (error.killed || error.code === 124) {
        return {
          stdout: error.stdout || '',
          stderr: 'Execution timed out',
          exitCode: 124,
          status: 'timeout',
          executionTime,
        };
      }

      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        status: 'error',
        executionTime,
        output: error.stdout + (error.stderr ? `\n${error.stderr}` : ''),
      };
    }
  }

  async executeStream(
    request: ExecuteRequest,
    onOutput: (output: TerminalOutput) => void
  ): Promise<ExecuteResult> {
    this.updateActivity();
    const startTime = Date.now();

    if (!this.containerId) {
      const error = 'Container not running';
      onOutput({ type: 'stderr', data: error, timestamp: new Date() });
      return this.createErrorResult(error, 0);
    }

    try {
      const langInfo = getLanguageInfo(request.language);
      const langId = langInfo?.id || request.language.toLowerCase();

      const execCmd = this.getDockerExecutionCommand(langId, request.code);
      if (!execCmd) {
        const error = `Cannot execute ${request.language} code`;
        onOutput({ type: 'stderr', data: error, timestamp: new Date() });
        return this.createErrorResult(error, Date.now() - startTime);
      }

      return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        const child = spawn('docker', ['exec', this.containerId!, 'sh', '-c', execCmd], {
          timeout: (request.timeout || 30) * 1000,
        });

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
          onOutput({ type: 'exit', data: String(code ?? 0), timestamp: new Date() });
          resolve({
            stdout,
            stderr,
            exitCode: code,
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
  // Package Management
  // ============================================================================

  async installPackage(request: PackageInstallRequest): Promise<PackageInstallResult> {
    if (!this.containerId) {
      return {
        success: false,
        package: request.name,
        error: 'Container not running',
      };
    }

    const command = this.getPackageInstallCommand(request);
    if (!command) {
      return {
        success: false,
        package: request.name,
        error: `Package manager '${request.manager}' not supported`,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(
        `docker exec ${this.containerId} ${command}`,
        { timeout: 120000 } // 2 minutes
      );

      return {
        success: true,
        package: request.name,
        version: request.version,
        output: stdout + stderr,
      };
    } catch (error: any) {
      return {
        success: false,
        package: request.name,
        error: error.stderr || error.message,
        output: error.stdout,
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getDockerExecutionCommand(language: string, code: string): string | null {
    // Escape single quotes in code
    const escapedCode = code.replace(/'/g, "'\\''");

    switch (language) {
      case 'python':
        return `python3 -c '${escapedCode}'`;
      case 'javascript':
        return `node -e '${escapedCode}'`;
      case 'typescript':
        return `npx ts-node -e '${escapedCode}'`;
      case 'ruby':
        return `ruby -e '${escapedCode}'`;
      case 'php':
        return `php -r '${escapedCode}'`;
      case 'perl':
        return `perl -e '${escapedCode}'`;
      case 'lua':
        return `lua -e '${escapedCode}'`;
      case 'bash':
        return `bash -c '${escapedCode}'`;
      case 'go':
        // Go requires a file
        return `sh -c 'echo "${Buffer.from(code).toString('base64')}" | base64 -d > /tmp/main.go && go run /tmp/main.go'`;
      case 'rust':
        // Rust requires a file
        return `sh -c 'echo "${Buffer.from(code).toString('base64')}" | base64 -d > /tmp/main.rs && rustc /tmp/main.rs -o /tmp/main && /tmp/main'`;
      default:
        return null;
    }
  }
}

// ============================================================================
// Docker Workspace Provider
// ============================================================================

export class DockerWorkspaceProvider implements IWorkspaceProvider {
  readonly type: WorkspaceType = 'docker';
  readonly name = 'Docker Containers';
  readonly supportedLanguages = Object.keys(DOCKER_IMAGES);
  readonly supportsPackageManagement = true;
  readonly supportsFileSystem = true;
  readonly supportsTerminal = true;

  private workspaces: Map<string, DockerWorkspace> = new Map();
  private dockerAvailable: boolean | null = null;

  async isAvailable(): Promise<boolean> {
    if (this.dockerAvailable !== null) {
      return this.dockerAvailable;
    }

    try {
      await execAsync('docker info');
      this.dockerAvailable = true;
      return true;
    } catch {
      this.dockerAvailable = false;
      return false;
    }
  }

  async create(config: WorkspaceConfig): Promise<IWorkspace> {
    const workspace = new DockerWorkspace(config);
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
        console.error(`[DockerWorkspaceProvider] Error destroying workspace:`, error);
      }
    }
    this.workspaces.clear();

    // Also clean up any orphaned containers
    try {
      await execAsync('docker ps -a --filter "name=chofesh-workspace-" -q | xargs -r docker rm -f');
    } catch {
      // Ignore errors
    }
  }
}
