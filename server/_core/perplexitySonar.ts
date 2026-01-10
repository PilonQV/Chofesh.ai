/**
 * Perplexity Sonar Search via OpenRouter
 * 
 * Perplexity Sonar models have built-in web search capabilities.
 * They automatically search the web and provide citations.
 * 
 * Models available:
 * - perplexity/sonar-small-online (faster, cheaper)
 * - perplexity/sonar-medium-online (better quality)
 * - perplexity/sonar-reasoning-online (reasoning + search)
 */

import { type SearchResult } from './duckduckgo';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface SonarSearchResponse {
  answer: string;
  citations: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

/**
 * Search using Perplexity Sonar via OpenRouter
 * Returns both a summarized answer and source citations
 */
export async function searchWithSonar(query: string): Promise<SonarSearchResponse> {
  if (!OPENROUTER_API_KEY) {
    console.error('[Sonar] No OpenRouter API key configured');
    return { answer: '', citations: [] };
  }

  try {
    console.log(`[Sonar] Searching for: "${query}"`);
    
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chofesh.ai',
        'X-Title': 'Chofesh.ai',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful search assistant. Provide accurate, up-to-date information based on web search results. Always cite your sources with [1], [2], etc. and list the source URLs at the end.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Sonar] API error: ${response.status} - ${errorText}`);
      return { answer: '', citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse citations from the response
    const citations = extractCitations(content);
    
    console.log(`[Sonar] Got response with ${citations.length} citations`);
    
    return {
      answer: content,
      citations,
    };
  } catch (error) {
    console.error('[Sonar] Error:', error);
    return { answer: '', citations: [] };
  }
}

/**
 * Extract citations from Sonar response
 * Sonar typically includes URLs in the response
 */
function extractCitations(content: string): Array<{ title: string; url: string; snippet: string }> {
  const citations: Array<{ title: string; url: string; snippet: string }> = [];
  
  // Look for URLs in the content
  const urlRegex = /https?:\/\/[^\s\)\]]+/g;
  const urls = content.match(urlRegex) || [];
  
  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(urls));
  
  for (const url of uniqueUrls.slice(0, 5)) {
    // Try to extract a title from the URL
    const domain = new URL(url).hostname.replace('www.', '');
    citations.push({
      title: domain,
      url: url,
      snippet: '',
    });
  }
  
  return citations;
}

/**
 * Get search results in the standard SearchResult format
 * This allows Sonar to be used as a drop-in replacement for other search providers
 */
export async function searchSonarAsResults(query: string): Promise<SearchResult[]> {
  const response = await searchWithSonar(query);
  
  if (!response.answer) {
    return [];
  }
  
  // Create a result from the Sonar answer
  const results: SearchResult[] = [];
  
  // Add the main answer as the first result
  results.push({
    title: 'AI Search Summary',
    url: '',
    description: response.answer.substring(0, 500),
    source: 'Perplexity Sonar',
  });
  
  // Add citations as additional results
  for (const citation of response.citations) {
    results.push({
      title: citation.title,
      url: citation.url,
      description: citation.snippet || 'Source from web search',
      source: 'Perplexity Sonar',
    });
  }
  
  return results;
}

/**
 * Direct search that returns the answer with inline citations
 * Best for real-time queries like prices, news, weather
 */
export async function getRealtimeAnswer(query: string): Promise<string> {
  const response = await searchWithSonar(query);
  return response.answer;
}
