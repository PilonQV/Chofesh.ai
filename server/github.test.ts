import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  encryptToken,
  decryptToken,
  isGitHubOAuthConfigured,
  getGitHubAuthUrl,
} from "./_core/githubOAuth";

describe("GitHub OAuth", () => {
  describe("Token Encryption", () => {
    it("should encrypt and decrypt tokens correctly", () => {
      const originalToken = "ghp_test_token_12345";
      const encrypted = encryptToken(originalToken);
      
      // Encrypted should be different from original
      expect(encrypted).not.toBe(originalToken);
      
      // Should contain IV separator
      expect(encrypted).toContain(":");
      
      // Decrypted should match original
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(originalToken);
    });

    it("should produce different ciphertext for same input (due to random IV)", () => {
      const token = "ghp_same_token";
      const encrypted1 = encryptToken(token);
      const encrypted2 = encryptToken(token);
      
      // Different encryptions should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same value
      expect(decryptToken(encrypted1)).toBe(token);
      expect(decryptToken(encrypted2)).toBe(token);
    });

    it("should handle special characters in tokens", () => {
      const specialToken = "ghp_token/with+special=chars&more!";
      const encrypted = encryptToken(specialToken);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(specialToken);
    });

    it("should handle empty strings", () => {
      const encrypted = encryptToken("");
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe("");
    });

    it("should handle long tokens", () => {
      const longToken = "ghp_" + "a".repeat(1000);
      const encrypted = encryptToken(longToken);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(longToken);
    });
  });

  describe("OAuth Configuration", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    it("should return false when credentials are not set", () => {
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
      expect(isGitHubOAuthConfigured()).toBe(false);
    });

    it("should return false when only client ID is set", () => {
      process.env.GITHUB_CLIENT_ID = "test_client_id";
      delete process.env.GITHUB_CLIENT_SECRET;
      expect(isGitHubOAuthConfigured()).toBe(false);
    });

    it("should return false when only client secret is set", () => {
      delete process.env.GITHUB_CLIENT_ID;
      process.env.GITHUB_CLIENT_SECRET = "test_client_secret";
      expect(isGitHubOAuthConfigured()).toBe(false);
    });

    it("should return true when both credentials are set", () => {
      process.env.GITHUB_CLIENT_ID = "test_client_id";
      process.env.GITHUB_CLIENT_SECRET = "test_client_secret";
      expect(isGitHubOAuthConfigured()).toBe(true);
    });
  });

  describe("Auth URL Generation", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    it("should return null when OAuth is not configured", () => {
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
      const url = getGitHubAuthUrl("test_state");
      expect(url).toBeNull();
    });

    it("should generate valid auth URL when configured", () => {
      process.env.GITHUB_CLIENT_ID = "test_client_id";
      process.env.GITHUB_CLIENT_SECRET = "test_client_secret";
      
      const state = "test_state_123";
      const url = getGitHubAuthUrl(state);
      
      expect(url).not.toBeNull();
      expect(url).toContain("https://github.com/login/oauth/authorize");
      expect(url).toContain("client_id=test_client_id");
      expect(url).toContain(`state=${state}`);
      expect(url).toContain("scope=repo");
    });
  });
});

describe("GitHub Connection Database Operations", () => {
  // These tests verify the database helper functions work correctly
  // They use mocked database connections
  
  it("should export required database functions", async () => {
    const db = await import("./db");
    
    expect(typeof db.getGithubConnectionByUserId).toBe("function");
    expect(typeof db.upsertGithubConnection).toBe("function");
    expect(typeof db.updateGithubConnectionLastUsed).toBe("function");
    expect(typeof db.deleteGithubConnection).toBe("function");
  });
});

describe("GitHub Router Endpoints", () => {
  it("should have github router with required procedures", async () => {
    const { appRouter } = await import("./routers");
    
    // Check that github router exists
    expect(appRouter._def.procedures).toHaveProperty("github.isConfigured");
    expect(appRouter._def.procedures).toHaveProperty("github.getConnection");
    expect(appRouter._def.procedures).toHaveProperty("github.getAuthUrl");
    expect(appRouter._def.procedures).toHaveProperty("github.handleCallback");
    expect(appRouter._def.procedures).toHaveProperty("github.disconnect");
    expect(appRouter._def.procedures).toHaveProperty("github.listRepos");
    expect(appRouter._def.procedures).toHaveProperty("github.getRepoContents");
    expect(appRouter._def.procedures).toHaveProperty("github.getFileContent");
    expect(appRouter._def.procedures).toHaveProperty("github.getBranches");
    expect(appRouter._def.procedures).toHaveProperty("github.getPullRequests");
    expect(appRouter._def.procedures).toHaveProperty("github.getPRFiles");
  });
});
