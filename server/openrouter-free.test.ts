/**
 * OpenRouter Free Models Integration Tests
 * 
 * Tests the OpenRouter free model configurations and routing
 */

import { describe, it, expect, vi } from "vitest";
import { AVAILABLE_MODELS, selectModel, getModelsByTier } from "./modelRouter";

describe("OpenRouter Free Models Integration", () => {
  
  describe("Free Model Configuration", () => {
    const openRouterModels = AVAILABLE_MODELS.filter(m => m.provider === "openrouter");
    
    it("should have multiple OpenRouter models", () => {
      expect(openRouterModels.length).toBeGreaterThanOrEqual(5);
    });

    it("should have DeepSeek R1 free model with correct config", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "deepseek-r1-free");
      expect(model).toBeDefined();
      expect(model?.provider).toBe("openrouter");
      expect(model?.tier).toBe("free");
      expect(model?.isReasoningModel).toBe(true);
      expect(model?.costPer1kInput).toBe(0);
      expect(model?.costPer1kOutput).toBe(0);
    });

    it("should have Llama 3.1 405B free model with correct config", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "llama-3.1-405b-free");
      expect(model).toBeDefined();
      expect(model?.provider).toBe("openrouter");
      expect(model?.tier).toBe("free");
      expect(model?.maxTokens).toBeGreaterThanOrEqual(4096);
    });

    it("should have Hermes 3 405B free model", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "hermes-3-405b-free");
      expect(model).toBeDefined();
      expect(model?.provider).toBe("openrouter");
      expect(model?.tier).toBe("free");
    });

    it("should have Kimi K2 free model", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-free");
      expect(model).toBeDefined();
      expect(model?.provider).toBe("openrouter");
      expect(model?.tier).toBe("free");
    });

    it("should have Mistral Small 3.1 free model", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "mistral-small-free");
      expect(model).toBeDefined();
      expect(model?.provider).toBe("openrouter");
      expect(model?.tier).toBe("free");
    });

    it("should have Qwen VL 7B vision model", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "qwen-vl-free");
      expect(model).toBeDefined();
      expect(model?.provider).toBe("openrouter");
      expect(model?.tier).toBe("free");
      expect(model?.supportsVision).toBe(true);
    });

    it("should have Gemma 3 27B free model", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "gemma-3-27b-free");
      expect(model).toBeDefined();
      expect(model?.provider).toBe("openrouter");
      expect(model?.tier).toBe("free");
    });

    it("should have DeepSeek model available", () => {
      const model = AVAILABLE_MODELS.find(m => m.id === "deepseek-r1-free");
      expect(model).toBeDefined();
      expect(model?.provider).toBe("openrouter");
    });
  });

  describe("Model Selection for Free Tier", () => {
    it("should select free model for simple queries in free mode", () => {
      const model = selectModel("simple", "free");
      expect(model.tier).toBe("free");
    });

    it("should select DeepSeek R1 for complex reasoning in free mode", () => {
      const model = selectModel("complex", "free");
      expect(model.id).toBe("deepseek-r1-free");
      expect(model.isReasoningModel).toBe(true);
    });

    it("should allow manual selection of any OpenRouter model", () => {
      const model = selectModel("simple", "manual", "llama-3.1-405b-free");
      expect(model.id).toBe("llama-3.1-405b-free");
    });

    it("should allow manual selection of Kimi K2", () => {
      const model = selectModel("simple", "manual", "kimi-k2-free");
      expect(model.id).toBe("kimi-k2-free");
    });

    it("should allow manual selection of vision model", () => {
      const model = selectModel("simple", "manual", "qwen-vl-free");
      expect(model.id).toBe("qwen-vl-free");
      expect(model.supportsVision).toBe(true);
    });
  });

  describe("Free Models Count", () => {
    it("should have more free models than paid models", () => {
      const freeModels = getModelsByTier("free");
      const standardModels = getModelsByTier("standard");
      const premiumModels = getModelsByTier("premium");
      
      const paidCount = standardModels.length + premiumModels.length;
      expect(freeModels.length).toBeGreaterThan(paidCount);
    });

    it("should have at least 10 free models total", () => {
      const freeModels = getModelsByTier("free");
      expect(freeModels.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("OpenRouter Model IDs", () => {
    it("should have correct OpenRouter model IDs for API calls", () => {
      const modelIdMapping: Record<string, string> = {
        "deepseek-r1-free": "deepseek/deepseek-r1:free",
        "llama-3.1-405b-free": "meta-llama/llama-3.1-405b-instruct:free",
        "hermes-3-405b-free": "nousresearch/hermes-3-llama-3.1-405b:free",
        "kimi-k2-free": "moonshotai/kimi-k2-instruct:free",
        "mistral-small-free": "mistralai/mistral-small-3.1-24b-instruct:free",
        "qwen-vl-free": "qwen/qwen2.5-vl-7b-instruct:free",
        "gemma-3-27b-free": "google/gemma-3-27b-it:free",
      };

      for (const [internalId, expectedOpenRouterId] of Object.entries(modelIdMapping)) {
        const model = AVAILABLE_MODELS.find(m => m.id === internalId);
        expect(model).toBeDefined();
        // The openRouterId should match the expected format
        if (model?.openRouterId) {
          expect(model.openRouterId).toBe(expectedOpenRouterId);
        }
      }
    });
  });

  describe("Vision Model Support", () => {
    it("should have vision-capable models marked correctly", () => {
      const visionModels = AVAILABLE_MODELS.filter(m => m.supportsVision);
      expect(visionModels.length).toBeGreaterThan(0);
      
      // Qwen VL should support vision
      const qwenVl = AVAILABLE_MODELS.find(m => m.id === "qwen-vl-free");
      expect(qwenVl?.supportsVision).toBe(true);
    });

    it("should have at least one free vision model", () => {
      const freeVisionModels = AVAILABLE_MODELS.filter(
        m => m.tier === "free" && m.supportsVision
      );
      expect(freeVisionModels.length).toBeGreaterThan(0);
    });
  });

  describe("Model Support", () => {
    it("should have models available", () => {
      expect(AVAILABLE_MODELS.length).toBeGreaterThan(0);
    });
  });
});
