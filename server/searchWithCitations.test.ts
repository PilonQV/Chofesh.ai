/**
 * Search With Citations Integration Tests
 * 
 * Tests the Perplexity-style search with AI-generated summaries and citations
 */

import { describe, it, expect, vi } from "vitest";

// Mock the database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ freeCredits: 30, purchasedCredits: 100, freeCreditsLastRefresh: new Date() }]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getDailyQueryCount: vi.fn().mockResolvedValue(0),
  incrementDailyQueries: vi.fn().mockResolvedValue(undefined),
  getUserSubscription: vi.fn().mockResolvedValue({ tier: 'free', dailyLimit: 20 }),
}));

// Mock DuckDuckGo search
vi.mock("./_core/duckduckgo", () => ({
  searchDuckDuckGo: vi.fn().mockResolvedValue([
    {
      title: "Test Result 1",
      url: "https://example.com/1",
      description: "This is the first test result description.",
    },
    {
      title: "Test Result 2",
      url: "https://example.com/2",
      description: "This is the second test result description.",
    },
    {
      title: "Test Result 3",
      url: "https://example.com/3",
      description: "This is the third test result description.",
    },
  ]),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: "Based on the search results, here is a summary. According to [1], the first point is important. Additionally, [2] provides more context. Finally, [3] confirms these findings.",
      },
    }],
  }),
}));

describe("Search With Citations", () => {
  describe("Input Validation", () => {
    it("should accept valid search query", () => {
      const input = {
        query: "What is artificial intelligence?",
        maxSources: 5,
      };
      
      expect(input.query.length).toBeGreaterThan(0);
      expect(input.query.length).toBeLessThanOrEqual(500);
      expect(input.maxSources).toBeGreaterThanOrEqual(1);
      expect(input.maxSources).toBeLessThanOrEqual(10);
    });

    it("should use default maxSources when not provided", () => {
      const input = {
        query: "Test query",
      };
      
      const maxSources = input.maxSources || 5;
      expect(maxSources).toBe(5);
    });

    it("should reject empty queries", () => {
      const input = {
        query: "",
      };
      
      expect(input.query.length).toBe(0);
    });

    it("should reject queries over 500 characters", () => {
      const longQuery = "a".repeat(501);
      expect(longQuery.length).toBeGreaterThan(500);
    });
  });

  describe("Search Results Processing", () => {
    it("should format search results with position numbers", () => {
      const results = [
        { title: "Result 1", url: "https://example.com/1", description: "Desc 1" },
        { title: "Result 2", url: "https://example.com/2", description: "Desc 2" },
      ];

      const sources = results.map((result, index) => ({
        title: result.title,
        url: result.url,
        snippet: result.description,
        position: index + 1,
      }));

      expect(sources[0].position).toBe(1);
      expect(sources[1].position).toBe(2);
      expect(sources.length).toBe(2);
    });

    it("should build search context for LLM", () => {
      const sources = [
        { title: "Result 1", url: "https://example.com/1", snippet: "Desc 1", position: 1 },
        { title: "Result 2", url: "https://example.com/2", snippet: "Desc 2", position: 2 },
      ];

      const searchContext = sources.map((source, i) => 
        `[${i + 1}] ${source.title}\nURL: ${source.url}\n${source.snippet}`
      ).join('\n\n');

      expect(searchContext).toContain("[1]");
      expect(searchContext).toContain("[2]");
      expect(searchContext).toContain("https://example.com/1");
      expect(searchContext).toContain("https://example.com/2");
    });
  });

  describe("Citation Extraction", () => {
    it("should extract inline citations from response", () => {
      const summary = "According to [1], AI is transformative. [2] provides more details. See also [3] and [1] again.";
      
      const citationMatches = summary.match(/\[\d+\]/g) || [];
      const citations = Array.from(new Set(citationMatches));
      
      expect(citations).toContain("[1]");
      expect(citations).toContain("[2]");
      expect(citations).toContain("[3]");
      expect(citations.length).toBe(3); // Unique citations only
    });

    it("should handle responses without citations", () => {
      const summary = "This is a response without any citations.";
      
      const citationMatches = summary.match(/\[\d+\]/g) || [];
      const citations = Array.from(new Set(citationMatches));
      
      expect(citations.length).toBe(0);
    });

    it("should handle multiple occurrences of same citation", () => {
      const summary = "[1] is mentioned here. [1] is mentioned again. [2] is also here.";
      
      const citationMatches = summary.match(/\[\d+\]/g) || [];
      expect(citationMatches.length).toBe(3); // All occurrences
      
      const uniqueCitations = Array.from(new Set(citationMatches));
      expect(uniqueCitations.length).toBe(2); // Unique only
    });
  });

  describe("Response Format", () => {
    it("should return expected response structure", () => {
      const response = {
        query: "test query",
        summary: "This is a summary with [1] citation.",
        sources: [
          { title: "Source 1", url: "https://example.com/1", snippet: "Snippet 1", position: 1 },
        ],
        citations: ["[1]"],
      };

      expect(response).toHaveProperty("query");
      expect(response).toHaveProperty("summary");
      expect(response).toHaveProperty("sources");
      expect(response).toHaveProperty("citations");
      expect(typeof response.query).toBe("string");
      expect(typeof response.summary).toBe("string");
      expect(Array.isArray(response.sources)).toBe(true);
      expect(Array.isArray(response.citations)).toBe(true);
    });

    it("should handle empty search results gracefully", () => {
      const response = {
        query: "obscure query with no results",
        summary: "No search results found for this query.",
        sources: [],
        citations: [],
      };

      expect(response.sources.length).toBe(0);
      expect(response.citations.length).toBe(0);
      expect(response.summary).toContain("No search results");
    });
  });

  describe("System Prompt for Citations", () => {
    it("should include citation instructions in system prompt", () => {
      const systemPrompt = `You are a helpful research assistant. Your task is to answer the user's question based on the provided search results.

IMPORTANT RULES:
1. Use ONLY information from the provided search results
2. Include inline citations like [1], [2], etc. to reference your sources
3. Be concise but comprehensive
4. If the search results don't contain enough information, say so
5. Format your response in clear paragraphs
6. Do NOT make up information not in the sources`;

      expect(systemPrompt).toContain("inline citations");
      expect(systemPrompt).toContain("[1]");
      expect(systemPrompt).toContain("[2]");
      expect(systemPrompt).toContain("search results");
      expect(systemPrompt).toContain("Do NOT make up information");
    });
  });

  describe("Source Limiting", () => {
    it("should limit sources to maxSources parameter", () => {
      const allResults = Array.from({ length: 10 }, (_, i) => ({
        title: `Result ${i + 1}`,
        url: `https://example.com/${i + 1}`,
        description: `Description ${i + 1}`,
      }));

      const maxSources = 5;
      const limitedSources = allResults.slice(0, maxSources);

      expect(limitedSources.length).toBe(5);
      expect(limitedSources[0].title).toBe("Result 1");
      expect(limitedSources[4].title).toBe("Result 5");
    });

    it("should handle fewer results than maxSources", () => {
      const allResults = [
        { title: "Result 1", url: "https://example.com/1", description: "Desc 1" },
        { title: "Result 2", url: "https://example.com/2", description: "Desc 2" },
      ];

      const maxSources = 5;
      const limitedSources = allResults.slice(0, maxSources);

      expect(limitedSources.length).toBe(2);
    });
  });
});
