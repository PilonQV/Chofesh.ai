/**
 * Test Suite: Kimi-Only Platform Transformation
 * 
 * Verifies that GPT-4o and Claude have been completely removed
 * and Kimi K2.5 is prioritized across the platform.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Kimi-Only Platform", () => {
  describe("Model Router", () => {
    it("should not include GPT-4o in AVAILABLE_MODELS", () => {
      const modelRouterContent = readFileSync(
        join(__dirname, "modelRouter.ts"),
        "utf-8"
      );
      
      // Check that GPT-4o model definition is removed
      expect(modelRouterContent).not.toMatch(/id:\s*["']gpt-4o["']/);
      expect(modelRouterContent).not.toMatch(/id:\s*["']gpt-4o-mini["']/);
    });

    it("should not include Claude in AVAILABLE_MODELS", () => {
      const modelRouterContent = readFileSync(
        join(__dirname, "modelRouter.ts"),
        "utf-8"
      );
      
      // Check that Claude model definitions are removed
      expect(modelRouterContent).not.toMatch(/id:\s*["']claude-3\.5-sonnet["']/);
      expect(modelRouterContent).not.toMatch(/id:\s*["']claude-3-opus["']/);
      expect(modelRouterContent).not.toMatch(/id:\s*["']claude-3-haiku["']/);
    });

    it("should include Kimi K2.5 in AVAILABLE_MODELS", () => {
      const modelRouterContent = readFileSync(
        join(__dirname, "modelRouter.ts"),
        "utf-8"
      );
      
      // Check that Kimi models are present
      expect(modelRouterContent).toMatch(/id:\s*["']kimi-k2\.5["']/);
      expect(modelRouterContent).toMatch(/id:\s*["']kimi-k2-thinking["']/);
      expect(modelRouterContent).toMatch(/id:\s*["']kimi-k2-turbo-preview["']/);
    });

    it("should mark Kimi K2.5 as supporting vision", () => {
      const modelRouterContent = readFileSync(
        join(__dirname, "modelRouter.ts"),
        "utf-8"
      );
      
      // Find Kimi K2.5 definition and verify supportsVision: true
      const kimiK25Match = modelRouterContent.match(
        /id:\s*["']kimi-k2\.5["'][\s\S]{0,500}supportsVision:\s*(true|false)/
      );
      expect(kimiK25Match).toBeTruthy();
      expect(kimiK25Match![1]).toBe("true");
    });
  });

  describe("Free Model Priorities", () => {
    it("should prioritize Kimi K2.5 for vision tasks", () => {
      const fallbackContent = readFileSync(
        join(__dirname, "_core/freeModelFallback.ts"),
        "utf-8"
      );
      
      // Extract vision priority array
      const visionMatch = fallbackContent.match(
        /vision:\s*\[([\s\S]*?)\]/
      );
      expect(visionMatch).toBeTruthy();
      
      const visionArray = visionMatch![1];
      // Check that kimi-k2.5 is first
      const firstModel = visionArray.match(/["']([^"']+)["']/);
      expect(firstModel![1]).toBe("kimi-k2.5");
      
      // Check that GPT-4o is not in the list
      expect(visionArray).not.toMatch(/gpt-4o/);
    });

    it("should prioritize Kimi models for code generation", () => {
      const fallbackContent = readFileSync(
        join(__dirname, "_core/freeModelFallback.ts"),
        "utf-8"
      );
      
      // Extract code priority array
      const codeMatch = fallbackContent.match(
        /code:\s*\[([\s\S]*?)\]/
      );
      expect(codeMatch).toBeTruthy();
      
      const codeArray = codeMatch![1];
      // Check that kimi-k2.5 is first
      const firstModel = codeArray.match(/["']([^"']+)["']/);
      expect(firstModel![1]).toBe("kimi-k2.5");
    });

    it("should prioritize Kimi K2 Thinking for complex reasoning", () => {
      const fallbackContent = readFileSync(
        join(__dirname, "_core/freeModelFallback.ts"),
        "utf-8"
      );
      
      // Extract complex priority array
      const complexMatch = fallbackContent.match(
        /complex:\s*\[([\s\S]*?)\]/
      );
      expect(complexMatch).toBeTruthy();
      
      const complexArray = complexMatch![1];
      // Check that kimi-k2-thinking is first
      const firstModel = complexArray.match(/["']([^"']+)["']/);
      expect(firstModel![1]).toBe("kimi-k2-thinking");
    });

    it("should prioritize Kimi K2 Free for simple queries", () => {
      const fallbackContent = readFileSync(
        join(__dirname, "_core/freeModelFallback.ts"),
        "utf-8"
      );
      
      // Extract simple priority array
      const simpleMatch = fallbackContent.match(
        /simple:\s*\[([\s\S]*?)\]/
      );
      expect(simpleMatch).toBeTruthy();
      
      const simpleArray = simpleMatch![1];
      // Check that kimi-k2-free is first
      const firstModel = simpleArray.match(/["']([^"']+)["']/);
      expect(firstModel![1]).toBe("kimi-k2-free");
    });
  });

  describe("Provider Handlers", () => {
    it("should have Kimi provider handler in routers.ts", () => {
      const routersContent = readFileSync(
        join(__dirname, "routers.ts"),
        "utf-8"
      );
      
      // Check for Kimi provider handler
      expect(routersContent).toMatch(/selectedModel\.provider\s*===\s*["']kimi["']/);
      expect(routersContent).toMatch(/invokeKimi/);
    });

    it("should not have direct OpenAI API calls in routers.ts", () => {
      const routersContent = readFileSync(
        join(__dirname, "routers.ts"),
        "utf-8"
      );
      
      // Check that there are no direct OpenAI API calls
      // (OpenRouter is OK, but not direct OpenAI SDK usage)
      expect(routersContent).not.toMatch(/new\s+OpenAI\(/);
      expect(routersContent).not.toMatch(/openai\.chat\.completions\.create/);
    });

    it("should not have direct Anthropic API calls in routers.ts", () => {
      const routersContent = readFileSync(
        join(__dirname, "routers.ts"),
        "utf-8"
      );
      
      // Check that there are no direct Anthropic API calls
      expect(routersContent).not.toMatch(/new\s+Anthropic\(/);
      expect(routersContent).not.toMatch(/anthropic\.messages\.create/);
    });
  });

  describe("Cost Optimization", () => {
    it("should document 4x cost savings in comments", () => {
      const fallbackContent = readFileSync(
        join(__dirname, "_core/freeModelFallback.ts"),
        "utf-8"
      );
      
      // Check for cost savings documentation
      expect(fallbackContent).toMatch(/4x cheaper/i);
    });

    it("should have Kimi K2.5 as premium tier (not free)", () => {
      const modelRouterContent = readFileSync(
        join(__dirname, "modelRouter.ts"),
        "utf-8"
      );
      
      // Find Kimi K2.5 definition and verify tier: "premium"
      const kimiK25Match = modelRouterContent.match(
        /id:\s*["']kimi-k2\.5["'][\s\S]{0,500}tier:\s*["']([^"']+)["']/
      );
      expect(kimiK25Match).toBeTruthy();
      expect(kimiK25Match![1]).toBe("premium");
    });
  });

  describe("Fallback Strategy", () => {
    it("should have Gemini as free vision fallback", () => {
      const fallbackContent = readFileSync(
        join(__dirname, "_core/freeModelFallback.ts"),
        "utf-8"
      );
      
      // Extract vision priority array
      const visionMatch = fallbackContent.match(
        /vision:\s*\[([\s\S]*?)\]/
      );
      expect(visionMatch).toBeTruthy();
      
      // Check that gemini is in the fallback list
      expect(visionMatch![1]).toMatch(/gemini/);
    });

    it("should have DeepSeek R1 as free reasoning fallback", () => {
      const fallbackContent = readFileSync(
        join(__dirname, "_core/freeModelFallback.ts"),
        "utf-8"
      );
      
      // Extract complex priority array
      const complexMatch = fallbackContent.match(
        /complex:\s*\[([\s\S]*?)\]/
      );
      expect(complexMatch).toBeTruthy();
      
      // Check that deepseek-r1-free is in the fallback list
      expect(complexMatch![1]).toMatch(/deepseek-r1-free/);
    });
  });
});
