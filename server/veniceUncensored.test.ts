import { describe, expect, it, vi } from "vitest";
import { isRefusalResponse, REFUSAL_PATTERNS, OPENROUTER_MODELS } from "./_core/openrouter";
import { AVAILABLE_MODELS } from "./modelRouter";

describe("Venice Uncensored Model Configuration", () => {
  it("should have Venice Uncensored in available models", () => {
    const veniceModel = AVAILABLE_MODELS.find(m => m.id === "venice-uncensored");
    expect(veniceModel).toBeDefined();
    expect(veniceModel?.provider).toBe("openrouter");
    expect(veniceModel?.tier).toBe("free");
    expect(veniceModel?.costPer1kInput).toBe(0);
    expect(veniceModel?.costPer1kOutput).toBe(0);
    expect(veniceModel?.isUncensored).toBe(true);
  });

  it("should have correct OpenRouter model ID", () => {
    expect(OPENROUTER_MODELS.VENICE_UNCENSORED).toBe(
      "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
    );
  });
});

describe("Refusal Detection", () => {
  it("should detect common refusal patterns", () => {
    const refusalResponses = [
      "I can't help with that request.",
      "I cannot assist with generating that content.",
      "I won't provide that information.",
      "Sorry, but I can't help with this.",
      "As an AI, I cannot generate harmful content.",
      "I'm designed to avoid creating such content.",
      "This request violates my content policy.",
      "I must decline this request.",
      "I can't write that for you.",
      "I cannot create such content.",
    ];

    for (const response of refusalResponses) {
      expect(isRefusalResponse(response)).toBe(true);
    }
  });

  it("should not flag normal responses as refusals", () => {
    const normalResponses = [
      "Here's the information you requested. The answer is 42.",
      "I'd be happy to help! Let me explain how this works...",
      "Great question! The solution involves several steps...",
      "Based on my analysis, here are the key points to consider when making this decision.",
      "The code you're looking for would look something like this: function example() { return true; }",
    ];

    for (const response of normalResponses) {
      expect(isRefusalResponse(response)).toBe(false);
    }
  });

  it("should detect refusals at the start of longer responses", () => {
    const longRefusal = "I can't help with that request. However, I can suggest some alternative approaches that might be useful for your project. Let me explain some options that would be more appropriate...";
    expect(isRefusalResponse(longRefusal)).toBe(true);
  });

  it("should have comprehensive refusal patterns", () => {
    expect(REFUSAL_PATTERNS.length).toBeGreaterThan(5);
    
    // Test each pattern has valid regex
    for (const pattern of REFUSAL_PATTERNS) {
      expect(pattern).toBeInstanceOf(RegExp);
    }
  });
});

describe("Model Properties", () => {
  it("Venice Uncensored should have appropriate context length", () => {
    const veniceModel = AVAILABLE_MODELS.find(m => m.id === "venice-uncensored");
    expect(veniceModel?.maxTokens).toBe(32768);
  });

  it("Venice Uncensored should be marked as uncensored", () => {
    const veniceModel = AVAILABLE_MODELS.find(m => m.id === "venice-uncensored");
    expect(veniceModel?.isUncensored).toBe(true);
  });

  it("should be the only model marked as uncensored", () => {
    const uncensoredModels = AVAILABLE_MODELS.filter(m => m.isUncensored);
    expect(uncensoredModels.length).toBe(1);
    expect(uncensoredModels[0].id).toBe("venice-uncensored");
  });
});
