/**
 * Web Search with Citations Service
 * 
 * Provides Perplexity-style web search with source citations
 * Uses DuckDuckGo for search and AI for summarization
 */

import { searchDuckDuckGo, SearchResult as DDGSearchResult } from "./duckduckgo";
import { invokeLLM } from "./llm";

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface WebSearchResult {
  query: string;
  summary: string;
  sources: SearchSource[];
  citations: string[]; // Inline citation markers like [1], [2]
}

/**
 * Perform web search and generate AI summary with citations
 */
export async function searchWithCitations(
  query: string,
  maxSources: number = 5
): Promise<WebSearchResult> {
  // Step 1: Search the web using DuckDuckGo
  const searchResults = await searchDuckDuckGo(query);
  
  // Extract top sources
  const sources: SearchSource[] = searchResults.slice(0, maxSources).map((result: DDGSearchResult, index: number) => ({
    title: result.title || `Source ${index + 1}`,
    url: result.url || "",
    snippet: result.description || "",
    position: index + 1,
  }));
  
  if (sources.length === 0) {
    return {
      query,
      summary: "No search results found for this query.",
      sources: [],
      citations: [],
    };
  }
  
  // Step 2: Build context from search results
  const searchContext = sources.map((source, i) => 
    `[${i + 1}] ${source.title}\nURL: ${source.url}\n${source.snippet}`
  ).join("\n\n");
  
  // Step 3: Generate AI summary with citations
  const systemPrompt = `You are a helpful research assistant. Your task is to answer the user's question based on the provided search results.

IMPORTANT RULES:
1. Use ONLY information from the provided search results
2. Include inline citations like [1], [2], etc. to reference your sources
3. Be concise but comprehensive
4. If the search results don't contain enough information, say so
5. Format your response in clear paragraphs
6. Do NOT make up information not in the sources`;

  const userPrompt = `Question: ${query}

Search Results:
${searchContext}

Please provide a comprehensive answer with inline citations [1], [2], etc.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 1024,
    });
    
    const messageContent = response.choices[0]?.message?.content;
    const summary = typeof messageContent === "string" 
      ? messageContent 
      : Array.isArray(messageContent) 
        ? messageContent.map(c => 'text' in c ? c.text : '').join('')
        : "Unable to generate summary.";
    
    // Extract citations used in the response
    const citationMatches = summary.match(/\[\d+\]/g) || [];
    const citations = Array.from(new Set(citationMatches));
    
    return {
      query,
      summary,
      sources,
      citations,
    };
  } catch (error) {
    console.error("Error generating search summary:", error);
    
    // Fallback: return search results without AI summary
    const fallbackSummary = sources.map((s, i) => 
      `[${i + 1}] **${s.title}**: ${s.snippet}`
    ).join("\n\n");
    
    return {
      query,
      summary: `Here are the search results:\n\n${fallbackSummary}`,
      sources,
      citations: sources.map((_, i) => `[${i + 1}]`),
    };
  }
}

/**
 * Format search result for chat display
 */
export function formatSearchResultForChat(result: WebSearchResult): string {
  let formatted = result.summary;
  
  // Add sources section
  if (result.sources.length > 0) {
    formatted += "\n\n---\n**Sources:**\n";
    result.sources.forEach((source, i) => {
      formatted += `${i + 1}. [${source.title}](${source.url})\n`;
    });
  }
  
  return formatted;
}

/**
 * Quick search without AI summarization (faster)
 */
export async function quickSearch(query: string, maxResults: number = 5): Promise<SearchSource[]> {
  const searchResults = await searchDuckDuckGo(query);
  
  return searchResults.slice(0, maxResults).map((result: DDGSearchResult, index: number) => ({
    title: result.title || `Result ${index + 1}`,
    url: result.url || "",
    snippet: result.description || "",
    position: index + 1,
  }));
}

/**
 * Check if a query should trigger web search
 */
export function shouldTriggerWebSearch(query: string): boolean {
  const searchTriggers = [
    // Explicit search requests
    /\b(search|look up|find|google|what is|who is|when did|where is|how to)\b/i,
    // Current events
    /\b(latest|recent|current|today|yesterday|this week|this month|2025|2026)\b/i,
    // Factual questions
    /\b(price|cost|weather|stock|news|score|result|winner)\b/i,
    // Comparisons
    /\b(vs|versus|compare|difference between|better than)\b/i,
  ];
  
  return searchTriggers.some(pattern => pattern.test(query));
}
