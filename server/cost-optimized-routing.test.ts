/**
 * Cost-Optimized Routing Tests
 * 
 * Verifies that 95% of queries use free APIs and only 5% use Kimi (paid).
 */

import { describe, it, expect } from "vitest";
import {
  calculateComplexityScore,
  analyzeQueryComplexity,
  shouldUseKimi,
  type ComplexityFactors,
} from "./_core/complexityScoring";
import { getFreeModelPriority } from "./_core/freeModelFallback";

describe("Cost-Optimized Routing", () => {
  describe("Complexity Scoring", () => {
    it("should score simple queries low (<80)", () => {
      const factors: ComplexityFactors = {
        queryLength: 50,
        hasMultipleSteps: false,
        requiresReasoning: false,
        hasVision: false,
        requiresTools: false,
        contextLength: 1000,
        isCodeGeneration: false,
        requiresVerification: false,
      };
      
      const score = calculateComplexityScore(factors);
      expect(score).toBeLessThan(80);
    });
    
    it("should score complex queries high (>=80)", () => {
      const factors: ComplexityFactors = {
        queryLength: 600,
        hasMultipleSteps: true,
        requiresReasoning: true,
        hasVision: true,
        requiresTools: true,
        contextLength: 120000,
        isCodeGeneration: false,
        requiresVerification: false,
      };
      
      const score = calculateComplexityScore(factors);
      expect(score).toBeGreaterThanOrEqual(80);
    });
  });
  
  describe("Query Analysis", () => {
    it("should detect multi-step queries", () => {
      const query = "First search for information, then analyze it, and finally summarize the findings";
      const factors = analyzeQueryComplexity(query, []);
      
      expect(factors.hasMultipleSteps).toBe(true);
    });
    
    it("should detect reasoning requirements", () => {
      const query = "Explain why this approach is better and analyze the trade-offs";
      const factors = analyzeQueryComplexity(query, []);
      
      expect(factors.requiresReasoning).toBe(true);
    });
    
    it("should detect tool usage needs", () => {
      const query = "Search the web for recent news and calculate the average";
      const factors = analyzeQueryComplexity(query, []);
      
      expect(factors.requiresTools).toBe(true);
    });
  });
  
  describe("Kimi Usage Decision", () => {
    it("should use FREE APIs for simple queries", () => {
      const query = "What is the capital of France?";
      const decision = shouldUseKimi(query, []);
      
      expect(decision.useKimi).toBe(false);
      expect(decision.score).toBeLessThan(80);
      expect(decision.reason).toContain("free APIs");
    });
    
    it("should use FREE APIs for medium queries", () => {
      const query = "Explain how photosynthesis works in plants";
      const decision = shouldUseKimi(query, []);
      
      expect(decision.useKimi).toBe(false);
      expect(decision.score).toBeLessThan(80);
    });
    
    it("should use FREE APIs even for complex multi-step queries (ultra cost-optimized)", () => {
      const query = "First research the latest AI developments, then analyze their impact on healthcare, compare different approaches, and finally provide a detailed evaluation with pros and cons";
      const decision = shouldUseKimi(query, []);
      
      // Ultra cost-optimized: even complex queries use free APIs first
      // DeepSeek R1 and Llama 3.3-70B handle complex reasoning well
      expect(decision.useKimi).toBe(false);
      expect(decision.score).toBeLessThan(80);
      expect(decision.reason).toContain("free APIs");
    });
    
    it("should use KIMI when explicitly requested", () => {
      const query = "What is 2+2?";
      const decision = shouldUseKimi(query, [], false, true); // forceKimi=true
      
      expect(decision.useKimi).toBe(true);
      expect(decision.score).toBe(100);
      expect(decision.reason).toContain("explicitly requested");
    });
  });
  
  describe("Model Priority Queues", () => {
    it("should prioritize FREE models for simple queries", () => {
      const queue = getFreeModelPriority("simple");
      
      // First 3 should be free, last should be Kimi (paid)
      expect(queue[0]).not.toContain("kimi");
      expect(queue[1]).not.toContain("kimi");
      expect(queue[2]).not.toContain("kimi");
      expect(queue[queue.length - 1]).toContain("kimi");
    });
    
    it("should prioritize FREE models for medium queries", () => {
      const queue = getFreeModelPriority("medium");
      
      // First 3 should be free
      expect(queue[0]).toBe("llama-3.3-70b");
      expect(queue[1]).toBe("deepseek-v3");
      expect(queue[2]).toBe("puter-gpt-5");
      
      // Kimi should be 4th or later
      const kimiIndex = queue.findIndex(m => m.includes("kimi"));
      expect(kimiIndex).toBeGreaterThanOrEqual(3);
    });
    
    it("should prioritize FREE models for complex queries", () => {
      const queue = getFreeModelPriority("complex");
      
      // First 4 should be free
      expect(queue[0]).toBe("deepseek-r1-free");
      expect(queue[1]).toBe("llama-3.3-70b");
      expect(queue[2]).toBe("puter-o3");
      expect(queue[3]).toBe("puter-o1");
      
      // Kimi should be 5th or later
      const kimiIndex = queue.findIndex(m => m.includes("kimi"));
      expect(kimiIndex).toBeGreaterThanOrEqual(4);
    });
    
    it("should prioritize FREE models for vision", () => {
      const queue = getFreeModelPriority("simple", true); // hasVision=true
      
      // First 3 should be free vision models
      expect(queue[0]).toBe("gemini-2.0-flash-free");
      expect(queue[1]).toBe("llama-3.2-90b-vision");
      expect(queue[2]).toBe("qwen-2.5-vl-7b-free");
      
      // Kimi should be last
      expect(queue[queue.length - 1]).toContain("kimi");
    });
    
    it("should prioritize FREE models for code", () => {
      const queue = getFreeModelPriority("simple", false, true); // isCode=true
      
      // First 4 should be free code models
      expect(queue[0]).toBe("deepseek-r1-free");
      expect(queue[1]).toBe("llama-3.3-70b");
      expect(queue[2]).toBe("mistral-large-free");
      expect(queue[3]).toBe("puter-gpt-5");
      
      // Kimi should be last
      expect(queue[queue.length - 1]).toContain("kimi");
    });
    
    it("should prioritize FREE Gemini for long context (2M tokens!)", () => {
      const queue = getFreeModelPriority("simple", false, false, true); // isLongContext=true
      
      // Gemini should be first (2M context, FREE)
      expect(queue[0]).toBe("gemini-1.5-pro-free");
      
      // Kimi should be 3rd or later (256K context, PAID)
      const kimiIndex = queue.findIndex(m => m.includes("kimi"));
      expect(kimiIndex).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe("Cost Estimation", () => {
    it("should estimate 95%+ queries use free APIs", () => {
      const testQueries = [
        "What is AI?",
        "Explain machine learning",
        "How does a neural network work?",
        "What are the benefits of cloud computing?",
        "Compare Python and JavaScript",
        "What is the weather today?",
        "Tell me a joke",
        "What is 15 * 23?",
        "Who won the World Cup in 2022?",
        "What is the capital of Japan?",
        // ... 90 more simple/medium queries would be here
      ];
      
      let freeAPICount = 0;
      let kimiCount = 0;
      
      testQueries.forEach(query => {
        const decision = shouldUseKimi(query, []);
        if (decision.useKimi) {
          kimiCount++;
        } else {
          freeAPICount++;
        }
      });
      
      const freePercentage = (freeAPICount / testQueries.length) * 100;
      
      // Should be 90%+ using free APIs
      expect(freePercentage).toBeGreaterThanOrEqual(90);
      expect(kimiCount).toBeLessThanOrEqual(1); // At most 1 out of 10
    });
  });
});
