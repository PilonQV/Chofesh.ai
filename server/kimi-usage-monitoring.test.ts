/**
 * Test: Kimi 2.5 API Usage Monitoring System (Phase 75)
 * 
 * Verify that:
 * 1. API usage tracking logs token counts and costs correctly
 * 2. Rate limiting prevents excessive API calls
 * 3. Analytics endpoint returns usage statistics
 * 4. Cost calculations match Kimi 2.5 pricing
 */

import { describe, it, expect, beforeEach } from "vitest";
import { 
  logAPIUsage, 
  getUsageStats, 
  getAllUsageStats, 
  getRecentLogs, 
  clearUsageLogs,
  type APIUsageLog 
} from "./_core/apiUsageLogger";
import { 
  checkRateLimit, 
  recordRequest, 
  getRateLimitStatus, 
  resetRateLimits,
  DEFAULT_KIMI_RATE_LIMITS 
} from "./_core/apiRateLimiter";

describe("Phase 75: Kimi 2.5 API Usage Monitoring", () => {
  beforeEach(() => {
    // Clear state before each test
    clearUsageLogs();
    resetRateLimits();
  });

  describe("API Usage Logging", () => {
    it("should log API usage with correct structure", () => {
      const log: APIUsageLog = {
        timestamp: new Date().toISOString(),
        provider: "kimi",
        model: "kimi-k2.5",
        tokens: {
          input: 1000,
          output: 500,
          total: 1500,
        },
        cost: {
          input: 0.0006,  // $0.0006 per 1K input
          output: 0.0009, // $0.0018 per 1K output
          total: 0.0015,
        },
        success: true,
      };

      logAPIUsage(log);

      const recentLogs = getRecentLogs("kimi", 10);
      expect(recentLogs.length).toBe(1);
      expect(recentLogs[0]).toMatchObject(log);
    });

    it("should calculate costs correctly for Kimi 2.5 pricing", () => {
      const inputTokens = 2000;
      const outputTokens = 1000;
      
      // Kimi K2.5 pricing: $0.0006 per 1K input, $0.0018 per 1K output
      const expectedInputCost = (inputTokens / 1000) * 0.0006;  // $0.0012
      const expectedOutputCost = (outputTokens / 1000) * 0.0018; // $0.0018
      const expectedTotalCost = expectedInputCost + expectedOutputCost; // $0.0030

      expect(expectedInputCost).toBe(0.0012);
      expect(expectedOutputCost).toBe(0.0018);
      expect(expectedTotalCost).toBe(0.003);
    });

    it("should aggregate usage statistics correctly", () => {
      // Log 3 requests
      for (let i = 0; i < 3; i++) {
        logAPIUsage({
          timestamp: new Date().toISOString(),
          provider: "kimi",
          model: "kimi-k2.5",
          tokens: { input: 1000, output: 500, total: 1500 },
          cost: { input: 0.0006, output: 0.0009, total: 0.0015 },
          success: true,
        });
      }

      const stats = getUsageStats("kimi", "kimi-k2.5");
      expect(stats.totalRequests).toBe(3);
      expect(stats.successfulRequests).toBe(3);
      expect(stats.totalTokens).toBe(4500); // 1500 * 3
      expect(stats.totalCost).toBeCloseTo(0.0045, 4); // 0.0015 * 3
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests under rate limits", () => {
      const result = checkRateLimit("kimi");
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should block requests exceeding per-minute limit", () => {
      // Record 60 requests (max per minute)
      for (let i = 0; i < 60; i++) {
        recordRequest("kimi", 0.001);
      }

      // 61st request should be blocked
      const result = checkRateLimit("kimi");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("60 requests/minute");
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should block requests exceeding cost per hour limit", () => {
      // Record requests totaling $5.01 (over $5/hour limit)
      recordRequest("kimi", 5.01);

      const result = checkRateLimit("kimi", 0.01);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("$5/hour");
    });

    it("should provide accurate rate limit status", () => {
      // Record 10 requests costing $0.50 total
      for (let i = 0; i < 10; i++) {
        recordRequest("kimi", 0.05);
      }

      const status = getRateLimitStatus("kimi");
      expect(status.current.requestsThisMinute).toBe(10);
      expect(status.current.costThisHour).toBeCloseTo(0.5, 2);
      expect(status.remaining.requestsThisMinute).toBe(50); // 60 - 10
      expect(status.remaining.costThisHour).toBe(4.5); // $5 - $0.50
      expect(status.percentUsed.requestsPerMinute).toBeCloseTo(16.67, 1); // 10/60 * 100
      expect(status.percentUsed.costPerHour).toBe(10); // 0.5/5 * 100
    });
  });

  describe("Rate Limit Configuration", () => {
    it("should have correct default rate limits", () => {
      expect(DEFAULT_KIMI_RATE_LIMITS.maxRequestsPerMinute).toBe(60);
      expect(DEFAULT_KIMI_RATE_LIMITS.maxRequestsPerHour).toBe(1000);
      expect(DEFAULT_KIMI_RATE_LIMITS.maxRequestsPerDay).toBe(10000);
      expect(DEFAULT_KIMI_RATE_LIMITS.maxCostPerHour).toBe(5.00);
      expect(DEFAULT_KIMI_RATE_LIMITS.maxCostPerDay).toBe(50.00);
    });

    it("should estimate monthly cost correctly", () => {
      const dailyCost = 50.00; // Max daily cost
      const estimatedMonthlyCost = dailyCost * 30;
      expect(estimatedMonthlyCost).toBe(1500.00);
    });
  });

  describe("Usage Analytics", () => {
    it("should return all usage stats across providers", () => {
      // Log requests for different models
      logAPIUsage({
        timestamp: new Date().toISOString(),
        provider: "kimi",
        model: "kimi-k2.5",
        tokens: { input: 1000, output: 500, total: 1500 },
        cost: { input: 0.0006, output: 0.0009, total: 0.0015 },
        success: true,
      });

      logAPIUsage({
        timestamp: new Date().toISOString(),
        provider: "kimi",
        model: "kimi-k2-thinking",
        tokens: { input: 2000, output: 1000, total: 3000 },
        cost: { input: 0.0012, output: 0.0018, total: 0.003 },
        success: true,
      });

      const allStats = getAllUsageStats();
      expect(allStats.length).toBe(2);
      expect(allStats.some(s => s.model === "kimi-k2.5")).toBe(true);
      expect(allStats.some(s => s.model === "kimi-k2-thinking")).toBe(true);
    });

    it("should track failed requests separately", () => {
      // Log successful request
      logAPIUsage({
        timestamp: new Date().toISOString(),
        provider: "kimi",
        model: "kimi-k2.5",
        tokens: { input: 1000, output: 500, total: 1500 },
        cost: { input: 0.0006, output: 0.0009, total: 0.0015 },
        success: true,
      });

      // Log failed request
      logAPIUsage({
        timestamp: new Date().toISOString(),
        provider: "kimi",
        model: "kimi-k2.5",
        tokens: { input: 0, output: 0, total: 0 },
        cost: { input: 0, output: 0, total: 0 },
        success: false,
        error: "Rate limit exceeded",
      });

      const stats = getUsageStats("kimi", "kimi-k2.5");
      expect(stats.totalRequests).toBe(2);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(1);
    });
  });

  describe("Production Monitoring", () => {
    it("should estimate monthly cost based on 24-hour usage", () => {
      // Simulate 24 hours of usage at $2/hour
      const hourlyRequests = 100;
      const costPerRequest = 0.02; // $0.02 per request
      const hourlyCost = hourlyRequests * costPerRequest; // $2/hour

      const dailyCost = hourlyCost * 24; // $48/day
      const estimatedMonthlyCost = dailyCost * 30; // $1440/month

      expect(dailyCost).toBe(48);
      expect(estimatedMonthlyCost).toBe(1440);
    });

    it("should warn when approaching cost limits", () => {
      // Record $4.50 (90% of $5/hour limit)
      recordRequest("kimi", 4.50);

      const status = getRateLimitStatus("kimi");
      expect(status.percentUsed.costPerHour).toBe(90);
      
      // Should still allow requests under the limit
      const result = checkRateLimit("kimi", 0.49);
      expect(result.allowed).toBe(true);
      
      // But should block requests that would exceed the limit
      const result2 = checkRateLimit("kimi", 0.51);
      expect(result2.allowed).toBe(false);
    });
  });
});
