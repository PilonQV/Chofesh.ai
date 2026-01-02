/**
 * Grok/xAI Integration Tests
 * 
 * Tests the xAI API integration for Grok models
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { invokeGrok, isGrokAvailable } from "./_core/grok";

describe("Grok/xAI Integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isGrokAvailable", () => {
    it("returns true when X_ai_key is set", () => {
      process.env.X_ai_key = "test-key";
      delete process.env.GROK_API_KEY;
      expect(isGrokAvailable()).toBe(true);
    });

    it("returns true when GROK_API_KEY is set", () => {
      delete process.env.X_ai_key;
      process.env.GROK_API_KEY = "test-key";
      expect(isGrokAvailable()).toBe(true);
    });

    it("returns true when both keys are set", () => {
      process.env.X_ai_key = "primary-key";
      process.env.GROK_API_KEY = "fallback-key";
      expect(isGrokAvailable()).toBe(true);
    });

    it("returns false when no keys are set", () => {
      delete process.env.X_ai_key;
      delete process.env.GROK_API_KEY;
      expect(isGrokAvailable()).toBe(false);
    });
  });

  describe("invokeGrok", () => {
    it("throws error when no API key is available", async () => {
      delete process.env.X_ai_key;
      delete process.env.GROK_API_KEY;
      
      await expect(invokeGrok({
        messages: [{ role: "user", content: "test" }]
      })).rejects.toThrow("X_ai_key or GROK_API_KEY environment variable is not set");
    });

    it("uses X_ai_key when available", async () => {
      process.env.X_ai_key = "test-x-ai-key";
      delete process.env.GROK_API_KEY;
      
      // Mock fetch to verify the key is used
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: "test-id",
          object: "chat.completion",
          created: Date.now(),
          model: "grok-3-fast",
          choices: [{
            index: 0,
            message: { role: "assistant", content: "Hello!" },
            finish_reason: "stop"
          }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
      });
      
      global.fetch = mockFetch;
      
      await invokeGrok({
        messages: [{ role: "user", content: "test" }]
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.ai/v1/chat/completions",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-x-ai-key"
          })
        })
      );
    });

    it("defaults to grok-3-fast model", async () => {
      process.env.X_ai_key = "test-key";
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: "test-id",
          object: "chat.completion",
          created: Date.now(),
          model: "grok-3-fast",
          choices: [{
            index: 0,
            message: { role: "assistant", content: "Hello!" },
            finish_reason: "stop"
          }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
      });
      
      global.fetch = mockFetch;
      
      await invokeGrok({
        messages: [{ role: "user", content: "test" }]
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"model":"grok-3-fast"')
        })
      );
    });

    it("handles API errors gracefully", async () => {
      process.env.X_ai_key = "test-key";
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized")
      });
      
      global.fetch = mockFetch;
      
      await expect(invokeGrok({
        messages: [{ role: "user", content: "test" }]
      })).rejects.toThrow("Grok API error: 401 - Unauthorized");
    });
  });
});
