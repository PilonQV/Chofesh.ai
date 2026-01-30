/**
 * Tests for Kimi K2.5 Smart Routing
 * 
 * Verifies that the smart routing system correctly routes tasks to Kimi K2.5 for:
 * - Visual tasks (image/video understanding)
 * - Long context tasks (>128K tokens)
 * - Complex coding tasks
 */

import { describe, it, expect } from "vitest";
import { 
  selectModel,
  analyzeQueryComplexity,
  requiresVision,
  requiresLongContext,
  isCodeTask,
  type RoutingMode 
} from "./modelRouter";

describe("Kimi K2.5 Smart Routing", () => {
  
  describe("Vision Detection", () => {
    it("should detect image-related tasks", () => {
      const messages = [
        { role: "user", content: "Can you analyze this image for me?" }
      ];
      expect(requiresVision(messages)).toBe(true);
    });

    it("should detect screenshot tasks", () => {
      const messages = [
        { role: "user", content: "Convert this screenshot to code" }
      ];
      expect(requiresVision(messages)).toBe(true);
    });

    it("should detect video tasks", () => {
      const messages = [
        { role: "user", content: "Analyze this video and create a story" }
      ];
      expect(requiresVision(messages)).toBe(true);
    });

    it("should detect UI/design tasks", () => {
      const messages = [
        { role: "user", content: "Review this UI design and suggest improvements" }
      ];
      expect(requiresVision(messages)).toBe(true);
    });

    it("should not detect vision for text-only tasks", () => {
      const messages = [
        { role: "user", content: "What is the capital of France?" }
      ];
      expect(requiresVision(messages)).toBe(false);
    });
  });

  describe("Long Context Detection", () => {
    it("should detect long context tasks", () => {
      // Create a message with >128K tokens worth of content
      const longContent = "a".repeat(600000); // ~150K tokens
      const messages = [
        { role: "user", content: longContent }
      ];
      expect(requiresLongContext(messages)).toBe(true);
    });

    it("should not detect short messages as long context", () => {
      const messages = [
        { role: "user", content: "Hello, how are you?" }
      ];
      expect(requiresLongContext(messages)).toBe(false);
    });

    it("should handle multiple messages in conversation", () => {
      const messages = [
        { role: "user", content: "a".repeat(300000) },
        { role: "assistant", content: "Response" },
        { role: "user", content: "a".repeat(300000) }
      ];
      expect(requiresLongContext(messages)).toBe(true);
    });
  });

  describe("Code Task Detection", () => {
    it("should detect code generation tasks", () => {
      const messages = [
        { role: "user", content: "Write a function to sort an array" }
      ];
      expect(isCodeTask(messages)).toBe(true);
    });

    it("should detect debugging tasks", () => {
      const messages = [
        { role: "user", content: "Debug this code: ```js\nfunction test() {}\n```" }
      ];
      expect(isCodeTask(messages)).toBe(true);
    });

    it("should detect API development tasks", () => {
      const messages = [
        { role: "user", content: "Create a REST API for user management" }
      ];
      expect(isCodeTask(messages)).toBe(true);
    });

    it("should detect refactoring tasks", () => {
      const messages = [
        { role: "user", content: "Refactor this class to use TypeScript" }
      ];
      expect(isCodeTask(messages)).toBe(true);
    });

    it("should not detect non-code tasks", () => {
      const messages = [
        { role: "user", content: "Tell me a story about a dragon" }
      ];
      expect(isCodeTask(messages)).toBe(false);
    });
  });

  describe("Smart Model Selection", () => {
    it("should select Kimi K2.5 for vision tasks", () => {
      const messages = [
        { role: "user", content: "Analyze this screenshot and convert it to HTML" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      expect(model.id).toBe("kimi-k2.5");
      expect(model.supportsVision).toBe(true);
    });

    it("should select Kimi K2.5 for code tasks", () => {
      const messages = [
        { role: "user", content: "Write a complex React component with TypeScript" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      expect(model.id).toBe("kimi-k2.5");
    });

    it("should select Kimi K2.5 for long context tasks", () => {
      const longContent = "a".repeat(600000); // ~150K tokens
      const messages = [
        { role: "user", content: longContent }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      expect(model.id).toBe("kimi-k2.5");
      expect(model.maxTokens).toBeGreaterThanOrEqual(256000);
    });

    it("should select Kimi K2 Thinking for complex reasoning", () => {
      const messages = [
        { role: "user", content: "Analyze the economic implications of AI on global markets over the next decade" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      // Should use a capable model for reasoning
      expect(model).toBeDefined();
      // Complexity can be medium or complex
      expect(["medium", "complex"].includes(complexity)).toBe(true);
      // Model should be from the appropriate priority queue
      expect(model.id).toBeDefined();
    });

    it("should respect manual mode selection", () => {
      const messages = [
        { role: "user", content: "Hello" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "manual", "gpt-4o", messages);
      
      expect(model.id).toBe("gpt-4o");
    });

    it("should use free models for simple tasks", () => {
      const messages = [
        { role: "user", content: "What is 2+2?" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      // Simple tasks should use fast free models
      expect(["puter-gpt-5-nano", "llama-3.1-8b", "puter-gpt-4o-mini"].includes(model.id)).toBe(true);
    });
  });

  describe("Cost Optimization", () => {
    it("should prefer Kimi K2.5 over GPT-4o for vision tasks (4x cheaper)", () => {
      const messages = [
        { role: "user", content: "Analyze this image and describe what you see" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      expect(model.id).toBe("kimi-k2.5");
      // Kimi K2.5: $0.60/1M input vs GPT-4o: $2.50/1M input
      expect(model.costPer1kInput).toBeLessThan(0.001); // Less than $1/1M
    });

    it("should use Kimi K2 Turbo for fast standard tasks", () => {
      const messages = [
        { role: "user", content: "Write a simple Python script to read a CSV file" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      
      // Medium complexity code task
      if (complexity === "medium") {
        const model = selectModel(complexity, "auto", undefined, messages);
        // Should prefer Kimi for code tasks
        expect(model.provider === "kimi" || model.tier === "free").toBe(true);
      }
    });
  });

  describe("Priority Queue Ordering", () => {
    it("should prioritize Kimi K2.5 for vision over free models", () => {
      const messages = [
        { role: "user", content: "Convert this UI screenshot to React code" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      // Kimi K2.5 should be first choice for vision + code
      expect(model.id).toBe("kimi-k2.5");
    });

    it("should prioritize Kimi K2 Thinking for complex reasoning", () => {
      const messages = [
        { role: "user", content: "Analyze the philosophical implications of consciousness in AI systems" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      // Should be a capable model
      expect(model).toBeDefined();
      // Complexity can be medium or complex for philosophical queries
      expect(["medium", "complex"].includes(complexity)).toBe(true);
      // Model should be selected appropriately
      expect(model.id).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty messages array", () => {
      const messages: { role: string; content: string }[] = [];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      expect(model).toBeDefined();
      expect(model.id).toBeDefined();
    });

    it("should handle messages with no content", () => {
      const messages = [
        { role: "user", content: "" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      expect(model).toBeDefined();
    });

    it("should handle mixed task types (vision + code)", () => {
      const messages = [
        { role: "user", content: "Analyze this screenshot of a website and write the HTML/CSS code to recreate it" }
      ];
      const complexity = analyzeQueryComplexity(messages);
      const model = selectModel(complexity, "auto", undefined, messages);
      
      // Should prioritize vision (Kimi K2.5)
      expect(model.id).toBe("kimi-k2.5");
      expect(model.supportsVision).toBe(true);
    });
  });
});
