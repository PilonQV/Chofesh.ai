import { readFileSync } from "fs";
import { join } from "path";

let cachedVersion: string | null = null;

/**
 * Get the current application version from package.json
 */
export function getAppVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    cachedVersion = packageJson.version || "unknown";
    return cachedVersion as string;
  } catch (error) {
    console.error("[Version] Failed to read package.json:", error);
    return "unknown";
  }
}

/**
 * Log the current application version on startup
 */
export function logAppVersion(): void {
  const version = getAppVersion();
  console.log(`[Version] Chofesh.ai v${version} starting...`);
}
