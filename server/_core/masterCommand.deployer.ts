/**
 * Master Command System - Deployment Agent
 * 
 * Creates checkpoints and deploys changes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { DeploymentResult, FileChange, AgentContext } from './masterCommand.types';

const execAsync = promisify(exec);

export class Deployer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Deploy changes by creating checkpoint
   */
  async deploy(
    changes: FileChange[],
    message: string,
    context: AgentContext
  ): Promise<DeploymentResult> {
    this.log(context, 'Deploying changes...');

    // Update version
    const newVersion = await this.incrementVersion();
    this.log(context, `Version updated to: ${newVersion}`);

    // Create git commit
    const versionId = await this.createCommit(message);
    this.log(context, `Commit created: ${versionId}`);

    return {
      checkpointId: versionId,
      versionId,
      timestamp: new Date().toISOString(),
      changes,
      message,
    };
  }

  /**
   * Increment package.json version
   */
  private async incrementVersion(): Promise<string> {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
    
    const currentVersion = packageJson.version;
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2]) + 1;
    const newVersion = `${parts[0]}.${parts[1]}.${patch}`;
    
    packageJson.version = newVersion;
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
    
    return newVersion;
  }

  /**
   * Create git commit
   */
  private async createCommit(message: string): Promise<string> {
    try {
      // Add all changes
      await execAsync('git add .', { cwd: this.projectPath });
      
      // Commit with message
      await execAsync(`git commit -m "Master Command: ${message}"`, { cwd: this.projectPath });
      
      // Get commit hash
      const { stdout } = await execAsync('git rev-parse --short HEAD', { cwd: this.projectPath });
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to create commit: ${error.message}`);
    }
  }

  /**
   * Add log entry to context
   */
  private log(context: AgentContext, message: string): void {
    context.logs.push(`[Deployer] ${message}`);
  }
}
