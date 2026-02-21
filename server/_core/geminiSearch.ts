/**
 * Gemini API with Google Search Grounding
 *
 * Provides live web search using Gemini's built-in Google Search grounding.
 * This feature is optional — the server starts normally without a Gemini key.
 *
 * Free tier: 500 queries/day
 * Paid tier: $35/1000 queries for Gemini 2.5 Flash
 *
 * Set any of these env vars to enable:
 *   GEMINI_API_KEY | GOOGLE_API_KEY | GOOGLE_AI_API_KEY
 */

import { GoogleGenAI } from '@google/genai';

// Check multiple possible environment variable names
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_AI_API_KEY ||
  '';

if (!GEMINI_API_KEY) {
  console.info('[Gemini Search] No API key set — Gemini search grounding disabled.');
  console.info('  Set GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_AI_API_KEY to enable.');
} else {
  console.info('[Gemini Search] API key found — Gemini search grounding enabled.');
}

// Lazy singleton — only created when a key is actually present
let _ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key is not configured. Set GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_AI_API_KEY.'
    );
  }
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return _ai;
}

export interface GeminiSearchResult {
  text: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    searchEntryPoint?: any;
  };
}

/**
 * Returns true when Gemini search is available (key is configured).
 */
export function isGeminiSearchAvailable(): boolean {
  return !!GEMINI_API_KEY;
}

/**
 * Search the web using Gemini with Google Search grounding.
 * Throws a clear error if no API key is configured.
 *
 * @param query - The search query
 * @param model - The Gemini model to use (default: gemini-2.5-flash)
 */
export async function searchWithGemini(
  query: string,
  model: string = 'gemini-2.5-flash'
): Promise<GeminiSearchResult> {
  const ai = getAiClient(); // throws if no key

  try {
    const groundingTool = { googleSearch: {} };
    const config = { tools: [groundingTool] };

    const response = await ai.models.generateContent({
      model,
      contents: query,
      config,
    });

    const text = response.text || '';

    let groundingMetadata: any = undefined;
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.groundingMetadata) {
        groundingMetadata = {
          webSearchQueries: candidate.groundingMetadata.webSearchQueries || [],
          searchEntryPoint: candidate.groundingMetadata.searchEntryPoint,
        };
        console.log(
          '[Gemini Search] Grounded response with',
          groundingMetadata.webSearchQueries?.length || 0,
          'search queries'
        );
      }
    }

    return { text, groundingMetadata };
  } catch (error: any) {
    console.error('[Gemini Search] Error:', error.message);
    throw new Error(`Gemini search failed: ${error.message}`);
  }
}

/**
 * Check if a query needs real-time web search.
 * Detects queries about current events, prices, weather, etc.
 */
export function needsWebSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  const timeKeywords = [
    'today', 'now', 'current', 'latest', 'recent', 'this week', 'this month',
    'yesterday', 'last night', 'breaking', 'live', 'real-time', 'up to date',
  ];

  const dataKeywords = [
    'price', 'cost', 'worth', 'value', 'quote', 'rate', 'exchange',
    'weather', 'forecast', 'temperature',
    'news', 'update', 'announcement', 'release',
    'score', 'result', 'winner', 'standings',
  ];

  return (
    timeKeywords.some(k => lowerQuery.includes(k)) ||
    dataKeywords.some(k => lowerQuery.includes(k))
  );
}

/**
 * Format Gemini search results for chat response.
 */
export function formatSearchResults(result: GeminiSearchResult): string {
  return result.text;
}
