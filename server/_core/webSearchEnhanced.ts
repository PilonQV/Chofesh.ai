/**
 * Enhanced Web Search Service
 * Uses DuckDuckGo HTML search to get actual search results
 * Falls back to Instant Answer API if HTML parsing fails
 */

import { searchDuckDuckGo, type SearchResult } from './duckduckgo';
import { searchSonarAsResults, getRealtimeAnswer } from './perplexitySonar';

/**
 * Scrape DuckDuckGo HTML search results
 * This provides actual search results unlike the Instant Answer API
 */
async function scrapeDuckDuckGoHtml(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    // Use the lite version which is easier to parse
    const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    if (!response.ok) {
      console.error('[WebSearch] DuckDuckGo HTML error:', response.status);
      return [];
    }
    
    const html = await response.text();
    const results: SearchResult[] = [];
    
    // Parse the lite HTML results
    // The lite version has a simpler structure with result links and snippets
    const linkRegex = /<a[^>]+class="result-link"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    const snippetRegex = /<td[^>]+class="result-snippet"[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>)*[^<]*)<\/td>/gi;
    
    // Alternative parsing for standard DDG results
    const resultBlockRegex = /<tr[^>]*class="result-link"[^>]*>[\s\S]*?<\/tr>[\s\S]*?<tr[^>]*class="result-snippet"[^>]*>[\s\S]*?<\/tr>/gi;
    
    // Simple link extraction
    const simpleLinkRegex = /href="(https?:\/\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
    
    let match;
    const seenUrls = new Set<string>();
    
    // Extract all links that look like search results
    while ((match = simpleLinkRegex.exec(html)) !== null) {
      const url = match[1];
      const title = match[2].trim();
      
      // Filter out DDG internal links and duplicates
      if (
        url && 
        title && 
        !url.includes('duckduckgo.com') &&
        !url.includes('duck.co') &&
        !seenUrls.has(url) &&
        title.length > 3
      ) {
        seenUrls.add(url);
        results.push({
          title,
          url,
          description: '', // Will be filled if we can extract snippets
          source: 'DuckDuckGo',
        });
      }
      
      if (results.length >= 8) break;
    }
    
    return results;
  } catch (error) {
    console.error('[WebSearch] HTML scraping error:', error);
    return [];
  }
}

/**
 * Use a free search API (SerpAPI alternative)
 * This uses the DuckDuckGo JSON API with better parameters
 */
async function searchWithDDGJson(query: string): Promise<SearchResult[]> {
  try {
    // Try the DuckDuckGo API with different parameters
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_redirect=1&no_html=1&skip_disambig=1&t=chofesh`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Chofesh.ai/1.0 (AI Assistant; https://chofesh.ai)',
      },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    // Get abstract
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        description: data.AbstractText,
        source: data.AbstractSource || 'Wikipedia',
      });
    }
    
    // Get instant answer
    if (data.Answer) {
      results.push({
        title: `${query} - Instant Answer`,
        url: data.AbstractURL || '',
        description: data.Answer,
        source: 'DuckDuckGo',
      });
    }
    
    // Get related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 60),
            url: topic.FirstURL,
            description: topic.Text,
            source: 'DuckDuckGo',
          });
        }
        // Handle nested topics
        if (topic.Topics && Array.isArray(topic.Topics)) {
          for (const subtopic of topic.Topics.slice(0, 2)) {
            if (subtopic.Text && subtopic.FirstURL) {
              results.push({
                title: subtopic.Text.split(' - ')[0] || subtopic.Text.substring(0, 60),
                url: subtopic.FirstURL,
                description: subtopic.Text,
                source: 'DuckDuckGo',
              });
            }
          }
        }
      }
    }
    
    // Get direct results
    if (data.Results && Array.isArray(data.Results)) {
      for (const result of data.Results.slice(0, 3)) {
        if (result.Text && result.FirstURL) {
          results.push({
            title: result.Text.split(' - ')[0] || result.Text.substring(0, 60),
            url: result.FirstURL,
            description: result.Text,
            source: 'DuckDuckGo',
          });
        }
      }
    }
    
    return results.slice(0, 8);
  } catch (error) {
    console.error('[WebSearch] DDG JSON error:', error);
    return [];
  }
}

/**
 * Enhanced web search that combines multiple sources
 */
export async function enhancedWebSearch(query: string): Promise<SearchResult[]> {
  console.log(`[WebSearch] Searching for: "${query}"`);
  
  // Try Perplexity Sonar first (best quality, has built-in search)
  let results: SearchResult[] = [];
  
  // Try Perplexity Sonar via OpenRouter - excellent search with citations
  const sonarResults = await searchSonarAsResults(query).catch((err) => {
    console.error('[WebSearch] Sonar error:', err);
    return [] as SearchResult[];
  });
  
  if (sonarResults.length > 0) {
    console.log(`[WebSearch] Got ${sonarResults.length} results from Perplexity Sonar`);
    results = sonarResults;
  }
  
  // If Sonar didn't work, try DuckDuckGo methods as fallback
  if (results.length === 0) {
    console.log('[WebSearch] Sonar returned no results, trying DuckDuckGo...');
    const [ddgResults, htmlResults] = await Promise.all([
      searchWithDDGJson(query),
      scrapeDuckDuckGoHtml(query).catch(() => [] as SearchResult[]),
    ]);
    
    // Combine and deduplicate results
    const seenUrls = new Set<string>();
    
    for (const result of ddgResults) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        results.push(result);
      }
    }
    
    for (const result of htmlResults) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        results.push(result);
      }
    }
  }
  
  console.log(`[WebSearch] Total results: ${results.length}`);
  
  // If we still have no results, fall back to the original DDG search
  if (results.length === 0) {
    console.log('[WebSearch] Falling back to original DDG search');
    return searchDuckDuckGo(query);
  }
  
  return results.slice(0, 8);
}

/**
 * Search specifically for price/financial data
 */
export async function searchPrice(asset: string): Promise<SearchResult[]> {
  const queries = [
    `${asset} price today USD`,
    `${asset} current price`,
  ];
  
  const results: SearchResult[] = [];
  
  for (const query of queries) {
    const searchResults = await enhancedWebSearch(query);
    results.push(...searchResults);
    if (results.length >= 5) break;
  }
  
  // Deduplicate
  const seenUrls = new Set<string>();
  return results.filter(r => {
    if (seenUrls.has(r.url)) return false;
    seenUrls.add(r.url);
    return true;
  }).slice(0, 8);
}
