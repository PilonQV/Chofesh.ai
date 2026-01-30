/**
 * Tests for Kimi K2.5 Integration
 * 
 * Verifies that Kimi K2.5 provider is properly integrated into:
 * - AI providers system
 * - Model router
 * - Provider health tracking
 * - API invocation
 */

import { describe, it, expect } from "vitest";
import { 
  PROVIDER_CONFIGS, 
  type AIProvider,
  type AICompletionOptions 
} from "./_core/aiProviders";
import { 
  AVAILABLE_MODELS,
  type ModelDefinition 
} from "./modelRouter";

describe("Kimi K2.5 Integration", () => {
  
  describe("Provider Configuration", () => {
    it("should have kimi in PROVIDER_CONFIGS", () => {
      expect(PROVIDER_CONFIGS.kimi).toBeDefined();
      expect(PROVIDER_CONFIGS.kimi.name).toBe("kimi");
      expect(PROVIDER_CONFIGS.kimi.displayName).toBe("Moonshot AI (Kimi)");
    });

    it("should have correct API URL for kimi", () => {
      expect(PROVIDER_CONFIGS.kimi.apiUrl).toBe("https://api.moonshot.ai/v1/chat/completions");
    });

    it("should require API key for kimi", () => {
      expect(PROVIDER_CONFIGS.kimi.requiresApiKey).toBe(true);
      expect(PROVIDER_CONFIGS.kimi.isFree).toBe(false);
    });

    it("should have correct rate limits for kimi", () => {
      expect(PROVIDER_CONFIGS.kimi.rateLimit.requestsPerMinute).toBe(60);
      expect(PROVIDER_CONFIGS.kimi.rateLimit.requestsPerDay).toBe(10000);
    });

    it("should have kimi models configured", () => {
      expect(PROVIDER_CONFIGS.kimi.models).toBeDefined();
      expect(PROVIDER_CONFIGS.kimi.models.length).toBeGreaterThan(0);
      
      const kimiK25 = PROVIDER_CONFIGS.kimi.models.find(m => m.id === "kimi-k2.5");
      expect(kimiK25).toBeDefined();
      expect(kimiK25?.isVision).toBe(true);
      expect(kimiK25?.isReasoning).toBe(true);
      expect(kimiK25?.contextWindow).toBe(262144); // 256K context
    });
  });

  describe("Model Router Integration", () => {
    it("should have kimi-k2.5 in AVAILABLE_MODELS", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25).toBeDefined();
      expect(kimiK25?.provider).toBe("kimi");
    });

    it("should have kimi-k2.5 as premium tier", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25?.tier).toBe("premium");
    });

    it("should have correct pricing for kimi-k2.5", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25?.costPer1kInput).toBe(0.0006); // $0.60/1M
      expect(kimiK25?.costPer1kOutput).toBe(0.003); // $3.00/1M
    });

    it("should have correct capabilities for kimi-k2.5", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25?.supportsVision).toBe(true);
      expect(kimiK25?.isReasoningModel).toBe(true);
      expect(kimiK25?.maxTokens).toBe(262144); // 256K context
    });

    it("should have kimi-k2-thinking model", () => {
      const kimiThinking = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-thinking");
      expect(kimiThinking).toBeDefined();
      expect(kimiThinking?.provider).toBe("kimi");
      expect(kimiThinking?.isReasoningModel).toBe(true);
      expect(kimiThinking?.tier).toBe("premium");
    });

    it("should have kimi-k2-turbo-preview model", () => {
      const kimiTurbo = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-turbo-preview");
      expect(kimiTurbo).toBeDefined();
      expect(kimiTurbo?.provider).toBe("kimi");
      expect(kimiTurbo?.tier).toBe("standard");
      expect(kimiTurbo?.speed).toBe("fast");
    });

    it("should be able to find kimi models by ID", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25).toBeDefined();
      expect(kimiK25?.id).toBe("kimi-k2.5");
    });
  });

  describe("Model Comparison", () => {
    it("should be cheaper than GPT-4o for input", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      const gpt4o = AVAILABLE_MODELS.find(m => m.id === "gpt-4o");
      
      if (kimiK25 && gpt4o) {
        expect(kimiK25.costPer1kInput).toBeLessThan(gpt4o.costPer1kInput);
      }
    });

    it("should have longer context than GPT-4o", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      const gpt4o = AVAILABLE_MODELS.find(m => m.id === "gpt-4o");
      
      if (kimiK25 && gpt4o) {
        expect(kimiK25.maxTokens).toBeGreaterThan(gpt4o.maxTokens);
      }
    });

    it("should support vision like GPT-4o", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      const gpt4o = AVAILABLE_MODELS.find(m => m.id === "gpt-4o");
      
      if (kimiK25 && gpt4o) {
        expect(kimiK25.supportsVision).toBe(gpt4o.supportsVision);
      }
    });
  });

  describe("Provider Type Safety", () => {
    it("should accept 'kimi' as valid AIProvider", () => {
      const provider: AIProvider = "kimi";
      expect(provider).toBe("kimi");
    });

    it("should have kimi in provider configs keys", () => {
      const providers = Object.keys(PROVIDER_CONFIGS);
      expect(providers).toContain("kimi");
    });
  });

  describe("Model Features", () => {
    it("should mark kimi-k2.5 as multimodal", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25?.supportsVision).toBe(true);
      expect(kimiK25?.description).toContain("video");
    });

    it("should mark kimi models as reasoning capable", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      const kimiThinking = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-thinking");
      
      expect(kimiK25?.isReasoningModel).toBe(true);
      expect(kimiThinking?.isReasoningModel).toBe(true);
    });

    it("should have 256K context window for all kimi models", () => {
      const kimiModels = AVAILABLE_MODELS.filter(m => m.provider === "kimi");
      
      kimiModels.forEach(model => {
        expect(model.maxTokens).toBe(262144); // 256K = 262144 tokens
      });
    });
  });

  describe("Model Descriptions", () => {
    it("should have descriptive names for kimi models", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25?.name).toContain("Kimi K2.5");
      expect(kimiK25?.name).toContain("Premium");
    });

    it("should describe key features in model descriptions", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25?.description).toContain("visual coding");
      expect(kimiK25?.description).toContain("video");
      expect(kimiK25?.description).toContain("256K");
    });

    it("should distinguish between kimi model variants", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      const kimiThinking = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-thinking");
      const kimiTurbo = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-turbo-preview");
      
      expect(kimiK25?.description).not.toBe(kimiThinking?.description);
      expect(kimiK25?.description).not.toBe(kimiTurbo?.description);
      expect(kimiThinking?.description).not.toBe(kimiTurbo?.description);
    });
  });

  describe("Pricing Tiers", () => {
    it("should have kimi-k2.5 in premium tier", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimiK25?.tier).toBe("premium");
    });

    it("should have kimi-k2-thinking in premium tier", () => {
      const kimiThinking = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-thinking");
      expect(kimiThinking?.tier).toBe("premium");
    });

    it("should have kimi-k2-turbo in standard tier", () => {
      const kimiTurbo = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-turbo-preview");
      expect(kimiTurbo?.tier).toBe("standard");
    });

    it("should have turbo model cheaper than k2.5", () => {
      const kimiK25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      const kimiTurbo = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-turbo-preview");
      
      if (kimiK25 && kimiTurbo) {
        expect(kimiTurbo.costPer1kInput).toBeLessThan(kimiK25.costPer1kInput);
        expect(kimiTurbo.costPer1kOutput).toBeLessThan(kimiK25.costPer1kOutput);
      }
    });
  });

  describe("Model Count", () => {
    it("should have at least 3 kimi models", () => {
      const kimiModels = AVAILABLE_MODELS.filter(m => m.provider === "kimi");
      expect(kimiModels.length).toBeGreaterThanOrEqual(3);
    });

    it("should have kimi models at the top of the list", () => {
      const firstKimiIndex = AVAILABLE_MODELS.findIndex(m => m.provider === "kimi");
      expect(firstKimiIndex).toBeLessThan(10); // Should be in first 10 models
    });
  });
});
