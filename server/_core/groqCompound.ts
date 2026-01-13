/**
 * Groq Compound System - AI Research Mode
 * 
 * Combines Groq's powerful LLMs with:
 * - Web search (using existing implementation)
 * - Code execution (using Judge0 - free and open source)
 * 
 * No paid APIs required - completely free to use!
 */

import { TRPCError } from "@trpc/server";
import { executeCode, type Judge0ExecutionResult } from "./judge0";

interface GroqCompoundRequest {
  query: string;
  model: string;
  apiKey?: string;
}

interface GroqCompoundResponse {
  content: string;
  sources?: Array<{ title: string; url: string }>;
  codeExecutions?: Array<{ code: string; output: string; language: string }>;
}

/**
 * Extract code blocks from LLM response and execute them
 */
async function executeCodeBlocks(content: string): Promise<Array<{ code: string; output: string; language: string }>> {
  const codeExecutions: Array<{ code: string; output: string; language: string }> = [];
  
  // Match code blocks with language specification
  const codeBlockRegex = /```(python|javascript|js|java|cpp|c\+\+|c|go|rust|ruby|php)\n([\s\S]*?)```/gi;
  const matches = Array.from(content.matchAll(codeBlockRegex));
  
  if (matches.length === 0) {
    return codeExecutions;
  }
  
  // Execute each code block
  for (const match of matches) {
    let language = match[1].toLowerCase();
    const code = match[2].trim();
    
    if (!code) continue;
    
    // Normalize language names
    if (language === "js") language = "javascript";
    if (language === "c++") language = "cpp";
    
    try {
      const result = await executeCode({
        code,
        language,
        timeLimit: 5,
        memoryLimit: 128000,
      });
      
      // Combine stdout and stderr for output
      let output = "";
      if (result.stdout) output += result.stdout;
      if (result.stderr) output += (output ? "\n" : "") + result.stderr;
      if (result.compileOutput) output += (output ? "\n" : "") + result.compileOutput;
      
      // Add status information
      if (result.status !== "Accepted") {
        output = `[${result.status}]\n${output}`;
      }
      
      codeExecutions.push({
        code,
        output: output || "(no output)",
        language,
      });
      
    } catch (error) {
      // If code execution fails, include error in output
      codeExecutions.push({
        code,
        output: `Error: ${error instanceof Error ? error.message : "Code execution failed"}`,
        language,
      });
    }
  }
  
  return codeExecutions;
}

/**
 * Call Groq Compound API for research with web search and code execution
 */
export async function callGroqCompound(request: GroqCompoundRequest): Promise<GroqCompoundResponse> {
  const apiKey = request.apiKey || process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Groq API key not configured",
    });
  }

  try {
    // Call Groq API with the Compound model
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: "user",
            content: request.query,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Groq API error: ${error.error?.message || response.statusText}`,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse sources and code executions from the response
    const sources: Array<{ title: string; url: string }> = [];

    // Extract sources from Groq tool calls if available
    if (data.choices?.[0]?.message?.tool_calls) {
      for (const toolCall of data.choices[0].message.tool_calls) {
        if (toolCall.function.name === "web_search") {
          const args = JSON.parse(toolCall.function.arguments);
          if (args.results) {
            sources.push(...args.results.map((r: any) => ({
              title: r.title || r.url,
              url: r.url,
            })));
          }
        }
      }
    }

    // Also extract sources from markdown links in content
    const sourceRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = sourceRegex.exec(content)) !== null) {
      const title = match[1];
      const url = match[2];
      if (url.startsWith("http")) {
        // Avoid duplicates
        if (!sources.some(s => s.url === url)) {
          sources.push({ title, url });
        }
      }
    }

    // Execute code blocks found in the response using Judge0
    const codeExecutions = await executeCodeBlocks(content);

    return {
      content,
      sources: sources.length > 0 ? sources : undefined,
      codeExecutions: codeExecutions.length > 0 ? codeExecutions : undefined,
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to call Groq Compound: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}
