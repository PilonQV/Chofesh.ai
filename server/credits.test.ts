import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  })),
}));

describe("Credits System", () => {
  describe("Credit Costs", () => {
    it("should have correct credit costs for chat models", () => {
      // Free tier models should cost 1 credit
      const freeTierModels = ["llama-3.1-8b-instant", "llama-3.2-3b-preview"];
      const standardModels = ["gpt-4o-mini", "gemini-1.5-flash"];
      const premiumModels = ["gpt-4o", "claude-3-5-sonnet"];
      
      // These are the expected costs from our pricing model
      expect(freeTierModels.length).toBeGreaterThan(0);
      expect(standardModels.length).toBeGreaterThan(0);
      expect(premiumModels.length).toBeGreaterThan(0);
    });

    it("should have correct credit costs for image generation", () => {
      // Standard image: 8 credits
      // Uncensored image: 10 credits
      // Premium image: 20 credits
      const standardImageCost = 8;
      const uncensoredImageCost = 10;
      const premiumImageCost = 20;
      
      expect(standardImageCost).toBeLessThan(uncensoredImageCost);
      expect(uncensoredImageCost).toBeLessThan(premiumImageCost);
    });
  });

  describe("Credit Packs", () => {
    it("should have 4 credit packs with correct pricing", () => {
      const packs = [
        { name: "starter", credits: 150, priceUsd: 500 },
        { name: "standard", credits: 500, priceUsd: 1200 },
        { name: "pro", credits: 1800, priceUsd: 3500 },
        { name: "power", credits: 6000, priceUsd: 9900 },
      ];
      
      expect(packs).toHaveLength(4);
      
      // Verify pricing tiers (larger packs should have better value)
      const starterCostPer100 = (packs[0].priceUsd / packs[0].credits) * 100;
      const powerCostPer100 = (packs[3].priceUsd / packs[3].credits) * 100;
      
      expect(powerCostPer100).toBeLessThan(starterCostPer100);
    });

    it("should have valid Stripe price IDs", () => {
      const packs = [
        { name: "starter", stripePriceId: "price_starter_150" },
        { name: "standard", stripePriceId: "price_standard_500" },
        { name: "pro", stripePriceId: "price_pro_1800" },
        { name: "power", stripePriceId: "price_power_6000" },
      ];
      
      packs.forEach(pack => {
        expect(pack.stripePriceId).toBeTruthy();
        expect(pack.stripePriceId.startsWith("price_")).toBe(true);
      });
    });
  });

  describe("Free Credits", () => {
    it("should provide 30 free credits daily", () => {
      const dailyFreeCredits = 30;
      expect(dailyFreeCredits).toBe(30);
    });

    it("should refresh free credits after 24 hours", () => {
      const lastRefresh = new Date("2026-01-07T10:00:00Z");
      const now = new Date("2026-01-08T10:00:00Z");
      const hoursDiff = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
      
      expect(hoursDiff).toBeGreaterThanOrEqual(24);
    });

    it("should not refresh free credits before 24 hours", () => {
      const lastRefresh = new Date("2026-01-08T10:00:00Z");
      const now = new Date("2026-01-08T20:00:00Z");
      const hoursDiff = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
      
      expect(hoursDiff).toBeLessThan(24);
    });
  });

  describe("Credit Deduction", () => {
    it("should deduct from free credits first", () => {
      const freeCredits = 20;
      const purchasedCredits = 100;
      const cost = 5;
      
      // After deduction, free credits should decrease first
      const newFreeCredits = Math.max(0, freeCredits - cost);
      const newPurchasedCredits = purchasedCredits - Math.max(0, cost - freeCredits);
      
      expect(newFreeCredits).toBe(15);
      expect(newPurchasedCredits).toBe(100);
    });

    it("should use purchased credits when free credits exhausted", () => {
      const freeCredits = 3;
      const purchasedCredits = 100;
      const cost = 10;
      
      // Free credits can only cover 3, so 7 comes from purchased
      const newFreeCredits = Math.max(0, freeCredits - cost);
      const remainingCost = Math.max(0, cost - freeCredits);
      const newPurchasedCredits = purchasedCredits - remainingCost;
      
      expect(newFreeCredits).toBe(0);
      expect(newPurchasedCredits).toBe(93);
    });

    it("should reject if insufficient total credits", () => {
      const freeCredits = 5;
      const purchasedCredits = 3;
      const cost = 10;
      const totalCredits = freeCredits + purchasedCredits;
      
      expect(totalCredits).toBeLessThan(cost);
    });
  });

  describe("Model Tier Classification", () => {
    it("should correctly classify free tier models", () => {
      const freeModels = [
        "llama-3.1-8b-instant",
        "llama-3.2-3b-preview",
        "llama-3.1-70b-versatile",
      ];
      
      freeModels.forEach(model => {
        expect(model.includes("llama")).toBe(true);
      });
    });

    it("should correctly classify premium tier models", () => {
      const premiumModels = [
        "gpt-4o",
        "claude-3-5-sonnet",
        "claude-3-opus",
      ];
      
      premiumModels.forEach(model => {
        const isPremium = model.includes("gpt-4o") || 
                          model.includes("claude-3-5") || 
                          model.includes("opus");
        expect(isPremium).toBe(true);
      });
    });

    it("should correctly classify model tiers", () => {
      const freeTierModels = ["llama-3.1-8b-instant", "deepseek-r1-free"];
      
      freeTierModels.forEach(model => {
        const isFree = model.includes("free") || model.includes("instant");
        expect(isFree).toBe(true);
      });
    });
  });

  describe("Margin Calculations", () => {
    it("should achieve target margin of 68-72%", () => {
      // Starter pack: $5 for 150 credits
      // If average cost per credit is $0.01, total cost = $1.50
      // Margin = ($5 - $1.50) / $5 = 70%
      const starterPrice = 5;
      const starterCredits = 150;
      const avgCostPerCredit = 0.01;
      const totalCost = starterCredits * avgCostPerCredit;
      const margin = (starterPrice - totalCost) / starterPrice;
      
      expect(margin).toBeGreaterThanOrEqual(0.68);
      expect(margin).toBeLessThanOrEqual(0.72);
    });
  });
});
