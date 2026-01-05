import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  evaluateMath,
  convertUnits,
  convertCurrency,
  convertTimezone,
  scrapeUrl,
} from "./_core/smartTools";
import {
  extractVideoId,
  containsYouTubeUrl,
} from "./_core/youtube";

describe("Smart Tools", () => {
  describe("Math Calculator", () => {
    it("should evaluate basic arithmetic", () => {
      expect(evaluateMath("2 + 2").result).toBe("4");
      expect(evaluateMath("10 * 5").result).toBe("50");
      expect(evaluateMath("100 / 4").result).toBe("25");
      expect(evaluateMath("15 - 7").result).toBe("8");
    });

    it("should handle decimal numbers", () => {
      expect(evaluateMath("3.14 * 2").result).toBe("6.28");
      expect(evaluateMath("10 / 3").result).toMatch(/^3\.333/);
    });

    it("should handle parentheses", () => {
      expect(evaluateMath("(2 + 3) * 4").result).toBe("20");
      expect(evaluateMath("2 + 3 * 4").result).toBe("14");
    });

    it("should handle exponents", () => {
      expect(evaluateMath("2^3").result).toBe("8");
      expect(evaluateMath("10^2").result).toBe("100");
    });

    it("should handle math functions", () => {
      expect(evaluateMath("sqrt(16)").result).toBe("4");
      expect(evaluateMath("abs(-5)").result).toBe("5");
    });

    it("should return error for invalid expressions", () => {
      expect(evaluateMath("invalid").result).toContain("Error");
    });
  });

  describe("Unit Converter", () => {
    it("should convert length units", () => {
      const result = convertUnits(1, "km", "m");
      expect(result).not.toBeNull();
      expect(result!.to.value).toBe(1000);
    });

    it("should convert weight units", () => {
      const result = convertUnits(1, "kg", "g");
      expect(result).not.toBeNull();
      expect(result!.to.value).toBe(1000);
    });

    it("should convert temperature units", () => {
      const result = convertUnits(0, "c", "f");
      expect(result).not.toBeNull();
      expect(result!.to.value).toBe(32);
    });

    it("should convert volume units", () => {
      const result = convertUnits(1, "l", "ml");
      expect(result).not.toBeNull();
      expect(result!.to.value).toBe(1000);
    });

    it("should handle unit aliases", () => {
      const result = convertUnits(1, "kilometer", "meter");
      expect(result).not.toBeNull();
      expect(result!.to.value).toBe(1000);
    });

    it("should return null for incompatible units", () => {
      const result = convertUnits(1, "km", "kg");
      expect(result).toBeNull();
    });

    it("should return null for unknown units", () => {
      const result = convertUnits(1, "unknown", "m");
      expect(result).toBeNull();
    });
  });

  describe("Currency Converter", () => {
    it("should convert USD to EUR", () => {
      const result = convertCurrency(100, "USD", "EUR");
      expect(result).not.toBeNull();
      expect(result!.to.value).toBeGreaterThan(0);
      expect(result!.to.unit).toBe("EUR");
    });

    it("should convert EUR to USD", () => {
      const result = convertCurrency(100, "EUR", "USD");
      expect(result).not.toBeNull();
      expect(result!.to.value).toBeGreaterThan(100); // EUR is stronger
    });

    it("should handle case insensitivity", () => {
      const result = convertCurrency(100, "usd", "eur");
      expect(result).not.toBeNull();
    });

    it("should return null for unknown currencies", () => {
      const result = convertCurrency(100, "XYZ", "USD");
      expect(result).toBeNull();
    });
  });

  describe("Timezone Converter", () => {
    it("should convert EST to PST", () => {
      const result = convertTimezone("12:00", "EST", "PST");
      expect(result).not.toBeNull();
      expect(result!.to.time).toBe("9:00 AM");
    });

    it("should convert UTC to JST", () => {
      const result = convertTimezone("12:00", "UTC", "JST");
      expect(result).not.toBeNull();
      expect(result!.to.time).toBe("9:00 PM");
    });

    it("should handle AM/PM format", () => {
      const result = convertTimezone("3:00 PM", "EST", "UTC");
      expect(result).not.toBeNull();
    });

    it("should return null for invalid timezones", () => {
      const result = convertTimezone("12:00", "INVALID", "UTC");
      expect(result).toBeNull();
    });

    it("should return null for invalid time format", () => {
      const result = convertTimezone("invalid", "EST", "PST");
      expect(result).toBeNull();
    });
  });
});

describe("YouTube Tools", () => {
  describe("extractVideoId", () => {
    it("should extract video ID from standard URL", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from short URL", () => {
      expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from embed URL", () => {
      expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from direct ID", () => {
      expect(extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("should return null for invalid URLs", () => {
      expect(extractVideoId("https://example.com")).toBeNull();
      expect(extractVideoId("not a url")).toBeNull();
    });
  });

  describe("containsYouTubeUrl", () => {
    it("should detect YouTube URLs in text", () => {
      expect(containsYouTubeUrl("Check out this video: https://www.youtube.com/watch?v=abc123")).toBe(true);
      expect(containsYouTubeUrl("Here's a link: https://youtu.be/abc123")).toBe(true);
    });

    it("should return false for non-YouTube URLs", () => {
      expect(containsYouTubeUrl("Visit https://example.com")).toBe(false);
      expect(containsYouTubeUrl("No URLs here")).toBe(false);
    });
  });
});

describe("URL Scraper", () => {
  it("should handle fetch errors gracefully", async () => {
    // Mock fetch to simulate error
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    
    const result = await scrapeUrl("https://invalid-url-that-will-fail.com");
    expect(result).toBeNull();
    
    global.fetch = originalFetch;
  });
});
