/**
 * Test: Kimi 2.5 as Lead Model (Phase 74)
 * 
 * Verify that:
 * 1. kimi-k2-free has been removed from all configurations
 * 2. kimi-k2.5 is now the lead model in all fallback priorities
 * 3. Fallback logic correctly routes to Kimi 2.5 first
 * 4. KIMI_API_KEY is properly configured
 */

import { describe, it, expect } from "vitest";
import { AVAILABLE_MODELS } from "./modelRouter";
import { FREE_MODEL_PRIORITIES, getFreeModelPriority, getBestFreeModel } from "./_core/freeModelFallback";

describe("Phase 74: Kimi 2.5 as Lead Model", () => {
  describe("kimi-k2-free Removal", () => {
    it("should NOT have kimi-k2-free in AVAILABLE_MODELS", () => {
      const hasFreeKimi = AVAILABLE_MODELS.some(m => m.id === "kimi-k2-free");
      expect(hasFreeKimi).toBe(false);
    });

    it("should NOT have kimi-k2-free in simple priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.simple).not.toContain("kimi-k2-free");
    });

    it("should NOT have kimi-k2-free in medium priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.medium).not.toContain("kimi-k2-free");
    });

    it("should NOT have kimi-k2-free in complex priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.complex).not.toContain("kimi-k2-free");
    });
  });

  describe("Kimi 2.5 as Lead Model", () => {
    it("should have kimi-k2.5 as first model in simple priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.simple[0]).toBe("kimi-k2.5");
    });

    it("should have kimi-k2.5 as first model in medium priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.medium[0]).toBe("kimi-k2.5");
    });

    it("should have kimi-k2.5 as first model in complex priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.complex[0]).toBe("kimi-k2.5");
    });

    it("should have kimi-k2.5 as first model in vision priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.vision[0]).toBe("kimi-k2.5");
    });

    it("should have kimi-k2.5 as first model in code priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.code[0]).toBe("kimi-k2.5");
    });

    it("should have kimi-k2.5 as first model in longContext priority queue", () => {
      expect(FREE_MODEL_PRIORITIES.longContext[0]).toBe("kimi-k2.5");
    });
  });

  describe("Fallback Logic", () => {
    it("should return kimi-k2.5 as best model for simple queries", () => {
      const bestModel = getBestFreeModel("simple");
      expect(bestModel.id).toBe("kimi-k2.5");
    });

    it("should return kimi-k2.5 as best model for medium queries", () => {
      const bestModel = getBestFreeModel("medium");
      expect(bestModel.id).toBe("kimi-k2.5");
    });

    it("should return kimi-k2.5 as best model for complex queries", () => {
      const bestModel = getBestFreeModel("complex");
      expect(bestModel.id).toBe("kimi-k2.5");
    });

    it("should return kimi-k2.5 as best model for vision tasks", () => {
      const bestModel = getBestFreeModel("simple", true); // hasVision=true
      expect(bestModel.id).toBe("kimi-k2.5");
    });

    it("should return kimi-k2.5 as best model for code generation", () => {
      const bestModel = getBestFreeModel("simple", false, true); // isCode=true
      expect(bestModel.id).toBe("kimi-k2.5");
    });

    it("should return kimi-k2.5 as best model for long context", () => {
      const bestModel = getBestFreeModel("simple", false, false, true); // isLongContext=true
      expect(bestModel.id).toBe("kimi-k2.5");
    });
  });

  describe("Model Configuration", () => {
    it("should have kimi-k2.5 defined in AVAILABLE_MODELS", () => {
      const kimi25 = AVAILABLE_MODELS.find(m => m.id === "kimi-k2.5");
      expect(kimi25).toBeDefined();
      expect(kimi25?.name).toBe("Kimi K2.5 (Premium)");
      expect(kimi25?.provider).toBe("kimi");
      expect(kimi25?.tier).toBe("premium");
    });

    it("should have KIMI_API_KEY environment variable configured", () => {
      // This test verifies the API key is available
      // In production, the key is injected by the deployment system
      const hasKimiKey = !!process.env.KIMI_API_KEY || !!process.env.MOONSHOT_API_KEY;
      expect(hasKimiKey).toBe(true);
    });
  });

  describe("Priority Queue Structure", () => {
    it("should have fallback models after kimi-k2.5 in simple queue", () => {
      const simpleQueue = getFreeModelPriority("simple");
      expect(simpleQueue.length).toBeGreaterThan(1);
      expect(simpleQueue[0]).toBe("kimi-k2.5");
      // Verify fallbacks exist
      expect(simpleQueue).toContain("puter-gpt-5-nano");
      expect(simpleQueue).toContain("llama-3.1-8b");
    });

    it("should have fallback models after kimi-k2.5 in medium queue", () => {
      const mediumQueue = getFreeModelPriority("medium");
      expect(mediumQueue.length).toBeGreaterThan(1);
      expect(mediumQueue[0]).toBe("kimi-k2.5");
      // Verify fallbacks exist
      expect(mediumQueue).toContain("puter-gpt-5");
      expect(mediumQueue).toContain("llama-3.3-70b");
    });

    it("should have fallback models after kimi-k2.5 in complex queue", () => {
      const complexQueue = getFreeModelPriority("complex");
      expect(complexQueue.length).toBeGreaterThan(1);
      expect(complexQueue[0]).toBe("kimi-k2.5");
      // Verify fallbacks exist
      expect(complexQueue).toContain("deepseek-r1-free");
      expect(complexQueue).toContain("llama-3.3-70b");
    });
  });
});
