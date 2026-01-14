import { WorkspaceProvider } from "./provider";
import { LocalWorkspace } from "./local";
import { DockerWorkspace } from "./docker";

export function getWorkspaceProvider(type: "local" | "docker" | "remote", options?: any): WorkspaceProvider {
  switch (type) {
    case "local":
      return new LocalWorkspace();
    case "docker":
      if (!options?.imageName) throw new Error("Docker workspace requires imageName option");
      return new DockerWorkspace(options.imageName);
    case "remote":
      throw new Error("Remote workspace not yet implemented");
    default:
      throw new Error(`Unknown workspace type: ${type}`);
  }
}
