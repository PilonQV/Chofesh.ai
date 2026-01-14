export interface FileSystemProvider {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listDir(path: string): Promise<string[]>;
}

export interface ProcessProvider {
  execute(command: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

export interface WorkspaceProvider extends FileSystemProvider, ProcessProvider {
  type: "local" | "docker" | "remote";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
