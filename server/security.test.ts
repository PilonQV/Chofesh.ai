import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }),
  getUserByEmail: vi.fn(),
  createEmailUser: vi.fn(),
  verifyUserEmail: vi.fn(),
}));

describe("Email Verification", () => {
  describe("generateVerificationToken", () => {
    it("should generate a token and expiry date", async () => {
      const { generateVerificationToken } = await import("./_core/emailVerification");
      const result = generateVerificationToken();
      
      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.expiry).toBeInstanceOf(Date);
      expect(result.expiry.getTime()).toBeGreaterThan(Date.now());
    });

    it("should generate unique tokens", async () => {
      const { generateVerificationToken } = await import("./_core/emailVerification");
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();
      
      expect(token1.token).not.toBe(token2.token);
    });
  });

  describe("isVerificationTokenExpired", () => {
    it("should return true for null expiry", async () => {
      const { isVerificationTokenExpired } = await import("./_core/emailVerification");
      expect(isVerificationTokenExpired(null)).toBe(true);
    });

    it("should return true for past date", async () => {
      const { isVerificationTokenExpired } = await import("./_core/emailVerification");
      const pastDate = new Date(Date.now() - 1000);
      expect(isVerificationTokenExpired(pastDate)).toBe(true);
    });

    it("should return false for future date", async () => {
      const { isVerificationTokenExpired } = await import("./_core/emailVerification");
      const futureDate = new Date(Date.now() + 60000);
      expect(isVerificationTokenExpired(futureDate)).toBe(false);
    });
  });

  describe("generateVerificationEmailHtml", () => {
    it("should generate HTML with user name and URL", async () => {
      const { generateVerificationEmailHtml } = await import("./_core/emailVerification");
      const html = generateVerificationEmailHtml("John", "https://example.com/verify?token=abc123");
      
      expect(html).toContain("John");
      expect(html).toContain("https://example.com/verify?token=abc123");
      expect(html).toContain("Chofesh.ai");
      expect(html).toContain("Verify Email Address");
    });

    it("should handle empty user name", async () => {
      const { generateVerificationEmailHtml } = await import("./_core/emailVerification");
      const html = generateVerificationEmailHtml("", "https://example.com/verify");
      
      expect(html).toContain("there");
    });
  });

  describe("generateVerificationEmailText", () => {
    it("should generate plain text with user name and URL", async () => {
      const { generateVerificationEmailText } = await import("./_core/emailVerification");
      const text = generateVerificationEmailText("Jane", "https://example.com/verify?token=xyz");
      
      expect(text).toContain("Jane");
      expect(text).toContain("https://example.com/verify?token=xyz");
      expect(text).toContain("Chofesh.ai");
    });
  });
});

describe("Rate Limiting", () => {
  describe("RATE_LIMIT_CONFIG", () => {
    it("should have IP rate limit configuration", async () => {
      const { RATE_LIMIT_CONFIG } = await import("./_core/rateLimit");
      
      expect(RATE_LIMIT_CONFIG.ip).toBeDefined();
      expect(RATE_LIMIT_CONFIG.ip.maxAttempts).toBe(5);
      expect(RATE_LIMIT_CONFIG.ip.windowMinutes).toBe(15);
      expect(RATE_LIMIT_CONFIG.ip.blockMinutes).toBe(15);
    });

    it("should have email rate limit configuration", async () => {
      const { RATE_LIMIT_CONFIG } = await import("./_core/rateLimit");
      
      expect(RATE_LIMIT_CONFIG.email).toBeDefined();
      expect(RATE_LIMIT_CONFIG.email.maxAttempts).toBe(10);
      expect(RATE_LIMIT_CONFIG.email.windowMinutes).toBe(30);
      expect(RATE_LIMIT_CONFIG.email.blockMinutes).toBe(30);
    });
  });

  describe("checkRateLimit", () => {
    it("should allow requests when no previous attempts", async () => {
      const { checkRateLimit } = await import("./_core/rateLimit");
      const result = await checkRateLimit("192.168.1.1", "ip");
      
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
      expect(result.blockedUntil).toBeNull();
    });

    it("should allow requests for email with no previous attempts", async () => {
      const { checkRateLimit } = await import("./_core/rateLimit");
      const result = await checkRateLimit("test@example.com", "email");
      
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(10);
    });
  });

  describe("recordFailedAttempt", () => {
    it("should record a failed attempt and return remaining attempts", async () => {
      const { recordFailedAttempt } = await import("./_core/rateLimit");
      const result = await recordFailedAttempt("192.168.1.2", "ip");
      
      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe("boolean");
      expect(typeof result.remainingAttempts).toBe("number");
    });

    it("should handle email identifier type", async () => {
      const { recordFailedAttempt } = await import("./_core/rateLimit");
      const result = await recordFailedAttempt("test2@example.com", "email");
      
      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe("boolean");
    });
  });

  describe("clearRateLimit", () => {
    it("should clear rate limit without error", async () => {
      const { clearRateLimit } = await import("./_core/rateLimit");
      
      // Should not throw
      await expect(clearRateLimit("192.168.1.3", "ip")).resolves.not.toThrow();
    });

    it("should handle email identifier type", async () => {
      const { clearRateLimit } = await import("./_core/rateLimit");
      
      await expect(clearRateLimit("test3@example.com", "email")).resolves.not.toThrow();
    });
  });

  describe("cleanupOldRateLimits", () => {
    it("should cleanup old records without error", async () => {
      const { cleanupOldRateLimits } = await import("./_core/rateLimit");
      
      const result = await cleanupOldRateLimits();
      expect(typeof result).toBe("number");
    });
  });
});

describe("Password Authentication Integration", () => {
  describe("Password hashing", () => {
    it("should hash and verify passwords correctly", async () => {
      const { hashPassword, verifyPassword } = await import("./_core/passwordAuth");
      
      const password = "SecurePassword123!";
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword("wrongpassword", hash)).toBe(false);
    });
  });

  describe("Password validation", () => {
    it("should reject passwords shorter than 8 characters", async () => {
      const { validatePassword } = await import("./_core/passwordAuth");
      
      const error = validatePassword("short");
      expect(error).toBeTruthy();
      expect(error).toContain("8 characters");
    });

    it("should accept valid passwords", async () => {
      const { validatePassword } = await import("./_core/passwordAuth");
      
      const error = validatePassword("ValidPassword123!");
      expect(error).toBeNull();
    });
  });

  describe("Token generation", () => {
    it("should generate unique tokens", async () => {
      const { generateToken } = await import("./_core/passwordAuth");
      
      const token1 = generateToken();
      const token2 = generateToken();
      
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(0);
    });
  });

  describe("Email OpenID generation", () => {
    it("should generate consistent OpenID for same email", async () => {
      const { generateEmailOpenId } = await import("./_core/passwordAuth");
      
      const openId1 = generateEmailOpenId("test@example.com");
      const openId2 = generateEmailOpenId("test@example.com");
      
      expect(openId1).toBe(openId2);
      expect(openId1).toContain("email_");
    });

    it("should generate different OpenID for different emails", async () => {
      const { generateEmailOpenId } = await import("./_core/passwordAuth");
      
      const openId1 = generateEmailOpenId("user1@example.com");
      const openId2 = generateEmailOpenId("user2@example.com");
      
      expect(openId1).not.toBe(openId2);
    });
  });

  describe("Token expiry", () => {
    it("should generate expiry date in the future", async () => {
      const { getTokenExpiry } = await import("./_core/passwordAuth");
      
      const expiry = getTokenExpiry();
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
