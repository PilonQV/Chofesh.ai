/**
 * Workspace Factory
 * 
 * Creates workspace providers based on the specified type.
 * Supports local, docker, piston, and remote workspaces.
 */

import { WorkspaceProvider, EnhancedWorkspaceProvider, WorkspaceType } from "./provider";
import { LocalWorkspace } from "./local";
import { DockerWorkspace } from "./docker";
import { PistonWorkspace } from "./piston";

export interface WorkspaceOptions {
  imageName?: string;
  remoteUrl?: string;
  language?: string;
  timeout?: number;
  memoryLimit?: number;
}

/**
 * Get a workspace provider by type
 */
export function getWorkspaceProvider(
  type: WorkspaceType, 
  options?: WorkspaceOptions
): WorkspaceProvider {
  switch (type) {
    case "local":
      return new LocalWorkspace();
    case "docker":
      if (!options?.imageName) throw new Error("Docker workspace requires imageName option");
      return new DockerWorkspace(options.imageName);
    case "piston":
      return new PistonWorkspace();
    case "remote":
      throw new Error("Remote workspace not yet implemented");
    default:
      throw new Error(`Unknown workspace type: ${type}`);
  }
}

/**
 * Get an enhanced workspace provider with code execution support
 */
export function getEnhancedWorkspaceProvider(
  type: WorkspaceType,
  options?: WorkspaceOptions
): EnhancedWorkspaceProvider {
  const provider = getWorkspaceProvider(type, options);
  
  // Check if provider supports executeCode
  if ('executeCode' in provider) {
    return provider as EnhancedWorkspaceProvider;
  }
  
  throw new Error(`Workspace type '${type}' does not support enhanced code execution`);
}

/**
 * Get the best available workspace provider for a given language
 */
export async function getBestProviderForLanguage(
  language: string,
  options?: WorkspaceOptions
): Promise<EnhancedWorkspaceProvider> {
  // Priority order: piston > docker > local
  const providers: WorkspaceType[] = ['piston', 'docker', 'local'];
  
  for (const type of providers) {
    try {
      const provider = getWorkspaceProvider(type, options);
      
      // Check if provider supports this language
      if (provider.supportedLanguages && 
          !provider.supportedLanguages.includes(language) &&
          !provider.supportedLanguages.includes('*')) {
        continue;
      }
      
      // Check if provider is available
      if (provider.isAvailable) {
        const available = await provider.isAvailable();
        if (!available) continue;
      }
      
      // Check if provider supports executeCode
      if ('executeCode' in provider) {
        return provider as EnhancedWorkspaceProvider;
      }
    } catch {
      // Try next provider
      continue;
    }
  }
  
  throw new Error(`No available workspace provider for language: ${language}`);
}

/**
 * List all available workspace providers
 */
export async function listAvailableProviders(): Promise<Array<{
  type: WorkspaceType;
  name: string;
  available: boolean;
  supportedLanguages: string[];
}>> {
  const results: Array<{
    type: WorkspaceType;
    name: string;
    available: boolean;
    supportedLanguages: string[];
  }> = [];

  const types: WorkspaceType[] = ['local', 'piston', 'docker'];

  for (const type of types) {
    try {
      const provider = getWorkspaceProvider(type, { imageName: 'python:3.11-slim' });
      let available = true;
      
      if (provider.isAvailable) {
        available = await provider.isAvailable();
      }
      
      results.push({
        type,
        name: provider.name,
        available,
        supportedLanguages: provider.supportedLanguages || [],
      });
    } catch {
      results.push({
        type,
        name: type,
        available: false,
        supportedLanguages: [],
      });
    }
  }

  return results;
}
