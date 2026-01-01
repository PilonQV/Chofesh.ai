import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  analyzeQueryComplexity,
  selectModel,
  estimateCost,
  getModelsByTier,
  getCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearUserCache,
  getTemplatesByCategory,
  getTemplateById,
  applyTemplate,
  AVAILABLE_MODELS,
  PROMPT_TEMPLATES,
} from "./modelRouter";

describe("Model Router", () => {
  describe("analyzeQueryComplexity", () => {
    it("should return 'simple' for short, basic queries", () => {
      const messages = [{ role: "user" as const, content: "Hello" }];
      expect(analyzeQueryComplexity(messages)).toBe("simple");
    });

    it("should return 'simple' for basic questions", () => {
      const messages = [{ role: "user" as const, content: "What is the weather today?" }];
      expect(analyzeQueryComplexity(messages)).toBe("simple");
    });

    it("should return 'medium' for moderate length queries", () => {
      const messages = [
        { role: "user" as const, content: "Can you explain how photosynthesis works in plants and why it's important for the ecosystem?" }
      ];
      const result = analyzeQueryComplexity(messages);
      expect(["simple", "medium"]).toContain(result);
    });

    it("should return 'medium' or 'complex' for queries with code keywords", () => {
      const messages = [
        { role: "user" as const, content: "Write a Python function to implement a binary search algorithm with error handling" }
      ];
      const result = analyzeQueryComplexity(messages);
      expect(["medium", "complex"]).toContain(result);
    });

    it("should return 'medium' or 'complex' for queries with analysis keywords", () => {
      const messages = [
        { role: "user" as const, content: "Analyze the economic implications of climate change on developing nations" }
      ];
      const result = analyzeQueryComplexity(messages);
      expect(["medium", "complex"]).toContain(result);
    });

    it("should handle conversation history", () => {
      const messages = [
        { role: "user" as const, content: "Hi" },
        { role: "assistant" as const, content: "Hello!" },
        { role: "user" as const, content: "How are you?" },
        { role: "assistant" as const, content: "I'm doing well!" },
        { role: "user" as const, content: "Great" },
        { role: "assistant" as const, content: "Thanks!" },
        { role: "user" as const, content: "Tell me more" },
      ];
      const result = analyzeQueryComplexity(messages);
      expect(["simple", "medium", "complex"]).toContain(result);
    });
  });

  describe("selectModel", () => {
    it("should select a free tier model in 'free' mode", () => {
      const messages = [{ role: "user" as const, content: "Hello" }];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "free");
      expect(model.tier).toBe("free");
    });

    it("should select based on complexity in 'auto' mode", () => {
      const simpleMessages = [{ role: "user" as const, content: "Hi" }];
      const simpleModel = selectModel(analyzeQueryComplexity(simpleMessages), "auto");
      expect(["free", "standard"]).toContain(simpleModel.tier);

      const complexMessages = [
        { role: "user" as const, content: "Write a comprehensive analysis of machine learning algorithms" }
      ];
      const complexModel = selectModel(analyzeQueryComplexity(complexMessages), "auto");
      expect(complexModel).toBeDefined();
    });

    it("should return a valid model for any complexity", () => {
      const complexities = ["simple", "medium", "complex"] as const;
      const modes = ["auto", "free", "manual"] as const;

      for (const complexity of complexities) {
        for (const mode of modes) {
          const model = selectModel(complexity, mode);
          expect(model).toBeDefined();
          expect(model.id).toBeDefined();
          expect(model.name).toBeDefined();
        }
      }
    });
  });

  describe("estimateCost", () => {
    it("should calculate cost correctly", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "gpt-4o-mini");
      if (model) {
        const cost = estimateCost(model, 1000, 500);
        expect(cost).toBeGreaterThanOrEqual(0);
        expect(typeof cost).toBe("number");
      }
    });

    it("should return 0 for free tier models", () => {
      const freeModel = AVAILABLE_MODELS.find(m => m.tier === "free");
      if (freeModel) {
        const cost = estimateCost(freeModel, 1000, 500);
        expect(cost).toBe(0);
      }
    });

    it("should scale with token count", () => {
      const model = AVAILABLE_MODELS.find(m => m.costPer1kInput > 0);
      if (model) {
        const cost1 = estimateCost(model, 1000, 500);
        const cost2 = estimateCost(model, 2000, 1000);
        expect(cost2).toBeGreaterThan(cost1);
      }
    });
  });

  describe("getModelsByTier", () => {
    it("should return all models when no tier specified", () => {
      const models = getModelsByTier();
      expect(models.length).toBe(AVAILABLE_MODELS.length);
    });

    it("should filter by free tier", () => {
      const models = getModelsByTier("free");
      expect(models.every(m => m.tier === "free")).toBe(true);
    });

    it("should filter by standard tier", () => {
      const models = getModelsByTier("standard");
      expect(models.every(m => m.tier === "standard")).toBe(true);
    });

    it("should filter by premium tier", () => {
      const models = getModelsByTier("premium");
      expect(models.every(m => m.tier === "premium")).toBe(true);
    });
  });
});

