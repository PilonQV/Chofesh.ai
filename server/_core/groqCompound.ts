import { TRPCError } from "@trpc/server";

interface GroqCompoundRequest {
  query: string;
  model: string;
  apiKey?: string;
}

interface GroqCompoundResponse {
  content: string;
  sources?: Array<{ title: string; url: string }>;
  codeExecutions?: Array<{ code: string; output: string }>;
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
    // Groq Compound includes these in the response metadata
    const sources: Array<{ title: string; url: string }> = [];
    const codeExecutions: Array<{ code: string; output: string }> = [];

    // Extract sources from response metadata if available
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
        } else if (toolCall.function.name === "code_execution") {
          const args = JSON.parse(toolCall.function.arguments);
          codeExecutions.push({
            code: args.code || "",
            output: args.output || "",
          });
        }
      }
    }

    // Also try to extract sources from content (if formatted as markdown links)
    const sourceRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = sourceRegex.exec(content)) !== null) {
      const title = match[1];
      const url = match[2];
      if (url.startsWith("http")) {
        sources.push({ title, url });
      }
    }

    // Extract code blocks
    const codeBlockRegex = /```(?:python|javascript|js|py)?\n([\s\S]*?)```/g;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[1].trim();
      if (code) {
        codeExecutions.push({ code, output: "" });
      }
    }

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
