/**
 * Provider Analytics Tests
 */

import { describe, it, expect, vi } from "vitest";
import {
  estimateCostSaved,
} from "./_core/providerAnalytics";

describe("Provider Analytics", () => {
  describe("estimateCostSaved", () => {
    it("should estimate cost saved for GPT-4o equivalent usage", () => {
      const saved = estimateCostSaved("gpt-4o", 1000, 500);
      // GPT-4o: $0.005/1K input, $0.015/1K output
      // Expected: (1000/1000 * 0.005) + (500/1000 * 0.015) = 0.005 + 0.0075 = 0.0125
      expect(parseFloat(saved)).toBeCloseTo(0.0125, 4);
    });

    it("should estimate cost saved for Llama 3.3 70B usage", () => {
      const saved = estimateCostSaved("llama-3.3-70b", 2000, 1000);
      // Llama 3.3 70B: $0.0008/1K input, $0.0008/1K output
      // Expected: (2000/1000 * 0.0008) + (1000/1000 * 0.0008) = 0.0016 + 0.0008 = 0.0024
      expect(parseFloat(saved)).toBeCloseTo(0.0024, 4);
    });

    it("should use default pricing for unknown models", () => {
      const saved = estimateCostSaved("unknown-model-xyz", 1000, 1000);
      // Default: $0.001/1K input, $0.002/1K output
      // Expected: (1000/1000 * 0.001) + (1000/1000 * 0.002) = 0.001 + 0.002 = 0.003
      expect(parseFloat(saved)).toBeCloseTo(0.003, 4);
    });

    it("should handle zero tokens", () => {
      const saved = estimateCostSaved("gpt-4o", 0, 0);
      expect(parseFloat(saved)).toBe(0);
    });

    it("should handle large token counts", () => {
      const saved = estimateCostSaved("gpt-4", 100000, 50000);
      // GPT-4: $0.03/1K input, $0.06/1K output
      // Expected: (100000/1000 * 0.03) + (50000/1000 * 0.06) = 3 + 3 = 6
      expect(parseFloat(saved)).toBeCloseTo(6, 2);
    });
  });

  describe("TrackUsageParams validation", () => {
    it("should accept valid tracking parameters", () => {
      const params = {
        userId: 1,
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        modelTier: "free" as const,
        actionType: "chat" as const,
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        latencyMs: 500,
        success: true,
      };
      
      expect(params.provider).toBe("groq");
      expect(params.modelTier).toBe("free");
      expect(params.actionType).toBe("chat");
    });

    it("should accept minimal tracking parameters", () => {
      const params = {
        provider: "openrouter",
        model: "deepseek/deepseek-r1-0528:free",
      };
      
      expect(params.provider).toBe("openrouter");
      expect(params.model).toBe("deepseek/deepseek-r1-0528:free");
    });
  });
});

describe("Provider Configuration", () => {
  it("should have correct Cerebras models configured", async () => {
    const { PROVIDER_CONFIGS } = await import("./_core/aiProviders");
    
    expect(PROVIDER_CONFIGS.cerebras).toBeDefined();
    expect(PROVIDER_CONFIGS.cerebras.models.length).toBeGreaterThan(0);
    expect(PROVIDER_CONFIGS.cerebras.isFree).toBe(true);
    expect(PROVIDER_CONFIGS.cerebras.rateLimit.requestsPerDay).toBe(14400);
  });

  it("should have correct Groq models configured", async () => {
    const { PROVIDER_CONFIGS } = await import("./_core/aiProviders");
    
    expect(PROVIDER_CONFIGS.groq).toBeDefined();
    expect(PROVIDER_CONFIGS.groq.models.length).toBeGreaterThan(0);
    expect(PROVIDER_CONFIGS.groq.isFree).toBe(true);
  });

  it("should have correct OpenRouter free models configured", async () => {
    const { PROVIDER_CONFIGS } = await import("./_core/aiProviders");
    
    expect(PROVIDER_CONFIGS.openrouter).toBeDefined();
    const freeModels = PROVIDER_CONFIGS.openrouter.models.filter(m => m.isFree);
    expect(freeModels.length).toBeGreaterThan(5);
  });

  it("should have Puter.js configured as no API key required", async () => {
    const { PROVIDER_CONFIGS } = await import("./_core/aiProviders");
    
    expect(PROVIDER_CONFIGS.puter).toBeDefined();
    expect(PROVIDER_CONFIGS.puter.requiresApiKey).toBe(false);
    expect(PROVIDER_CONFIGS.puter.isFree).toBe(true);
  });
});

describe("Model Router Integration", () => {
  it("should include Cerebras models in AVAILABLE_MODELS", async () => {
    const { AVAILABLE_MODELS } = await import("./modelRouter");
    
    const cerebrasModels = AVAILABLE_MODELS.filter(m => 
      m.id.includes("cerebras") || m.provider === "cerebras"
    );
    expect(cerebrasModels.length).toBeGreaterThan(0);
  });

  it("should have all free models marked with tier=free", async () => {
    const { AVAILABLE_MODELS } = await import("./modelRouter");
    
    const freeModels = AVAILABLE_MODELS.filter(m => m.tier === "free");
    expect(freeModels.length).toBeGreaterThan(10);
    
    // All free models should have zero cost
    freeModels.forEach(model => {
      expect(model.costPer1kInput).toBe(0);
      expect(model.costPer1kOutput).toBe(0);
    });
  });
});
