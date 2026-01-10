/**
 * SearXNG Integration for Free Web Search
 * Uses public SearXNG instances with JSON API support
 * 
 * SearXNG is a free, open-source metasearch engine that aggregates
 * results from 200+ search services without tracking users.
 * 
 * Benefits:
 * - Completely FREE (no API costs)
 * - No rate limits (uses multiple instances)
 * - Privacy-respecting
 * - Aggregates Google, Bing, DuckDuckGo, and more
 */

import { type SearchResult } from './duckduckgo';

// List of reliable public SearXNG instances with JSON API enabled
// These are selected from https://searx.space/ based on uptime and response time
const SEARXNG_INSTANCES = [
  'https://searx.tiekoetter.com',
  'https://paulgo.io',
  'https://search.rhscz.eu',
  'https://priv.au',
  'https://search.inetol.net',
  'https://search.ononoki.org',
  'https://ooglester.com',
  'https://search.im-in.space',
  'https://searxng.site',
  'https://searx.be',
];

// Track instance health for smart routing
const instanceHealth: Map<string, { failures: number; lastFailure: number }> = new Map();

/**
 * Get a healthy instance, avoiding recently failed ones
 */
function getHealthyInstance(): string {
  const now = Date.now();
  const healthyInstances = SEARXNG_INSTANCES.filter(instance => {
    const health = instanceHealth.get(instance);
    if (!health) return true;
    // Reset failures after 5 minutes
    if (now - health.lastFailure > 5 * 60 * 1000) {
      instanceHealth.delete(instance);
      return true;
    }
    // Skip instances with 3+ recent failures
    return health.failures < 3;
  });
  
  if (healthyInstances.length === 0) {
    // All instances failed, reset and try again
    instanceHealth.clear();
    return SEARXNG_INSTANCES[0];
  }
  
  // Random selection for load distribution
  return healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
}

/**
 * Mark an instance as failed
 */
function markInstanceFailed(instance: string): void {
  const health = instanceHealth.get(instance) || { failures: 0, lastFailure: 0 };
  health.failures++;
  health.lastFailure = Date.now();
  instanceHealth.set(instance, health);
}

/**
 * Search using SearXNG JSON API
 */
export async function searchSearXNG(query: string, retries = 3): Promise<SearchResult[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const instance = getHealthyInstance();
    
    try {
      console.log(`[SearXNG] Searching "${query}" via ${instance} (attempt ${attempt + 1})`);
      
      const encodedQuery = encodeURIComponent(query);
      const url = `${instance}/search?q=${encodedQuery}&format=json&categories=general`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Chofesh.ai/1.0 (AI Assistant; +https://chofesh.ai)',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.error(`[SearXNG] ${instance} returned ${response.status}`);
        markInstanceFailed(instance);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.log(`[SearXNG] ${instance} returned no results`);
        // Don't mark as failed, just try another instance
        continue;
      }
      
      console.log(`[SearXNG] Got ${data.results.length} results from ${instance}`);
      
      const results: SearchResult[] = data.results.slice(0, 10).map((r: {
        title?: string;
        url?: string;
        content?: string;
        engine?: string;
        engines?: string[];
      }) => ({
        title: r.title || '',
        url: r.url || '',
        description: r.content || '',
        source: `SearXNG (${r.engine || r.engines?.join(', ') || 'multiple'})`,
      }));
      
      return results;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SearXNG] Error with ${instance}: ${errorMessage}`);
      markInstanceFailed(instance);
    }
  }
  
  console.log('[SearXNG] All attempts failed');
  return [];
}

/**
 * Search with specific engines (for specialized queries)
 */
export async function searchSearXNGWithEngines(
  query: string, 
  engines: string[] = ['google', 'bing', 'duckduckgo']
): Promise<SearchResult[]> {
  const instance = getHealthyInstance();
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const enginesParam = engines.join(',');
    const url = `${instance}/search?q=${encodedQuery}&format=json&engines=${enginesParam}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Chofesh.ai/1.0 (AI Assistant)',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      markInstanceFailed(instance);
      return searchSearXNG(query); // Fallback to general search
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return searchSearXNG(query); // Fallback
    }
    
    return data.results.slice(0, 10).map((r: {
      title?: string;
      url?: string;
      content?: string;
      engine?: string;
    }) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.content || '',
      source: `SearXNG (${r.engine || 'unknown'})`,
    }));
    
  } catch (error) {
    console.error('[SearXNG] Engine-specific search failed:', error);
    return searchSearXNG(query); // Fallback
  }
}

/**
 * Search for news specifically
 */
export async function searchSearXNGNews(query: string): Promise<SearchResult[]> {
  const instance = getHealthyInstance();
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${instance}/search?q=${encodedQuery}&format=json&categories=news&time_range=day`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Chofesh.ai/1.0 (AI Assistant)',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      markInstanceFailed(instance);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results) return [];
    
    return data.results.slice(0, 8).map((r: {
      title?: string;
      url?: string;
      content?: string;
      publishedDate?: string;
      engine?: string;
    }) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.content || '',
      source: `News (${r.engine || 'unknown'})`,
    }));
    
  } catch (error) {
    console.error('[SearXNG] News search failed:', error);
    return [];
  }
}
