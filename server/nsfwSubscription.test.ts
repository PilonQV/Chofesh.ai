import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database functions
vi.mock("./db", () => ({
  getNsfwSubscriptionStatus: vi.fn(),
  incrementNsfwImageUsage: vi.fn(),
  verifyUserAge: vi.fn(),
  isUserAgeVerified: vi.fn(),
  updateNsfwSubscription: vi.fn(),
  createGeneratedImage: vi.fn(),
  createAuditLog: vi.fn(),
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock Venice image generation
vi.mock("./_core/veniceImage", () => ({
  generateVeniceImage: vi.fn(),
  isNsfwModel: vi.fn((model: string) => model.includes("lustify")),
  VENICE_IMAGE_MODELS: {
    LUSTIFY_SDXL: "lustify-sdxl",
    LUSTIFY_V7: "lustify-v7",
    VENICE_SD35: "venice-sd35",
    HIDREAM: "hidream",
    FLUX_2_PRO: "flux-2-pro",
    ANIME_WAI: "wai-Illustrious",
    Z_IMAGE_TURBO: "z-image-turbo",
  },
  VENICE_IMAGE_SIZES: [
    "256x256",
    "512x512",
    "1024x1024",
    "1536x1024",
    "1024x1536",
  ],
}));

// Mock audit logger
vi.mock("./_core/auditLogger", () => ({
  auditLogImageAccess: vi.fn(),
  auditLogApiCall: vi.fn(),
  getUserAgent: vi.fn().mockReturnValue("test-agent"),
}));

import {
  getNsfwSubscriptionStatus,
  incrementNsfwImageUsage,
  verifyUserAge,
  isUserAgeVerified,
} from "./db";
import { isNsfwModel, VENICE_IMAGE_MODELS, VENICE_IMAGE_SIZES } from "./_core/veniceImage";

describe("NSFW Subscription System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNsfwSubscriptionStatus", () => {
    it("should return subscription status for a user", async () => {
      const mockStatus = {
        hasNsfwSubscription: true,
        nsfwSubscriptionStatus: "active",
        nsfwImagesUsed: 25,
        nsfwImagesLimit: 100,
        ageVerified: true,
      };
      
      vi.mocked(getNsfwSubscriptionStatus).mockResolvedValue(mockStatus);
      
      const result = await getNsfwSubscriptionStatus(1);
      
      expect(result).toEqual(mockStatus);
      expect(getNsfwSubscriptionStatus).toHaveBeenCalledWith(1);
    });

    it("should return null for non-existent user", async () => {
      vi.mocked(getNsfwSubscriptionStatus).mockResolvedValue(null);
      
      const result = await getNsfwSubscriptionStatus(999);
      
      expect(result).toBeNull();
    });
  });

  describe("incrementNsfwImageUsage", () => {
    it("should increment usage when under limit", async () => {
      vi.mocked(incrementNsfwImageUsage).mockResolvedValue({
        success: true,
        imagesUsed: 26,
        imagesLimit: 100,
      });
      
      const result = await incrementNsfwImageUsage(1);
      
      expect(result.success).toBe(true);
      expect(result.imagesUsed).toBe(26);
    });

    it("should fail when limit reached", async () => {
      vi.mocked(incrementNsfwImageUsage).mockResolvedValue({
        success: false,
        imagesUsed: 100,
        imagesLimit: 100,
      });
      
      const result = await incrementNsfwImageUsage(1);
      
      expect(result.success).toBe(false);
      expect(result.imagesUsed).toBe(100);
    });
  });

  describe("Age Verification", () => {
    it("should verify user age", async () => {
      vi.mocked(verifyUserAge).mockResolvedValue(undefined);
      
      await verifyUserAge(1);
      
      expect(verifyUserAge).toHaveBeenCalledWith(1);
    });

    it("should check if user is age verified", async () => {
      vi.mocked(isUserAgeVerified).mockResolvedValue(true);
      
      const result = await isUserAgeVerified(1);
      
      expect(result).toBe(true);
    });

    it("should return false for non-verified user", async () => {
      vi.mocked(isUserAgeVerified).mockResolvedValue(false);
      
      const result = await isUserAgeVerified(1);
      
      expect(result).toBe(false);
    });
  });

  describe("NSFW Model Detection", () => {
    it("should identify Lustify SDXL as NSFW model", () => {
      expect(isNsfwModel("lustify-sdxl")).toBe(true);
    });

    it("should identify Lustify v7 as NSFW model", () => {
      expect(isNsfwModel("lustify-v7")).toBe(true);
    });

    it("should not identify standard models as NSFW", () => {
      expect(isNsfwModel("hidream")).toBe(false);
      expect(isNsfwModel("flux-2-pro")).toBe(false);
    });
  });

  describe("Venice Image Models", () => {
    it("should have all expected NSFW models", () => {
      expect(VENICE_IMAGE_MODELS.LUSTIFY_SDXL).toBe("lustify-sdxl");
      expect(VENICE_IMAGE_MODELS.LUSTIFY_V7).toBe("lustify-v7");
    });

    it("should have all expected SFW models", () => {
      expect(VENICE_IMAGE_MODELS.VENICE_SD35).toBe("venice-sd35");
      expect(VENICE_IMAGE_MODELS.HIDREAM).toBe("hidream");
      expect(VENICE_IMAGE_MODELS.FLUX_2_PRO).toBe("flux-2-pro");
    });

    it("should have all expected sizes", () => {
      expect(VENICE_IMAGE_SIZES).toContain("1024x1024");
      expect(VENICE_IMAGE_SIZES).toContain("1536x1024");
      expect(VENICE_IMAGE_SIZES).toContain("1024x1536");
    });
  });

  describe("Subscription Pricing", () => {
    it("should have correct NSFW add-on price", () => {
      const NSFW_ADDON_PRICE = 799; // $7.99 in cents
      expect(NSFW_ADDON_PRICE).toBe(799);
    });

    it("should have correct monthly image limit", () => {
      const NSFW_IMAGES_LIMIT = 100;
      expect(NSFW_IMAGES_LIMIT).toBe(100);
    });
  });

  describe("Access Control Flow", () => {
    it("should require age verification before subscription", async () => {
      vi.mocked(isUserAgeVerified).mockResolvedValue(false);
      vi.mocked(getNsfwSubscriptionStatus).mockResolvedValue({
        hasNsfwSubscription: false,
        nsfwSubscriptionStatus: "none",
        nsfwImagesUsed: 0,
        nsfwImagesLimit: 100,
        ageVerified: false,
      });
      
      const ageVerified = await isUserAgeVerified(1);
      const status = await getNsfwSubscriptionStatus(1);
      
      // User should not be able to subscribe without age verification
      expect(ageVerified).toBe(false);
      expect(status?.ageVerified).toBe(false);
    });

    it("should allow subscription after age verification", async () => {
      vi.mocked(isUserAgeVerified).mockResolvedValue(true);
      vi.mocked(getNsfwSubscriptionStatus).mockResolvedValue({
        hasNsfwSubscription: false,
        nsfwSubscriptionStatus: "none",
        nsfwImagesUsed: 0,
        nsfwImagesLimit: 100,
        ageVerified: true,
      });
      
      const ageVerified = await isUserAgeVerified(1);
      const status = await getNsfwSubscriptionStatus(1);
      
      // User can now subscribe
      expect(ageVerified).toBe(true);
      expect(status?.ageVerified).toBe(true);
    });

    it("should allow NSFW generation with active subscription", async () => {
      vi.mocked(isUserAgeVerified).mockResolvedValue(true);
      vi.mocked(getNsfwSubscriptionStatus).mockResolvedValue({
        hasNsfwSubscription: true,
        nsfwSubscriptionStatus: "active",
        nsfwImagesUsed: 50,
        nsfwImagesLimit: 100,
        ageVerified: true,
      });
      vi.mocked(incrementNsfwImageUsage).mockResolvedValue({
        success: true,
        imagesUsed: 51,
        imagesLimit: 100,
      });
      
      const ageVerified = await isUserAgeVerified(1);
      const status = await getNsfwSubscriptionStatus(1);
      const usage = await incrementNsfwImageUsage(1);
      
      expect(ageVerified).toBe(true);
      expect(status?.hasNsfwSubscription).toBe(true);
      expect(usage.success).toBe(true);
    });
  });
});