describe("Response Cache", () => {
  beforeEach(() => {
    clearUserCache();
  });

  it("should generate consistent cache keys", () => {
    const messages = [{ role: "user" as const, content: "Hello" }];
    const key1 = getCacheKey(messages, "gpt-4o-mini");
    const key2 = getCacheKey(messages, "gpt-4o-mini");
    expect(key1).toBe(key2);
  });

  it("should generate different keys for different messages", () => {
    const messages1 = [{ role: "user" as const, content: "Hello" }];
    const messages2 = [{ role: "user" as const, content: "Hi" }];
    const key1 = getCacheKey(messages1, "gpt-4o-mini");
    const key2 = getCacheKey(messages2, "gpt-4o-mini");
    expect(key1).not.toBe(key2);
  });

  it("should generate different keys for different models", () => {
    const messages = [{ role: "user" as const, content: "Hello" }];
    const key1 = getCacheKey(messages, "gpt-4o-mini");
    const key2 = getCacheKey(messages, "gpt-4o");
    expect(key1).not.toBe(key2);
  });

  it("should store and retrieve cached responses", () => {
    const messages = [{ role: "user" as const, content: "Hello" }];
    const cacheKey = getCacheKey(messages, "gpt-4o-mini");
    
    setCachedResponse(cacheKey, "Hello there!", "gpt-4o-mini");
    const cached = getCachedResponse(cacheKey);
    
    expect(cached).not.toBeNull();
    expect(cached?.response).toBe("Hello there!");
    expect(cached?.model).toBe("gpt-4o-mini");
  });

  it("should return null for non-existent cache keys", () => {
    const cached = getCachedResponse("non-existent-key");
    expect(cached).toBeNull();
  });

  it("should clear cache", () => {
    const messages = [{ role: "user" as const, content: "Hello" }];
    const cacheKey = getCacheKey(messages, "gpt-4o-mini");
    
    setCachedResponse(cacheKey, "Hello there!", "gpt-4o-mini");
    clearUserCache();
    
    const cached = getCachedResponse(cacheKey);
    expect(cached).toBeNull();
  });
});

describe("Prompt Templates", () => {
  it("should have templates defined", () => {
    expect(PROMPT_TEMPLATES.length).toBeGreaterThan(0);
  });

  it("should return all templates when no category specified", () => {
    const templates = getTemplatesByCategory();
    expect(templates.length).toBe(PROMPT_TEMPLATES.length);
  });

  it("should filter templates by category", () => {
    const writingTemplates = getTemplatesByCategory("writing");
    expect(writingTemplates.every(t => t.category === "writing")).toBe(true);
  });

  it("should find template by id", () => {
    const firstTemplate = PROMPT_TEMPLATES[0];
    const found = getTemplateById(firstTemplate.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(firstTemplate.id);
  });

  it("should return undefined for non-existent template id", () => {
    const found = getTemplateById("non-existent-id");
    expect(found).toBeUndefined();
  });

  it("should apply template variables", () => {
    const template = {
      id: "test",
      name: "Test",
      category: "writing" as const,
      description: "Test template",
      prompt: "Hello {{name}}, welcome to {{place}}!",
      variables: ["name", "place"],
    };
    
    const result = applyTemplate(template, { name: "John", place: "LibreAI" });
    expect(result).toBe("Hello John, welcome to LibreAI!");
  });

  it("should handle missing variables gracefully", () => {
    const template = {
      id: "test",
      name: "Test",
      category: "writing" as const,
      description: "Test template",
      prompt: "Hello {{name}}!",
      variables: ["name"],
    };
    
    const result = applyTemplate(template, {});
    expect(result).toBe("Hello {{name}}!");
  });

  it("should replace all occurrences of a variable", () => {
    const template = {
      id: "test",
      name: "Test",
      category: "writing" as const,
      description: "Test template",
      prompt: "{{name}} said hello. {{name}} is happy.",
      variables: ["name"],
    };
    
    const result = applyTemplate(template, { name: "Alice" });
    expect(result).toBe("Alice said hello. Alice is happy.");
  });
});

describe("Available Models", () => {
  it("should have models defined", () => {
    expect(AVAILABLE_MODELS.length).toBeGreaterThan(0);
  });

  it("should have required properties for each model", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.provider).toBeDefined();
      expect(model.tier).toBeDefined();
      expect(typeof model.costPer1kInput).toBe("number");
      expect(typeof model.costPer1kOutput).toBe("number");
    }
  });

  it("should have at least one free tier model", () => {
    const freeModels = AVAILABLE_MODELS.filter(m => m.tier === "free");
    expect(freeModels.length).toBeGreaterThan(0);
  });

  it("should have valid tier values", () => {
    const validTiers = ["free", "standard", "premium"];
    for (const model of AVAILABLE_MODELS) {
      expect(validTiers).toContain(model.tier);
    }
  });
});
