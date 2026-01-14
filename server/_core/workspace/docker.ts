import Docker from "dockerode";
import { WorkspaceProvider } from "./provider";

export class DockerWorkspace implements WorkspaceProvider {
  type = "docker" as const;
  private docker: Docker;
  private container: Docker.Container | null = null;

  constructor(private imageName: string) {
    this.docker = new Docker();
  }

  async connect(): Promise<void> {
    // Check if container already exists
    const containers = await this.docker.listContainers({ all: true });
    const existing = containers.find(c => c.Image === this.imageName);

    if (existing) {
      this.container = this.docker.getContainer(existing.Id);
      if (existing.State !== "running") {
        await this.container.start();
      }
    } else {
      this.container = await this.docker.createContainer({ Image: this.imageName, Tty: true });
      await this.container.start();
    }
  }

  async disconnect(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }

  async readFile(path: string): Promise<string> {
    // Implementation for reading file from container
    return "";
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Implementation for writing file to container
  }

  async deleteFile(path: string): Promise<void> {
    // Implementation for deleting file from container
  }

  async listDir(path: string): Promise<string[]> {
    // Implementation for listing directory in container
    return [];
  }

  async execute(command: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (!this.container) throw new Error("Not connected to Docker container");

    const exec = await this.container.exec({
      Cmd: [command, ...args],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: true });

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      stream.on("data", (chunk) => {
        // Docker multiplexes stdout/stderr, so we need to demultiplex
        if (chunk[0] === 1) {
          stdout += chunk.slice(8).toString();
        } else if (chunk[0] === 2) {
          stderr += chunk.slice(8).toString();
        }
      });
      stream.on("end", async () => {
        const { ExitCode } = await exec.inspect();
        resolve({ stdout, stderr, exitCode: ExitCode });
      });
    });
  }
}
