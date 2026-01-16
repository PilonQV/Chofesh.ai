/**
 * Gemini API with Google Search Grounding
 * 
 * Provides live web search using Gemini's built-in Google Search grounding.
 * 
 * Free tier: 500 queries/day
 * Paid tier: $35/1000 queries for Gemini 2.5 Flash
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not set - Gemini search grounding will not work');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface GeminiSearchResult {
  text: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    searchEntryPoint?: any;
  };
}

/**
 * Search the web using Gemini with Google Search grounding
 * 
 * @param query - The search query
 * @param model - The Gemini model to use (default: gemini-2.5-flash)
 * @returns AI-generated response with search results
 */
export async function searchWithGemini(
  query: string,
  model: string = 'gemini-2.5-flash'
): Promise<GeminiSearchResult> {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],  // Enable Google Search grounding
      },
    });
    
    // Extract text (text is a property, not a method)
    const text = response.text;
    
    // Extract grounding metadata if available
    let groundingMetadata: any = undefined;
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.groundingMetadata) {
        groundingMetadata = {
          webSearchQueries: candidate.groundingMetadata.webSearchQueries || [],
          searchEntryPoint: candidate.groundingMetadata.searchEntryPoint,
        };
      }
    }

    return {
      text,
      groundingMetadata,
    };
  } catch (error: any) {
    console.error('Gemini search error:', error);
    throw new Error(`Gemini search failed: ${error.message}`);
  }
}

/**
 * Check if a query needs real-time web search
 * 
 * Detects queries about:
 * - Current events, news, prices
 * - Recent information (today, this week, latest, etc.)
 * - Real-time data (weather, stock prices, etc.)
 */
export function needsWebSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Time-sensitive keywords
  const timeKeywords = [
    'today', 'now', 'current', 'latest', 'recent', 'this week', 'this month',
    'yesterday', 'last night', 'breaking', 'live', 'real-time', 'up to date'
  ];
  
  // Real-time data keywords
  const dataKeywords = [
    'price', 'cost', 'worth', 'value', 'quote', 'rate', 'exchange',
    'weather', 'forecast', 'temperature',
    'news', 'update', 'announcement', 'release',
    'score', 'result', 'winner', 'standings'
  ];
  
  // Check for time-sensitive keywords
  const hasTimeKeyword = timeKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // Check for real-time data keywords
  const hasDataKeyword = dataKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // Needs web search if it has time-sensitive OR data keywords
  return hasTimeKeyword || hasDataKeyword;
}

/**
 * Format Gemini search results for chat response
 * Returns clean text without revealing search mechanism
 */
export function formatSearchResults(result: GeminiSearchResult): string {
  // Return clean text without metadata - keep search transparent to users
  return result.text;
}
