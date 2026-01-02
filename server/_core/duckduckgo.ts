/**
 * DuckDuckGo Instant Answer API
 * Free API that provides instant answers, definitions, and summaries
 * Documentation: https://api.duckduckgo.com/api
 */

export interface DuckDuckGoResult {
  Abstract: string;
  AbstractText: string;
  AbstractSource: string;
  AbstractURL: string;
  Image: string;
  Heading: string;
  Answer: string;
  AnswerType: string;
  Definition: string;
  DefinitionSource: string;
  DefinitionURL: string;
  RelatedTopics: Array<{
    Text: string;
    FirstURL: string;
    Icon?: { URL: string };
  }>;
  Results: Array<{
    Text: string;
    FirstURL: string;
  }>;
  Type: string; // A (article), D (disambiguation), C (category), N (name), E (exclusive), "" (nothing)
  Redirect: string;
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  source: string;
}

export async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Chofesh.ai/1.0 (AI Assistant)',
      },
    });
    
    if (!response.ok) {
      console.error('DuckDuckGo API error:', response.status);
      return [];
    }
    
    const data: DuckDuckGoResult = await response.json();
    const results: SearchResult[] = [];
    
    // Add main abstract if available
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        description: data.AbstractText,
        source: data.AbstractSource || 'DuckDuckGo',
      });
    }
    
    // Add answer if available
    if (data.Answer) {
      results.push({
        title: `Answer: ${query}`,
        url: '',
        description: data.Answer,
        source: 'DuckDuckGo Instant Answer',
      });
    }
    
    // Add definition if available
    if (data.Definition && data.DefinitionURL) {
      results.push({
        title: `Definition: ${data.Heading || query}`,
        url: data.DefinitionURL,
        description: data.Definition,
        source: data.DefinitionSource || 'DuckDuckGo',
      });
    }
    
    // Add related topics (up to 3)
    for (const topic of data.RelatedTopics.slice(0, 3)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 50),
          url: topic.FirstURL,
          description: topic.Text,
          source: 'DuckDuckGo',
        });
      }
    }
    
    // Add direct results if available
    for (const result of data.Results.slice(0, 2)) {
      if (result.Text && result.FirstURL) {
        results.push({
          title: result.Text.split(' - ')[0] || result.Text.slice(0, 50),
          url: result.FirstURL,
          description: result.Text,
          source: 'DuckDuckGo',
        });
      }
    }
    
    return results.slice(0, 5); // Return max 5 results
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}
