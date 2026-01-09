/**
 * Agent Tools - Manus-like capabilities for the AI chat
 * 
 * These tools allow the AI to:
 * - Generate images from text descriptions
 * - Search the web for current information
 * - Create and download documents
 * - Execute simple code/calculations
 */

import { generateVeniceImage } from './veniceImage';

// Tool result types
export interface ImageToolResult {
  type: 'image';
  urls: string[];  // Array of image URLs (4 images)
  prompt: string;
  model: string;
}

export interface SearchToolResult {
  type: 'search';
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  summary?: string;
}

export interface DocumentToolResult {
  type: 'document';
  title: string;
  content: string;
  format: 'markdown' | 'text' | 'html';
}

export interface CodeToolResult {
  type: 'code';
  code: string;
  language: string;
  output: string;
  error?: string;
}

export type ToolResult = ImageToolResult | SearchToolResult | DocumentToolResult | CodeToolResult;

/**
 * Agent Tools class - provides tool execution capabilities
 */
export class AgentTools {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  /**
   * Generate 4 images from a text prompt (10 credits for 4 images)
   */
  async generateImage(params: { prompt: string; style?: string; count?: number }): Promise<ImageToolResult> {
    const imageCount = params.count || 4; // Default to 4 images
    console.log(`[AgentTools] Generating ${imageCount} images:`, params.prompt);
    
    try {
      // Generate multiple images in parallel
      const imagePromises = Array.from({ length: imageCount }, () =>
        generateVeniceImage({
          prompt: params.prompt,
          model: 'hidream', // Use high-quality model
          nsfw: false,
          size: '1024x1024',
        })
      );
      
      const results = await Promise.all(imagePromises);
      const urls = results.map(r => r.url);
      
      console.log(`[AgentTools] Generated ${urls.length} images successfully`);
      
      return {
        type: 'image',
        urls,
        prompt: params.prompt,
        model: 'hidream',
      };
    } catch (error: any) {
      console.error('[AgentTools] Image generation failed:', error);
      throw new Error(`Failed to generate images: ${error.message}`);
    }
  }
  
  /**
   * Search the web for information
   */
  async searchWeb(params: { query: string; maxResults?: number }): Promise<SearchToolResult> {
    console.log('[AgentTools] Searching web:', params.query);
    
    const maxResults = params.maxResults || 5;
    
    try {
      // Use DuckDuckGo instant answer API (free, no API key needed)
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(params.query)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      const results: SearchToolResult['results'] = [];
      
      // Add abstract if available
      if (data.Abstract) {
        results.push({
          title: data.Heading || 'Summary',
          url: data.AbstractURL || '',
          snippet: data.Abstract,
        });
      }
      
      // Add related topics
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related',
              url: topic.FirstURL,
              snippet: topic.Text,
            });
          }
        }
      }
      
      // If no results from DDG, provide a fallback message
      if (results.length === 0) {
        results.push({
          title: 'Search Results',
          url: `https://duckduckgo.com/?q=${encodeURIComponent(params.query)}`,
          snippet: `Search for "${params.query}" on DuckDuckGo for more results.`,
        });
      }
      
      return {
        type: 'search',
        query: params.query,
        results,
        summary: data.Abstract || undefined,
      };
    } catch (error: any) {
      console.error('[AgentTools] Web search failed:', error);
      return {
        type: 'search',
        query: params.query,
        results: [{
          title: 'Search Error',
          url: `https://duckduckgo.com/?q=${encodeURIComponent(params.query)}`,
          snippet: `Unable to fetch results. Try searching directly on DuckDuckGo.`,
        }],
      };
    }
  }
  
  /**
   * Create a document with the given content
   */
  async createDocument(params: { 
    title: string; 
    content: string; 
    format?: 'markdown' | 'text' | 'html' 
  }): Promise<DocumentToolResult> {
    console.log('[AgentTools] Creating document:', params.title);
    
    return {
      type: 'document',
      title: params.title,
      content: params.content,
      format: params.format || 'markdown',
    };
  }
  
  /**
   * Execute simple code/calculations
   */
  async executeCode(params: { code: string; language?: string }): Promise<CodeToolResult> {
    console.log('[AgentTools] Executing code');
    
    const language = params.language || 'javascript';
    
    // Only support simple JavaScript math expressions for safety
    if (language === 'javascript' || language === 'js') {
      try {
        // Very restricted evaluation - only math operations
        const sanitizedCode = params.code
          .replace(/[^0-9+\-*/%().Math\s]/g, '')
          .trim();
        
        if (!sanitizedCode) {
          return {
            type: 'code',
            code: params.code,
            language,
            output: '',
            error: 'Only mathematical expressions are supported for security reasons.',
          };
        }
        
        // Use Function constructor for slightly safer eval
        const result = new Function(`return ${sanitizedCode}`)();
        
        return {
          type: 'code',
          code: params.code,
          language,
          output: String(result),
        };
      } catch (error: any) {
        return {
          type: 'code',
          code: params.code,
          language,
          output: '',
          error: error.message,
        };
      }
    }
    
    return {
      type: 'code',
      code: params.code,
      language,
      output: '',
      error: `Language "${language}" is not supported. Only JavaScript math expressions are allowed.`,
    };
  }
}

