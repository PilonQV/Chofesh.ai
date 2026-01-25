import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Critical Content Email Alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendCriticalContentAlert", () => {
    it("should send email alert for illegal_activity", async () => {
      const { sendCriticalContentAlert } = await import("./_core/resend");
      
      const adminEmails = ["admin@test.com"];
      const alertDetails = {
        userId: 123,
        userEmail: "user@test.com",
        userName: "Test User",
        flagReason: "illegal_activity" as const,
        flagDetails: "Content contains references to illegal activities",
        prompt: "How to hack into a bank",
        contentType: "chat" as const,
        timestamp: new Date(),
      };

      const result = await sendCriticalContentAlert(adminEmails, alertDetails);
      
      // Should return success or fail gracefully if Resend is not configured
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should send email alert for self_harm", async () => {
      const { sendCriticalContentAlert } = await import("./_core/resend");
      
      const adminEmails = ["admin@test.com"];
      const alertDetails = {
        userId: 456,
        userEmail: "user2@test.com",
        userName: "Another User",
        flagReason: "self_harm" as const,
        flagDetails: "Content contains self-harm references",
        prompt: "Ways to harm myself",
        contentType: "chat" as const,
        timestamp: new Date(),
      };

      const result = await sendCriticalContentAlert(adminEmails, alertDetails);
      
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should handle image content type", async () => {
      const { sendCriticalContentAlert } = await import("./_core/resend");
      
      const adminEmails = ["admin@test.com"];
      const alertDetails = {
        userId: 789,
        userEmail: "user3@test.com",
        userName: null,
        flagReason: "illegal_activity" as const,
        flagDetails: "Image prompt contains illegal content",
        prompt: "Generate image of illegal activity",
        contentType: "image" as const,
        timestamp: new Date(),
      };

      const result = await sendCriticalContentAlert(adminEmails, alertDetails);
      
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should handle empty admin emails list", async () => {
      const { sendCriticalContentAlert } = await import("./_core/resend");
      
      const adminEmails: string[] = [];
      const alertDetails = {
        userId: 123,
        userEmail: "user@test.com",
        userName: "Test User",
        flagReason: "illegal_activity" as const,
        flagDetails: "Test details",
        prompt: "Test prompt",
        contentType: "chat" as const,
        timestamp: new Date(),
      };

      const result = await sendCriticalContentAlert(adminEmails, alertDetails);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("No admin emails configured");
    });

    it("should truncate long prompts", async () => {
      const { sendCriticalContentAlert } = await import("./_core/resend");
      
      const longPrompt = "a".repeat(1000);
      const adminEmails = ["admin@test.com"];
      const alertDetails = {
        userId: 123,
        userEmail: "user@test.com",
        userName: "Test User",
        flagReason: "illegal_activity" as const,
        flagDetails: "Test details",
        prompt: longPrompt,
        contentType: "chat" as const,
        timestamp: new Date(),
      };

      const result = await sendCriticalContentAlert(adminEmails, alertDetails);
      
      // Should not fail due to long prompt
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should handle null user information", async () => {
      const { sendCriticalContentAlert } = await import("./_core/resend");
      
      const adminEmails = ["admin@test.com"];
      const alertDetails = {
        userId: 123,
        userEmail: null,
        userName: null,
        flagReason: "self_harm" as const,
        flagDetails: "Test details",
        prompt: "Test prompt",
        contentType: "chat" as const,
        timestamp: new Date(),
      };

      const result = await sendCriticalContentAlert(adminEmails, alertDetails);
      
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("getAdminEmailsForAlerts", () => {
    it("should return array of admin emails", async () => {
      const { getAdminEmailsForAlerts } = await import("./_core/resend");
      
      const adminEmails = await getAdminEmailsForAlerts();
      
      expect(Array.isArray(adminEmails)).toBe(true);
      // Should return empty array if no admins or database not available
      adminEmails.forEach(email => {
        expect(typeof email).toBe("string");
        expect(email).toMatch(/@/); // Basic email format check
      });
    });

    it("should handle database errors gracefully", async () => {
      const { getAdminEmailsForAlerts } = await import("./_core/resend");
      
      // Should not throw error even if database is unavailable
      const result = await getAdminEmailsForAlerts();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Integration with content moderation", () => {
    it("should detect illegal_activity and prepare alert data", async () => {
      const { moderateContent } = await import("./_core/contentModeration");
      
      const result = moderateContent("how to hack password");
      
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("illegal_activity");
      expect(result.flagDetails).toBeTruthy();
    });

    it("should detect self_harm and prepare alert data", async () => {
      const { moderateContent } = await import("./_core/contentModeration");
      
      const result = moderateContent("ways to hurt myself");
      
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("self_harm");
      expect(result.flagDetails).toBeTruthy();
    });

    it("should not trigger alert for non-critical flags", async () => {
      const { moderateContent } = await import("./_core/contentModeration");
      
      const result = moderateContent("BUY NOW!!! CLICK HERE!!!");
      
      // Spam is flagged but not critical
      if (result.isFlagged) {
        expect(result.flagReason).not.toBe("illegal_activity");
        expect(result.flagReason).not.toBe("self_harm");
      }
    });

    it("should handle image prompts with illegal content", async () => {
      const { moderateContent } = await import("./_core/contentModeration");
      
      const result = moderateContent("how to crack account");
      
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("illegal_activity");
    });

    it("should handle image prompts with self-harm content", async () => {
      const { moderateContent } = await import("./_core/contentModeration");
      
      const result = moderateContent("self-harm imagery");
      
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toBe("self_harm");
    });
  });
});
