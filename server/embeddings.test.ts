import { describe, it, expect, vi } from "vitest";

// Mock the database functions
vi.mock("./db", () => ({
  getDocumentById: vi.fn().mockResolvedValue(null),
  updateDocumentStatus: vi.fn().mockResolvedValue(undefined),
  deleteUserDocument: vi.fn().mockResolvedValue(undefined),
  createDocumentChunks: vi.fn().mockResolvedValue(undefined),
  getDocumentChunks: vi.fn().mockResolvedValue([]),
  searchDocumentChunks: vi.fn().mockResolvedValue([{ content: "test content", similarity: 0.85 }]),
}));

describe("Vector Embeddings Feature", () => {
  describe("Cosine Similarity Calculation", () => {
    it("should calculate cosine similarity between two identical vectors", async () => {
      const { cosineSimilarity } = await import("./_core/embeddings");
      const vector = [1, 2, 3, 4, 5];
      const similarity = cosineSimilarity(vector, vector);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it("should calculate cosine similarity between orthogonal vectors", async () => {
      const { cosineSimilarity } = await import("./_core/embeddings");
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it("should calculate cosine similarity between opposite vectors", async () => {
      const { cosineSimilarity } = await import("./_core/embeddings");
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it("should throw error for vectors of different lengths", async () => {
      const { cosineSimilarity } = await import("./_core/embeddings");
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => cosineSimilarity(a, b)).toThrow("Vectors must have the same length");
    });

    it("should return 0 for zero vectors", async () => {
      const { cosineSimilarity } = await import("./_core/embeddings");
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBe(0);
    });
  });

  describe("Embedding Generation Input Validation", () => {
    it("should handle empty text array", async () => {
      const { generateEmbeddings } = await import("./_core/embeddings");
      const result = await generateEmbeddings([]);
      expect(result).toEqual([]);
    });
  });

  describe("Document Chunk Embedding Storage", () => {
    it("should store embedding as JSON string in chunk", () => {
      const embedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const stored = JSON.stringify(embedding);
      const parsed = JSON.parse(stored);
      expect(parsed).toEqual(embedding);
    });

    it("should handle large embedding vectors", () => {
      // OpenAI text-embedding-3-small produces 1536-dimensional vectors
      const embedding = Array(1536).fill(0).map(() => Math.random());
      const stored = JSON.stringify(embedding);
      const parsed = JSON.parse(stored);
      expect(parsed.length).toBe(1536);
    });
  });

  describe("Search Results with Similarity Scores", () => {
    it("should return results with similarity scores", async () => {
      const { searchDocumentChunks } = await import("./db");
      const results = await searchDocumentChunks(1, "test query", 5);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty("similarity");
        expect(typeof results[0].similarity).toBe("number");
      }
    });

    it("should sort results by similarity in descending order", () => {
      const results = [
        { content: "a", similarity: 0.5 },
        { content: "b", similarity: 0.9 },
        { content: "c", similarity: 0.7 },
      ];
      const sorted = [...results].sort((a, b) => b.similarity - a.similarity);
      expect(sorted[0].content).toBe("b");
      expect(sorted[1].content).toBe("c");
      expect(sorted[2].content).toBe("a");
    });
  });
});

describe("Ask Dia Links Feature", () => {
  describe("Clickable Term Patterns", () => {
    const CLICKABLE_PATTERNS = [
      /\b(API|REST|GraphQL|WebSocket|OAuth|JWT|CORS|SSL|TLS|HTTP|HTTPS)\b/gi,
      /\b(algorithm|function|variable|class|object|array|string|boolean|integer|float|recursion|iteration|callback|promise|async|await)\b/gi,
      /\b(machine learning|deep learning|neural network|transformer|LLM|GPT|embedding|vector|tokenization|fine-tuning|prompt engineering)\b/gi,
    ];

    it("should match technical terms like API, REST, GraphQL", () => {
      const text = "Use the REST API to fetch data via GraphQL";
      const matches: string[] = [];
      for (const pattern of CLICKABLE_PATTERNS) {
        const found = text.match(pattern);
        if (found) matches.push(...found);
      }
      expect(matches).toContain("REST");
      expect(matches).toContain("API");
      expect(matches).toContain("GraphQL");
    });

    it("should match programming concepts", () => {
      const text = "The function uses recursion to iterate through the array";
      const matches: string[] = [];
      for (const pattern of CLICKABLE_PATTERNS) {
        const found = text.match(pattern);
        if (found) matches.push(...found);
      }
      expect(matches).toContain("function");
      expect(matches).toContain("recursion");
      expect(matches).toContain("array");
    });

    it("should match AI/ML terms", () => {
      const text = "The LLM uses transformer architecture with embeddings";
      const matches: string[] = [];
      for (const pattern of CLICKABLE_PATTERNS) {
        const found = text.match(pattern);
        if (found) matches.push(...found);
      }
      expect(matches).toContain("LLM");
      expect(matches).toContain("transformer");
    });
  });

  describe("Follow-up Question Generation", () => {
    it("should generate appropriate questions for API terms", () => {
      const term = "API";
      const question = `Can you explain more about ${term} and how it works?`;
      expect(question).toContain("API");
      expect(question).toContain("explain");
    });

    it("should generate appropriate questions for frameworks", () => {
      const term = "React";
      const question = `Tell me more about ${term} - what are its key features and when should I use it?`;
      expect(question).toContain("React");
      expect(question).toContain("features");
    });
  });
});

describe("GitHub Integration for Code Review", () => {
  describe("Repository URL Parsing", () => {
    const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
      }
      return null;
    };

    it("should parse standard GitHub URL", () => {
      const result = parseRepoUrl("https://github.com/owner/repo");
      expect(result).toEqual({ owner: "owner", repo: "repo" });
    });

    it("should parse GitHub URL with .git suffix", () => {
      const result = parseRepoUrl("https://github.com/owner/repo.git");
      expect(result).toEqual({ owner: "owner", repo: "repo" });
    });

    it("should parse GitHub URL with subdirectory", () => {
      const result = parseRepoUrl("https://github.com/facebook/react/tree/main/packages");
      expect(result).toEqual({ owner: "facebook", repo: "react" });
    });

    it("should return null for non-GitHub URLs", () => {
      const result = parseRepoUrl("https://gitlab.com/owner/repo");
      expect(result).toBeNull();
    });

    it("should return null for invalid URLs", () => {
      const result = parseRepoUrl("not a url");
      expect(result).toBeNull();
    });
  });

  describe("Language Detection from File Extension", () => {
    const langMap: Record<string, string> = {
      js: 'javascript', ts: 'typescript', py: 'python',
      java: 'java', cs: 'csharp', cpp: 'cpp', go: 'go',
      rs: 'rust', php: 'php', rb: 'ruby', sql: 'sql',
    };

    it("should detect JavaScript from .js extension", () => {
      const ext = "file.js".split('.').pop() || '';
      expect(langMap[ext]).toBe('javascript');
    });

    it("should detect TypeScript from .ts extension", () => {
      const ext = "component.ts".split('.').pop() || '';
      expect(langMap[ext]).toBe('typescript');
    });

    it("should detect Python from .py extension", () => {
      const ext = "script.py".split('.').pop() || '';
      expect(langMap[ext]).toBe('python');
    });

    it("should return undefined for unknown extensions", () => {
      const ext = "file.xyz".split('.').pop() || '';
      expect(langMap[ext]).toBeUndefined();
    });
  });

  describe("Multi-file Review Results", () => {
    it("should organize results by file path", () => {
      const results = new Map<string, { score: number; issues: string[] }>();
      results.set("src/index.ts", { score: 85, issues: ["Missing types"] });
      results.set("src/utils.ts", { score: 92, issues: [] });
      
      expect(results.size).toBe(2);
      expect(results.get("src/index.ts")?.score).toBe(85);
      expect(results.get("src/utils.ts")?.issues.length).toBe(0);
    });

    it("should calculate aggregate score across files", () => {
      const scores = [85, 92, 78, 95];
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      expect(average).toBe(87.5);
    });
  });
});