/**
 * Get agent tools instance for a user
 */
export function getAgentTools(userId: string): AgentTools {
  return new AgentTools(userId);
}

/**
 * Intent detection patterns for automatic tool triggering
 */
export const INTENT_PATTERNS = {
  image: [
    /^(please\s+)?(draw|paint|sketch|illustrate)\s+(me\s+)?/i,
    /^(please\s+)?(generate|create|make)\s+(me\s+)?(a|an|the)?\s*(image|picture|photo|illustration|art|artwork|painting|portrait|scene|logo|icon)/i,
    /\b(show|visualize|depict)\s+(me\s+)?.*\b(image|picture|visual)/i,
    /\bimage\s+of\b/i,
    /\bpicture\s+of\b/i,
    /\bgenerate\s+(an?\s+)?image/i,
  ],
  search: [
    /^(please\s+)?(search|look up|find|google)\s+(for\s+)?/i,
    /\bwhat('s| is| are)\s+the\s+(latest|current|recent)\b/i,
    /\bwho\s+(is|are|was|were)\b/i,
    /\bwhen\s+(did|was|is|will)\b/i,
    /\bhow\s+(do|does|did|can|to)\b/i,
    /\bsearch\s+(the\s+)?(web|internet)\s+(for\s+)?/i,
  ],
  document: [
    /^(please\s+)?(create|write|generate|make)\s+(me\s+)?(a|an|the)?\s*(document|doc|report|article|essay|summary|outline)/i,
    /\bwrite\s+(me\s+)?(a|an)?\s*(document|report|article)/i,
  ],
  code: [
    /^(please\s+)?(calculate|compute|solve|evaluate)\s+/i,
    /\bwhat\s+is\s+\d+\s*[\+\-\*\/]\s*\d+/i,
    /\bcalculate\s+/i,
  ],
};

/**
 * Detect intent from user message
 */
export function detectIntent(message: string): 'image' | 'search' | 'document' | 'code' | null {
  const lowerMessage = message.toLowerCase();
  
  // Check each intent type
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return intent as 'image' | 'search' | 'document' | 'code';
      }
    }
  }
  
  return null;
}

/**
 * Extract parameters from user message based on intent
 */
export function extractParams(message: string, intent: string): Record<string, any> {
  switch (intent) {
    case 'image': {
      // Extract the image description
      let prompt = message
        .replace(/^(please\s+)?/i, '')
        .replace(/\b(draw|generate|create|make|paint|design|render|illustrate|show|visualize|depict)\s+(me\s+)?/i, '')
        .replace(/\b(a|an|the)\s+(image|picture|photo|illustration|art|artwork|painting|portrait|scene|logo|icon)\s+(of\s+)?/i, '')
        .trim();
      
      if (!prompt || prompt.length < 3) {
        prompt = message;
      }
      
      return { prompt };
    }
    
    case 'search': {
      // Extract the search query
      let query = message
        .replace(/^(please\s+)?/i, '')
        .replace(/\b(search|look up|find|google)\s+(for\s+)?/i, '')
        .replace(/\bsearch\s+(the\s+)?(web|internet)\s+(for\s+)?/i, '')
        .trim();
      
      if (!query || query.length < 3) {
        query = message;
      }
      
      return { query };
    }
    
    case 'document': {
      // Extract document parameters
      const titleMatch = message.match(/(?:titled?|called?|named?)\s+["']?([^"']+)["']?/i);
      const title = titleMatch ? titleMatch[1] : 'Generated Document';
      
      let content = message
        .replace(/^(please\s+)?/i, '')
        .replace(/\b(create|write|generate|make)\s+(me\s+)?(a|an|the)?\s*(document|doc|report|article|essay|summary|outline)\b/i, '')
        .replace(/(?:titled?|called?|named?)\s+["']?[^"']+["']?/i, '')
        .trim();
      
      return { title, content };
    }
    
    case 'code': {
      // Extract the expression to calculate
      let code = message
        .replace(/^(please\s+)?/i, '')
        .replace(/\b(calculate|compute|solve|evaluate|what\s+is)\s+/i, '')
        .trim();
      
      return { code, language: 'javascript' };
    }
    
    default:
      return {};
  }
}
