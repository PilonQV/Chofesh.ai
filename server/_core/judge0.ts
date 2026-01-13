/**
 * Judge0 Code Execution Integration
 * 
 * Free, open-source code execution engine supporting 60+ languages.
 * Can be self-hosted or use the free RapidAPI tier (50 submissions/day).
 * 
 * Self-hosted setup:
 * 1. Install Docker and Docker Compose
 * 2. Clone: git clone https://github.com/judge0/judge0
 * 3. Run: docker-compose up -d
 * 4. Set JUDGE0_API_URL to your instance (e.g., http://localhost:2358)
 * 
 * RapidAPI setup:
 * 1. Sign up at https://rapidapi.com/judge0-official/api/judge0-ce
 * 2. Get your RapidAPI key
 * 3. Set RAPIDAPI_KEY in environment
 */

import { TRPCError } from "@trpc/server";

export interface Judge0ExecutionRequest {
  code: string;
  language: string;
  stdin?: string;
  compilerOptions?: string;
  commandLineArguments?: string;
  timeLimit?: number; // seconds
  memoryLimit?: number; // KB
}

export interface Judge0ExecutionResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  time: number;
  memory: number;
  exitCode: number | null;
}

// Language ID mapping for Judge0
// Full list: https://ce.judge0.com/languages
const LANGUAGE_IDS: Record<string, number> = {
  // Popular languages
  "python": 71,      // Python 3.8.1
  "python3": 71,
  "javascript": 63,  // JavaScript (Node.js 12.14.0)
  "nodejs": 63,
  "java": 62,        // Java (OpenJDK 13.0.1)
  "cpp": 54,         // C++ (GCC 9.2.0)
  "c++": 54,
  "c": 50,           // C (GCC 9.2.0)
  "go": 60,          // Go (1.13.5)
  "rust": 73,        // Rust (1.40.0)
  "ruby": 72,        // Ruby (2.7.0)
  "php": 68,         // PHP (7.4.1)
  "swift": 83,       // Swift (5.2.3)
  "kotlin": 78,      // Kotlin (1.3.70)
  "typescript": 74,  // TypeScript (3.7.4)
  "bash": 46,        // Bash (5.0.0)
  "shell": 46,
  "r": 80,           // R (4.0.0)
  "sql": 82,         // SQL (SQLite 3.27.2)
  "perl": 85,        // Perl (5.28.1)
  "scala": 81,       // Scala (2.13.2)
  "haskell": 61,     // Haskell (GHC 8.8.1)
  "lua": 64,         // Lua (5.3.5)
  "elixir": 57,      // Elixir (1.9.4)
  "clojure": 86,     // Clojure (1.10.1)
};

/**
 * Get Judge0 language ID from language name
 */
function getLanguageId(language: string): number {
  const normalized = language.toLowerCase().trim();
  const languageId = LANGUAGE_IDS[normalized];
  
  if (!languageId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unsupported language: ${language}. Supported languages: ${Object.keys(LANGUAGE_IDS).join(", ")}`,
    });
  }
  
  return languageId;
}

/**
 * Execute code using Judge0 (self-hosted or RapidAPI)
 */
export async function executeCode(request: Judge0ExecutionRequest): Promise<Judge0ExecutionResult> {
  const judge0Url = process.env.JUDGE0_API_URL || "http://localhost:2358";
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const useRapidApi = !process.env.JUDGE0_API_URL && rapidApiKey;
  
  try {
    const languageId = getLanguageId(request.language);
    
    // Step 1: Create submission
    const submissionPayload = {
      source_code: Buffer.from(request.code).toString("base64"),
      language_id: languageId,
      stdin: request.stdin ? Buffer.from(request.stdin).toString("base64") : undefined,
      compiler_options: request.compilerOptions,
      command_line_arguments: request.commandLineArguments,
      cpu_time_limit: request.timeLimit || 5,
      memory_limit: request.memoryLimit || 128000, // 128 MB default
    };
    
    const submissionHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    let submissionUrl: string;
    
    if (useRapidApi) {
      // Use RapidAPI
      submissionUrl = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true";
      submissionHeaders["X-RapidAPI-Key"] = rapidApiKey!;
      submissionHeaders["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
    } else {
      // Use self-hosted Judge0
      submissionUrl = `${judge0Url}/submissions?base64_encoded=true&wait=true`;
    }
    
    const submissionResponse = await fetch(submissionUrl, {
      method: "POST",
      headers: submissionHeaders,
      body: JSON.stringify(submissionPayload),
    });
    
    if (!submissionResponse.ok) {
      const errorText = await submissionResponse.text().catch(() => "");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Judge0 submission failed: ${submissionResponse.status} ${submissionResponse.statusText}${errorText ? `: ${errorText}` : ""}`,
      });
    }
    
    const result = await submissionResponse.json();
    
    // Decode base64 outputs
    const stdout = result.stdout ? Buffer.from(result.stdout, "base64").toString("utf-8") : "";
    const stderr = result.stderr ? Buffer.from(result.stderr, "base64").toString("utf-8") : "";
    const compileOutput = result.compile_output ? Buffer.from(result.compile_output, "base64").toString("utf-8") : "";
    
    // Map status
    const statusMap: Record<number, string> = {
      1: "In Queue",
      2: "Processing",
      3: "Accepted",
      4: "Wrong Answer",
      5: "Time Limit Exceeded",
      6: "Compilation Error",
      7: "Runtime Error (SIGSEGV)",
      8: "Runtime Error (SIGXFSZ)",
      9: "Runtime Error (SIGFPE)",
      10: "Runtime Error (SIGABRT)",
      11: "Runtime Error (NZEC)",
      12: "Runtime Error (Other)",
      13: "Internal Error",
      14: "Exec Format Error",
    };
    
    const status = statusMap[result.status?.id] || "Unknown";
    
    return {
      stdout,
      stderr,
      compileOutput,
      status,
      time: result.time || 0,
      memory: result.memory || 0,
      exitCode: result.exit_code !== undefined ? result.exit_code : null,
    };
    
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Code execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Execute Python code (convenience function)
 */
export async function executePython(code: string, stdin?: string): Promise<Judge0ExecutionResult> {
  return executeCode({
    code,
    language: "python",
    stdin,
  });
}

/**
 * Execute JavaScript code (convenience function)
 */
export async function executeJavaScript(code: string, stdin?: string): Promise<Judge0ExecutionResult> {
  return executeCode({
    code,
    language: "javascript",
    stdin,
  });
}

/**
 * Check if Judge0 is available
 */
export async function isJudge0Available(): Promise<boolean> {
  const judge0Url = process.env.JUDGE0_API_URL || "http://localhost:2358";
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  try {
    if (rapidApiKey && !process.env.JUDGE0_API_URL) {
      // Check RapidAPI
      const response = await fetch("https://judge0-ce.p.rapidapi.com/languages", {
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      });
      return response.ok;
    } else {
      // Check self-hosted
      const response = await fetch(`${judge0Url}/languages`);
      return response.ok;
    }
  } catch {
    return false;
  }
}
