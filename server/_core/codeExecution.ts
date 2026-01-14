import { WorkspaceProvider } from "./workspace/provider";
import { getWorkspaceProvider } from "./workspace/factory";

export class CodeExecutionService {
  private workspace: WorkspaceProvider;

  constructor(workspaceType: "local" | "docker" | "remote", options?: any) {
    this.workspace = getWorkspaceProvider(workspaceType, options);
  }

  async initialize() {
    await this.workspace.connect();
  }

  async execute(command: string, args: string[]) {
    return this.workspace.execute(command, args);
  }

  async installPackages(packageManager: "npm" | "pip", packages: string[]) {
    let installCommand: string;
    switch (packageManager) {
      case "npm":
        installCommand = "npm install";
        break;
      case "pip":
        installCommand = "pip install";
        break;
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
    }
    return this.workspace.execute(installCommand, packages);
  }

  async readFile(path: string) {
    return this.workspace.readFile(path);
  }

  async writeFile(path: string, content: string) {
    return this.workspace.writeFile(path, content);
  }

  async listDir(path: string) {
    return this.workspace.listDir(path);
  }

  async cleanup() {
    await this.workspace.disconnect();
  }
}
