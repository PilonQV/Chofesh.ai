/**
 * Workspace Module
 * 
 * Provides a unified interface for code execution across different environments.
 */

// Types and interfaces
export * from './provider';

// Workspace implementations
export { LocalWorkspace } from './local';
export { DockerWorkspace } from './docker';
export { PistonWorkspace } from './piston';

// Factory
export { 
  getWorkspaceProvider, 
  getEnhancedWorkspaceProvider,
  getBestProviderForLanguage,
  listAvailableProviders,
  type WorkspaceOptions,
} from './factory';
