import { promises as fs } from "fs";
import { exec } from "child_process";
import { WorkspaceProvider } from "./provider";

export class LocalWorkspace implements WorkspaceProvider {
  type = "local" as const;

  async connect(): Promise<void> {
    // No-op for local
  }

  async disconnect(): Promise<void> {
    // No-op for local
  }

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

  async execute(command: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const fullCommand = `${command} ${args.join(" ")}`;
      exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
          resolve({ stdout, stderr, exitCode: error.code || 1 });
        } else {
          resolve({ stdout, stderr, exitCode: 0 });
        }
      });
    });
  }
}
