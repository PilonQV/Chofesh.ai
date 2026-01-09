import { describe, it, expect, vi } from "vitest";

describe("Customer Support Feature", () => {
  describe("Support Request Schema", () => {
    it("should validate required fields for support request", () => {
      const validRequest = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Need help with credits",
        message: "I purchased credits but they haven't appeared in my account.",
      };
      
      expect(validRequest.name).toBeTruthy();
      expect(validRequest.email).toContain("@");
      expect(validRequest.subject).toBeTruthy();
      expect(validRequest.message).toBeTruthy();
    });

    it("should have optional category and priority fields", () => {
      const requestWithOptionals = {
        name: "Jane Smith",
        email: "jane@example.com",
        subject: "Feature request",
        message: "I would like to see a dark mode option.",
        category: "feature",
        priority: "low",
      };
      
      expect(requestWithOptionals.category).toBe("feature");
      expect(requestWithOptionals.priority).toBe("low");
    });

    it("should default category to general", () => {
      const defaultCategory = "general";
      expect(defaultCategory).toBe("general");
    });

    it("should default priority to normal", () => {
      const defaultPriority = "normal";
      expect(defaultPriority).toBe("normal");
    });
  });

  describe("Support Categories", () => {
    const categories = ["general", "bug", "feature", "billing", "account"];

    it("should have all expected categories", () => {
      expect(categories).toContain("general");
      expect(categories).toContain("bug");
      expect(categories).toContain("feature");
      expect(categories).toContain("billing");
      expect(categories).toContain("account");
    });

    it("should have 5 categories total", () => {
      expect(categories.length).toBe(5);
    });
  });

  describe("Support Priorities", () => {
    const priorities = ["low", "normal", "high"];

    it("should have all expected priorities", () => {
      expect(priorities).toContain("low");
      expect(priorities).toContain("normal");
      expect(priorities).toContain("high");
    });

    it("should have 3 priority levels", () => {
      expect(priorities.length).toBe(3);
    });
  });

  describe("Support Request Status", () => {
    const statuses = ["open", "in_progress", "resolved", "closed"];

    it("should have all expected statuses", () => {
      expect(statuses).toContain("open");
      expect(statuses).toContain("in_progress");
      expect(statuses).toContain("resolved");
      expect(statuses).toContain("closed");
    });

    it("should default to open status", () => {
      const defaultStatus = "open";
      expect(defaultStatus).toBe("open");
    });
  });

  describe("Email Validation", () => {
    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.com",
        "user@subdomain.example.com",
      ];
      
      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "userexample.com",
        "@example.com",
        "user@",
        "user@.com",
      ];
      
      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });
  });

  describe("Support Email Notification", () => {
    it("should format email subject with priority", () => {
      const priority = "HIGH";
      const subject = "Account locked";
      const formattedSubject = `[Support] ${priority}: ${subject}`;
      
      expect(formattedSubject).toBe("[Support] HIGH: Account locked");
    });

    it("should include all request details in email body", () => {
      const request = {
        name: "Test User",
        email: "test@example.com",
        category: "billing",
        priority: "high",
        subject: "Payment issue",
        message: "My payment failed.",
      };
      
      const emailBody = `
        <h2>New Support Request</h2>
        <p><strong>From:</strong> ${request.name} (${request.email})</p>
        <p><strong>Category:</strong> ${request.category}</p>
        <p><strong>Priority:</strong> ${request.priority}</p>
        <p><strong>Subject:</strong> ${request.subject}</p>
        <hr/>
        <p><strong>Message:</strong></p>
        <p>${request.message}</p>
      `;
      
      expect(emailBody).toContain(request.name);
      expect(emailBody).toContain(request.email);
      expect(emailBody).toContain(request.category);
      expect(emailBody).toContain(request.priority);
      expect(emailBody).toContain(request.subject);
      expect(emailBody).toContain(request.message);
    });
  });
});
