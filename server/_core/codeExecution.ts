/**
 * Enhanced Code Execution Service
 * 
 * Provides a unified interface for code execution using the workspace abstraction.
 * Supports 60+ languages with automatic provider selection and fallback.
 */

import {
  WorkspaceProvider,
  EnhancedWorkspaceProvider,
  ExecuteResult,
  CodeExecuteOptions,
  PackageManager,
  getLanguageInfo,
  isLanguageSupported,
  SUPPORTED_LANGUAGES,
  LanguageInfo,
} from "./workspace";
import { 
  getWorkspaceProvider, 
  getBestProviderForLanguage,
  listAvailableProviders,
} from "./workspace/factory";

/**
 * Code Execution Service
 * 
 * High-level service for executing code across different workspace providers.
 */
export class CodeExecutionService {
  private workspace: EnhancedWorkspaceProvider | null = null;
  private workspaceType: "local" | "docker" | "remote" | "piston";
  private options: any;

  constructor(
    workspaceType: "local" | "docker" | "remote" | "piston" = "piston", 
    options?: any
  ) {
    this.workspaceType = workspaceType;
    this.options = options;
  }

  async initialize(): Promise<void> {
    const provider = getWorkspaceProvider(this.workspaceType, this.options);
    await provider.connect();
    
    if ('executeCode' in provider) {
      this.workspace = provider as EnhancedWorkspaceProvider;
    } else {
      throw new Error(`Workspace type '${this.workspaceType}' does not support code execution`);
    }
  }

  async execute(command: string, args: string[]): Promise<ExecuteResult> {
    if (!this.workspace) throw new Error("Service not initialized");
    return this.workspace.execute(command, args);
  }

  async executeCode(
    code: string, 
    language: string, 
    options?: CodeExecuteOptions
  ): Promise<ExecuteResult> {
    if (!this.workspace) throw new Error("Service not initialized");
    return this.workspace.executeCode(code, language, options);
  }

  async installPackages(
    packageManager: PackageManager, 
    packages: string[]
  ): Promise<ExecuteResult[]> {
    if (!this.workspace) throw new Error("Service not initialized");
    
    const results: ExecuteResult[] = [];
    
    if (this.workspace.installPackage) {
      for (const pkg of packages) {
        const result = await this.workspace.installPackage(packageManager, pkg);
        results.push(result);
      }
    } else {
      results.push({
        stdout: '',
        stderr: 'Package installation not supported by this workspace',
        exitCode: 1,
      });
    }
    
    return results;
  }

  async readFile(path: string): Promise<string> {
    if (!this.workspace) throw new Error("Service not initialized");
    return this.workspace.readFile(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.workspace) throw new Error("Service not initialized");
    return this.workspace.writeFile(path, content);
  }

  async listDir(path: string): Promise<string[]> {
    if (!this.workspace) throw new Error("Service not initialized");
    return this.workspace.listDir(path);
  }

  async cleanup(): Promise<void> {
    if (this.workspace) {
      await this.workspace.disconnect();
      this.workspace = null;
    }
  }
}

/**
 * Execute code with automatic provider selection
 */
export async function executeCode(
  code: string,
  language: string,
  options?: CodeExecuteOptions
): Promise<ExecuteResult> {
  // Validate language
  const langInfo = getLanguageInfo(language);
  if (!langInfo) {
    return {
      stdout: '',
      stderr: `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.map(l => l.id).join(', ')}`,
      exitCode: 1,
    };
  }

  try {
    // Get best provider for this language
    const provider = await getBestProviderForLanguage(langInfo.id, {
      timeout: options?.timeout,
      memoryLimit: options?.memoryLimit,
    });

    await provider.connect();

    try {
      return await provider.executeCode(code, langInfo.id, options);
    } finally {
      await provider.disconnect();
    }
  } catch (error) {
    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown error',
      exitCode: 1,
    };
  }
}

/**
 * Execute code with a specific provider
 */
export async function executeCodeWithProvider(
  code: string,
  language: string,
  providerType: "local" | "docker" | "piston",
  options?: CodeExecuteOptions & { imageName?: string }
): Promise<ExecuteResult> {
  const langInfo = getLanguageInfo(language);
  if (!langInfo) {
    return {
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      exitCode: 1,
    };
  }

  try {
    const provider = getWorkspaceProvider(providerType, {
      imageName: options?.imageName,
      language: langInfo.id,
    });

    if (!('executeCode' in provider)) {
      return {
        stdout: '',
        stderr: `Provider '${providerType}' does not support code execution`,
        exitCode: 1,
      };
    }

    await provider.connect();

    try {
      return await (provider as EnhancedWorkspaceProvider).executeCode(code, langInfo.id, options);
    } finally {
      await provider.disconnect();
    }
  } catch (error) {
    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown error',
      exitCode: 1,
    };
  }
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): LanguageInfo[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * Check if a language is supported
 */
export function checkLanguageSupport(language: string): boolean {
  return isLanguageSupported(language);
}

/**
 * Get language info by ID or alias
 */
export function getLanguage(language: string): LanguageInfo | undefined {
  return getLanguageInfo(language);
}

/**
 * Get available workspace providers
 */
export async function getAvailableProviders() {
  return listAvailableProviders();
}

/**
 * Format code execution result for display
 */
export function formatExecutionResult(result: ExecuteResult): string {
  const parts: string[] = [];

  if (result.stdout) {
    parts.push(result.stdout);
  }

  if (result.stderr) {
    parts.push(`\n[stderr]\n${result.stderr}`);
  }

  if (result.timedOut) {
    parts.push('\n[Execution timed out]');
  }

  parts.push(`\n[Exit code: ${result.exitCode}] [Time: ${result.executionTime || 0}ms]`);

  return parts.join('');
}

/**
 * Parse language from code block markdown
 */
export function parseLanguageFromMarkdown(markdown: string): string | null {
  const match = markdown.match(/^```(\w+)/);
  if (match) {
    const lang = match[1].toLowerCase();
    if (isLanguageSupported(lang)) {
      return lang;
    }
  }
  return null;
}

/**
 * Extract code from markdown code block
 */
export function extractCodeFromMarkdown(markdown: string): { code: string; language: string | null } {
  const match = markdown.match(/^```(\w+)?\n([\s\S]*?)```$/);
  if (match) {
    return {
      language: match[1] ? match[1].toLowerCase() : null,
      code: match[2].trim(),
    };
  }
  return { code: markdown.trim(), language: null };
}

// Export types
export type { ExecuteResult, CodeExecuteOptions, PackageManager, LanguageInfo };
