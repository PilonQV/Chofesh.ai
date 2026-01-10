/**
 * Tests for AI Providers Integration
 * 
 * Tests the unified AI provider service and model routing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AVAILABLE_MODELS, analyzeQueryComplexity, selectModel, getModelsByTier } from "./modelRouter";

describe("AI Providers Integration", () => {
  describe("Model Configuration", () => {
    it("should have free models from multiple providers", () => {
      const freeModels = AVAILABLE_MODELS.filter(m => m.tier === "free");
      expect(freeModels.length).toBeGreaterThan(5);
      
      // Check for different providers
      const providers = new Set(freeModels.map(m => m.provider));
      expect(providers.has("groq")).toBe(true);
      expect(providers.has("openrouter")).toBe(true);
      expect(providers.has("puter")).toBe(true);
    });

    it("should have Groq models configured", () => {
      const groqModels = AVAILABLE_MODELS.filter(m => m.provider === "groq");
      expect(groqModels.length).toBeGreaterThan(0);
      
      // Check for specific Groq models
      const modelIds = groqModels.map(m => m.id);
      expect(modelIds).toContain("llama-3.1-8b");
      expect(modelIds).toContain("mixtral-8x7b");
    });

    it("should have OpenRouter free models configured", () => {
      const openRouterModels = AVAILABLE_MODELS.filter(m => m.provider === "openrouter");
      expect(openRouterModels.length).toBeGreaterThan(0);
      
      // Check for specific OpenRouter models
      const modelIds = openRouterModels.map(m => m.id);
      expect(modelIds).toContain("deepseek-r1-free");
      expect(modelIds).toContain("venice-uncensored");
    });

    it("should have Puter.js models configured", () => {
      const puterModels = AVAILABLE_MODELS.filter(m => m.provider === "puter");
      expect(puterModels.length).toBeGreaterThan(0);
      
      // Puter models should be free
      puterModels.forEach(m => {
        expect(m.tier).toBe("free");
        expect(m.costPer1kInput).toBe(0);
        expect(m.costPer1kOutput).toBe(0);
      });
    });

    it("should have new OpenRouter models", () => {
      const modelIds = AVAILABLE_MODELS.map(m => m.id);
      
      // Check for newly added OpenRouter models
      expect(modelIds).toContain("llama-3.1-405b-free");
      expect(modelIds).toContain("hermes-3-405b-free");
      expect(modelIds).toContain("kimi-k2-free");
      expect(modelIds).toContain("mistral-small-free");
      expect(modelIds).toContain("qwen-vl-free");
      expect(modelIds).toContain("gemma-3-27b-free");
    });

    it("should have new Groq models", () => {
      const modelIds = AVAILABLE_MODELS.map(m => m.id);
      
      // Check for newly added Groq models
      expect(modelIds).toContain("llama-3.3-70b-groq");
      expect(modelIds).toContain("gemma2-9b-groq");
    });
  });

  describe("Query Complexity Analysis", () => {
    it("should classify simple queries correctly", () => {
      const simpleQueries = [
        [{ role: "user", content: "What is the capital of France?" }],
        [{ role: "user", content: "Define photosynthesis" }],
        [{ role: "user", content: "Who is Albert Einstein?" }],
      ];

      simpleQueries.forEach(messages => {
        const complexity = analyzeQueryComplexity(messages);
        expect(complexity).toBe("simple");
      });
    });

    it("should classify complex queries correctly", () => {
      const complexQueries = [
        [{ role: "user", content: "Write a Python function to implement a binary search tree with insert, delete, and search operations. Include error handling and unit tests." }],
        [{ role: "user", content: "Analyze the economic implications of climate change on developing nations and compare different policy approaches." }],
      ];

      complexQueries.forEach(messages => {
        const complexity = analyzeQueryComplexity(messages);
        expect(["medium", "complex"]).toContain(complexity);
      });
    });
  });

  describe("Model Selection", () => {
    it("should select free models in free mode", () => {
      const model = selectModel("simple", "free");
      expect(model.tier).toBe("free");
    });

    it("should select reasoning model for complex queries in free mode", () => {
      const model = selectModel("complex", "free");
      expect(model.tier).toBe("free");
      expect(model.id).toBe("deepseek-r1-free");
    });

    it("should respect manual mode with preferred model", () => {
      const model = selectModel("simple", "manual", "grok-3-fast");
      expect(model.id).toBe("grok-3-fast");
    });

    it("should use auto routing for medium complexity", () => {
      const model = selectModel("medium", "auto");
      // Should route to Grok 3 Fast for medium complexity
      expect(model.id).toBe("grok-3-fast");
    });
  });

  describe("Model Tiers", () => {
    it("should filter models by tier correctly", () => {
      const freeModels = getModelsByTier("free");
      const standardModels = getModelsByTier("standard");
      const premiumModels = getModelsByTier("premium");

      freeModels.forEach(m => expect(m.tier).toBe("free"));
      standardModels.forEach(m => expect(m.tier).toBe("standard"));
      premiumModels.forEach(m => expect(m.tier).toBe("premium"));
    });

    it("should return all models when no tier specified", () => {
      const allModels = getModelsByTier();
      expect(allModels.length).toBe(AVAILABLE_MODELS.length);
    });
  });

  describe("Model Properties", () => {
    it("should have required properties for all models", () => {
      AVAILABLE_MODELS.forEach(model => {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.description).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(model.tier).toBeDefined();
        expect(typeof model.costPer1kInput).toBe("number");
        expect(typeof model.costPer1kOutput).toBe("number");
        expect(typeof model.maxTokens).toBe("number");
        expect(typeof model.supportsVision).toBe("boolean");
        expect(["fast", "medium", "slow"]).toContain(model.speed);
      });
    });

    it("should have zero cost for free tier models", () => {
      const freeModels = AVAILABLE_MODELS.filter(m => m.tier === "free");
      freeModels.forEach(model => {
        expect(model.costPer1kInput).toBe(0);
        expect(model.costPer1kOutput).toBe(0);
      });
    });

    it("should have positive cost for paid tier models", () => {
      const paidModels = AVAILABLE_MODELS.filter(m => m.tier !== "free");
      paidModels.forEach(model => {
        expect(model.costPer1kInput + model.costPer1kOutput).toBeGreaterThan(0);
      });
    });
  });
});
