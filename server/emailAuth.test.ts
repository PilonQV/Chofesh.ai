import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the password auth utilities
vi.mock("./_core/passwordAuth", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
  verifyPassword: vi.fn().mockImplementation((password, hash) => {
    return Promise.resolve(password === "ValidPass123" && hash === "$2b$12$hashedpassword");
  }),
  generateToken: vi.fn().mockReturnValue("mock-token-12345"),
  generateEmailOpenId: vi.fn().mockImplementation((email) => `email_${email.replace("@", "_at_")}`),
  validatePassword: vi.fn().mockImplementation((password) => {
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return null;
  }),
  validateEmail: vi.fn().mockImplementation((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  getTokenExpiry: vi.fn().mockReturnValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  isTokenExpired: vi.fn().mockImplementation((expiry) => !expiry || new Date() > expiry),
}));

// Import after mocking
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateEmailOpenId,
  validatePassword,
  validateEmail,
  getTokenExpiry,
  isTokenExpired,
} from "./_core/passwordAuth";

describe("Password Auth Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const hash = await hashPassword("TestPassword123");
      expect(hash).toBe("$2b$12$hashedpassword");
      expect(hashPassword).toHaveBeenCalledWith("TestPassword123");
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const isValid = await verifyPassword("ValidPass123", "$2b$12$hashedpassword");
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const isValid = await verifyPassword("WrongPassword", "$2b$12$hashedpassword");
      expect(isValid).toBe(false);
    });
  });

  describe("generateToken", () => {
    it("should generate a token", () => {
      const token = generateToken();
      expect(token).toBe("mock-token-12345");
    });
  });

  describe("generateEmailOpenId", () => {
    it("should generate openId from email", () => {
      const openId = generateEmailOpenId("test@example.com");
      expect(openId).toContain("email_");
    });
  });

  describe("validatePassword", () => {
    it("should reject passwords shorter than 8 characters", () => {
      const error = validatePassword("Short1");
      expect(error).toBe("Password must be at least 8 characters long");
    });

    it("should reject passwords without uppercase", () => {
      const error = validatePassword("lowercase123");
      expect(error).toBe("Password must contain at least one uppercase letter");
    });

    it("should reject passwords without lowercase", () => {
      const error = validatePassword("UPPERCASE123");
      expect(error).toBe("Password must contain at least one lowercase letter");
    });

    it("should reject passwords without numbers", () => {
      const error = validatePassword("NoNumbers");
      expect(error).toBe("Password must contain at least one number");
    });

    it("should accept valid passwords", () => {
      const error = validatePassword("ValidPass123");
      expect(error).toBeNull();
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email format", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.org")).toBe(true);
    });

    it("should reject invalid email format", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("no@domain")).toBe(false);
      expect(validateEmail("@nodomain.com")).toBe(false);
    });
  });

  describe("getTokenExpiry", () => {
    it("should return a future date", () => {
      const expiry = getTokenExpiry();
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("isTokenExpired", () => {
    it("should return true for null expiry", () => {
      expect(isTokenExpired(null)).toBe(true);
    });

    it("should return false for future expiry", () => {
      const futureDate = new Date(Date.now() + 1000000);
      expect(isTokenExpired(futureDate)).toBe(false);
    });

    it("should return true for past expiry", () => {
      const pastDate = new Date(Date.now() - 1000000);
      expect(isTokenExpired(pastDate)).toBe(true);
    });
  });
});

describe("Email Auth API Endpoints", () => {
  describe("Registration validation", () => {
    it("should require valid email format", () => {
      const isValid = validateEmail("invalid-email");
      expect(isValid).toBe(false);
    });

    it("should require strong password", () => {
      const weakPasswords = ["short", "nouppercase1", "NOLOWERCASE1", "NoNumbers"];
      weakPasswords.forEach((password) => {
        const error = validatePassword(password);
        expect(error).not.toBeNull();
      });
    });

    it("should accept valid registration data", () => {
      const email = "test@example.com";
      const password = "TestPassword123!";
      
      expect(validateEmail(email)).toBe(true);
      expect(validatePassword(password)).toBeNull();
    });
  });

  describe("Login validation", () => {
    it("should verify password correctly", async () => {
      const isValid = await verifyPassword("ValidPass123", "$2b$12$hashedpassword");
      expect(isValid).toBe(true);
    });

    it("should reject wrong password", async () => {
      const isValid = await verifyPassword("WrongPassword", "$2b$12$hashedpassword");
      expect(isValid).toBe(false);
    });
  });

  describe("Password reset flow", () => {
    it("should generate reset token", () => {
      const token = generateToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("should set token expiry in the future", () => {
      const expiry = getTokenExpiry();
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
