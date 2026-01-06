import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the storage module - use correct path relative to test file
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ 
    url: "https://storage.example.com/venice/nsfw/test.png",
    key: "venice/nsfw/test.png"
  }),
}));

// Mock ENV - use correct path relative to _core/veniceImage.ts
vi.mock("./_core/env", () => ({
  ENV: {
    veniceApiKey: "test-venice-api-key",
  },
}));

describe("Venice Image Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("VENICE_IMAGE_MODELS", () => {
    it("should export all expected model IDs", async () => {
      const { VENICE_IMAGE_MODELS } = await import("./_core/veniceImage");
      
      expect(VENICE_IMAGE_MODELS.LUSTIFY_SDXL).toBe("lustify-sdxl");
      expect(VENICE_IMAGE_MODELS.LUSTIFY_V7).toBe("lustify-v7");
      expect(VENICE_IMAGE_MODELS.VENICE_SD35).toBe("venice-sd35");
      expect(VENICE_IMAGE_MODELS.HIDREAM).toBe("hidream");
      expect(VENICE_IMAGE_MODELS.FLUX_2_PRO).toBe("flux-2-pro");
    });
  });

  describe("VENICE_IMAGE_SIZES", () => {
    it("should export all expected sizes", async () => {
      const { VENICE_IMAGE_SIZES } = await import("./_core/veniceImage");
      
      expect(VENICE_IMAGE_SIZES).toContain("1024x1024");
      expect(VENICE_IMAGE_SIZES).toContain("1536x1024");
      expect(VENICE_IMAGE_SIZES).toContain("1024x1536");
    });
  });

  describe("isNsfwModel", () => {
    it("should return true for Lustify SDXL", async () => {
      const { isNsfwModel } = await import("./_core/veniceImage");
      expect(isNsfwModel("lustify-sdxl")).toBe(true);
    });

    it("should return true for Lustify v7", async () => {
      const { isNsfwModel } = await import("./_core/veniceImage");
      expect(isNsfwModel("lustify-v7")).toBe(true);
    });

    it("should return false for standard models", async () => {
      const { isNsfwModel } = await import("./_core/veniceImage");
      expect(isNsfwModel("hidream")).toBe(false);
      expect(isNsfwModel("flux-2-pro")).toBe(false);
      expect(isNsfwModel("venice-sd35")).toBe(false);
    });
  });

  describe("getModelPrice", () => {
    it("should return correct price for NSFW models", async () => {
      const { getModelPrice } = await import("./_core/veniceImage");
      expect(getModelPrice("lustify-sdxl")).toBe(0.01);
      expect(getModelPrice("lustify-v7")).toBe(0.01);
    });

    it("should return correct price for premium models", async () => {
      const { getModelPrice } = await import("./_core/veniceImage");
      expect(getModelPrice("flux-2-pro")).toBe(0.04);
      expect(getModelPrice("flux-2-max")).toBe(0.09);
    });

    it("should return default price for unknown models", async () => {
      const { getModelPrice } = await import("./_core/veniceImage");
      expect(getModelPrice("unknown-model")).toBe(0.01);
    });
  });

  describe("generateVeniceImage", () => {
    it("should throw error if prompt is empty", async () => {
      const { generateVeniceImage } = await import("./_core/veniceImage");
      
      await expect(generateVeniceImage({ prompt: "" }))
        .rejects.toThrow("Prompt is required");
    });

    it("should throw error if prompt is too long", async () => {
      const { generateVeniceImage } = await import("./_core/veniceImage");
      const longPrompt = "a".repeat(1501);
      
      await expect(generateVeniceImage({ prompt: longPrompt }))
        .rejects.toThrow("Prompt must be 1500 characters or less");
    });

    it("should use low moderation for NSFW requests", async () => {
      const { generateVeniceImage } = await import("./_core/veniceImage");
      
      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          created: Date.now(),
          data: [{ b64_json: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" }]
        })
      });
      global.fetch = mockFetch;

      await generateVeniceImage({
        prompt: "test prompt",
        model: "lustify-sdxl",
        nsfw: true
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.venice.ai/api/v1/images/generations",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"moderation":"low"')
        })
      );
    });

    it("should use auto moderation for SFW requests", async () => {
      const { generateVeniceImage } = await import("./_core/veniceImage");
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          created: Date.now(),
          data: [{ b64_json: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" }]
        })
      });
      global.fetch = mockFetch;

      await generateVeniceImage({
        prompt: "test prompt",
        nsfw: false
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"moderation":"auto"')
        })
      );
    });

    it("should handle API errors gracefully", async () => {
      const { generateVeniceImage } = await import("./_core/veniceImage");
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized")
      });

      await expect(generateVeniceImage({ prompt: "test" }))
        .rejects.toThrow("Invalid Venice API key");
    });

    it("should handle rate limit errors", async () => {
      const { generateVeniceImage } = await import("./_core/veniceImage");
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve("Rate limited")
      });

      await expect(generateVeniceImage({ prompt: "test" }))
        .rejects.toThrow("rate limit exceeded");
    });

    it("should handle insufficient credits error", async () => {
      const { generateVeniceImage } = await import("./_core/veniceImage");
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        text: () => Promise.resolve("Payment required")
      });

      await expect(generateVeniceImage({ prompt: "test" }))
        .rejects.toThrow("Insufficient Venice credits");
    });
  });
});
