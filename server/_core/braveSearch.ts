/**
 * Brave Search API Integration
 * Free tier: 2,000 queries/month
 * https://brave.com/search/api/
 * 
 * Alternative: Use Serper.dev (2,500 free queries)
 * Or SerpAPI (100 free queries/month)
 */

import { ENV } from './env';

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  source: string;
}

/**
 * Search using Brave Search API
 * Requires BRAVE_SEARCH_API_KEY environment variable
 */
export async function searchBrave(query: string): Promise<BraveSearchResult[]> {
  const apiKey = ENV.BRAVE_SEARCH_API_KEY;
  
  if (!apiKey) {
    console.log('[BraveSearch] No API key configured, skipping');
    return [];
  }
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodedQuery}&count=10`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });
    
    if (!response.ok) {
      console.error('[BraveSearch] API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    const results: BraveSearchResult[] = [];
    
    if (data.web?.results) {
      for (const result of data.web.results.slice(0, 8)) {
        results.push({
          title: result.title || '',
          url: result.url || '',
          description: result.description || '',
          source: 'Brave Search',
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('[BraveSearch] Error:', error);
    return [];
  }
}

/**
 * Search using Serper.dev API (Google Search results)
 * Free tier: 2,500 queries
 * Requires SERPER_API_KEY environment variable
 */
export async function searchSerper(query: string): Promise<BraveSearchResult[]> {
  const apiKey = ENV.SERPER_API_KEY;
  
  if (!apiKey) {
    console.log('[Serper] No API key configured, skipping');
    return [];
  }
  
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 10,
      }),
    });
    
    if (!response.ok) {
      console.error('[Serper] API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    const results: BraveSearchResult[] = [];
    
    // Add organic results
    if (data.organic) {
      for (const result of data.organic.slice(0, 8)) {
        results.push({
          title: result.title || '',
          url: result.link || '',
          description: result.snippet || '',
          source: 'Google (via Serper)',
        });
      }
    }
    
    // Add knowledge graph if available
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      if (kg.description) {
        results.unshift({
          title: kg.title || query,
          url: kg.website || '',
          description: kg.description,
          source: 'Google Knowledge Graph',
        });
      }
    }
    
    // Add answer box if available
    if (data.answerBox) {
      const ab = data.answerBox;
      results.unshift({
        title: ab.title || 'Answer',
        url: ab.link || '',
        description: ab.answer || ab.snippet || '',
        source: 'Google Answer Box',
      });
    }
    
    return results;
  } catch (error) {
    console.error('[Serper] Error:', error);
    return [];
  }
}
