/**
 * Workspace Manager
 * 
 * Coordinates multiple workspace providers and provides a unified interface
 * for creating and managing workspaces across different execution environments.
 */

import {
  IWorkspaceManager,
  IWorkspaceProvider,
  IWorkspace,
  WorkspaceType,
  WorkspaceConfig,
  WorkspaceInfo,
  ExecuteRequest,
  ExecuteResult,
  getLanguageInfo,
} from './types';

export class WorkspaceManager implements IWorkspaceManager {
  private providers: Map<WorkspaceType, IWorkspaceProvider> = new Map();
  private workspaces: Map<string, IWorkspace> = new Map();
  private defaultProvider: WorkspaceType = 'piston';

  /**
   * Register a workspace provider
   */
  registerProvider(provider: IWorkspaceProvider): void {
    this.providers.set(provider.type, provider);
    console.log(`[WorkspaceManager] Registered provider: ${provider.name} (${provider.type})`);
  }

  /**
   * Get all registered providers
   */
  getProviders(): IWorkspaceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by type
   */
  getProvider(type: WorkspaceType): IWorkspaceProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Set the default provider type
   */
  setDefaultProvider(type: WorkspaceType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Provider '${type}' is not registered`);
    }
    this.defaultProvider = type;
  }

  /**
   * Create a new workspace with the specified or best available provider
   */
  async createWorkspace(config: WorkspaceConfig): Promise<IWorkspace> {
    const providerType = config.type || this.defaultProvider;
    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new Error(`No provider registered for type: ${providerType}`);
    }

    // Check if provider is available
    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      // Try fallback providers
      const fallbackProvider = await this.findAvailableProvider(config.language);
      if (!fallbackProvider) {
        throw new Error(`No available provider for workspace creation`);
      }
      console.log(`[WorkspaceManager] Using fallback provider: ${fallbackProvider.name}`);
      const workspace = await fallbackProvider.create(config);
      this.workspaces.set(workspace.id, workspace);
      return workspace;
    }

    const workspace = await provider.create(config);
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  /**
   * Get an existing workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<IWorkspace | null> {
    // Check local cache first
    const cached = this.workspaces.get(workspaceId);
    if (cached) {
      return cached;
    }

    // Search all providers
    for (const provider of this.providers.values()) {
      const workspace = await provider.get(workspaceId);
      if (workspace) {
        this.workspaces.set(workspaceId, workspace);
        return workspace;
      }
    }

    return null;
  }

  /**
   * List all workspaces across all providers
   */
  async listWorkspaces(): Promise<WorkspaceInfo[]> {
    const allWorkspaces: WorkspaceInfo[] = [];

    for (const provider of this.providers.values()) {
      try {
        const workspaces = await provider.list();
        allWorkspaces.push(...workspaces);
      } catch (error) {
        console.error(`[WorkspaceManager] Error listing workspaces from ${provider.name}:`, error);
      }
    }

    return allWorkspaces;
  }

  /**
   * Execute code with automatic workspace selection
   * Creates a temporary workspace, executes code, and destroys it
   */
  async executeCode(request: ExecuteRequest): Promise<ExecuteResult> {
    const startTime = Date.now();

    // Find the best provider for this language
    const provider = await this.findProviderForLanguage(request.language);
    if (!provider) {
      return {
        stdout: '',
        stderr: `No provider available for language: ${request.language}`,
        exitCode: 1,
        status: 'error',
        executionTime: Date.now() - startTime,
      };
    }

    // Create temporary workspace
    const workspace = await provider.create({
      type: provider.type,
      language: request.language,
      timeout: request.timeout,
      memoryLimit: request.memoryLimit,
    });

    try {
      // Start workspace
      await workspace.start();

      // Execute code
      const result = await workspace.execute(request);

      return result;
    } catch (error) {
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        status: 'error',
        executionTime: Date.now() - startTime,
      };
    } finally {
      // Cleanup temporary workspace
      try {
        await workspace.destroy();
        this.workspaces.delete(workspace.id);
      } catch (cleanupError) {
        console.error('[WorkspaceManager] Error cleaning up workspace:', cleanupError);
      }
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    console.log('[WorkspaceManager] Cleaning up all workspaces...');

    // Destroy all tracked workspaces
    for (const workspace of this.workspaces.values()) {
      try {
        await workspace.destroy();
      } catch (error) {
        console.error(`[WorkspaceManager] Error destroying workspace ${workspace.id}:`, error);
      }
    }
    this.workspaces.clear();

    // Cleanup all providers
    for (const provider of this.providers.values()) {
      try {
        await provider.cleanup();
      } catch (error) {
        console.error(`[WorkspaceManager] Error cleaning up provider ${provider.name}:`, error);
      }
    }

    console.log('[WorkspaceManager] Cleanup complete');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Find an available provider that supports the given language
   */
  private async findProviderForLanguage(language: string): Promise<IWorkspaceProvider | null> {
    const langInfo = getLanguageInfo(language);
    const langId = langInfo?.id || language.toLowerCase();

    // Priority order: piston > e2b > docker > local
    const priorityOrder: WorkspaceType[] = ['piston', 'e2b', 'docker', 'local'];

    for (const type of priorityOrder) {
      const provider = this.providers.get(type);
      if (!provider) continue;

      // Check if provider supports this language
      if (!provider.supportedLanguages.includes(langId) && 
          !provider.supportedLanguages.includes('*')) {
        continue;
      }

      // Check if provider is available
      const isAvailable = await provider.isAvailable();
      if (isAvailable) {
        return provider;
      }
    }

    return null;
  }

  /**
   * Find any available provider
   */
  private async findAvailableProvider(language?: string): Promise<IWorkspaceProvider | null> {
    if (language) {
      return this.findProviderForLanguage(language);
    }

    for (const provider of this.providers.values()) {
      const isAvailable = await provider.isAvailable();
      if (isAvailable) {
        return provider;
      }
    }

    return null;
  }
}

// Singleton instance
let workspaceManagerInstance: WorkspaceManager | null = null;

/**
 * Get the global workspace manager instance
 */
export function getWorkspaceManager(): WorkspaceManager {
  if (!workspaceManagerInstance) {
    workspaceManagerInstance = new WorkspaceManager();
  }
  return workspaceManagerInstance;
}

/**
 * Initialize workspace manager with default providers
 */
export async function initializeWorkspaceManager(): Promise<WorkspaceManager> {
  const manager = getWorkspaceManager();
  
  // Import and register providers dynamically to avoid circular dependencies
  try {
    const { PistonWorkspaceProvider } = await import('./providers/PistonWorkspaceProvider');
    manager.registerProvider(new PistonWorkspaceProvider());
  } catch (error) {
    console.warn('[WorkspaceManager] Piston provider not available:', error);
  }

  try {
    const { LocalWorkspaceProvider } = await import('./providers/LocalWorkspaceProvider');
    manager.registerProvider(new LocalWorkspaceProvider());
  } catch (error) {
    console.warn('[WorkspaceManager] Local provider not available:', error);
  }

  try {
    const { DockerWorkspaceProvider } = await import('./providers/DockerWorkspaceProvider');
    manager.registerProvider(new DockerWorkspaceProvider());
  } catch (error) {
    console.warn('[WorkspaceManager] Docker provider not available:', error);
  }

  return manager;
}
