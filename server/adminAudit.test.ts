import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database functions
vi.mock("./db", () => ({
  getApiCallLogs: vi.fn(),
  getApiCallLogsByUser: vi.fn(),
  getApiCallStats: vi.fn(),
  getImageAccessLogs: vi.fn(),
  getImageAccessLogsByUser: vi.fn(),
  getAuditSetting: vi.fn(),
  setAuditSetting: vi.fn(),
  deleteOldApiCallLogs: vi.fn(),
  deleteOldImageAccessLogs: vi.fn(),
  deleteUserAuditLogs: vi.fn(),
}));

import {
  getApiCallLogs,
  getApiCallLogsByUser,
  getApiCallStats,
  getImageAccessLogs,
  getImageAccessLogsByUser,
  getAuditSetting,
  setAuditSetting,
  deleteOldApiCallLogs,
  deleteOldImageAccessLogs,
  deleteUserAuditLogs,
} from "./db";

describe("Admin Audit Logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API Call Logs", () => {
    it("should retrieve API call logs with filters", async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 1,
          userEmail: "test@example.com",
          actionType: "chat",
          prompt: "Hello, how are you?",
          response: "I'm doing well, thank you!",
          modelUsed: "gemini-2.5-flash",
          tokensInput: 10,
          tokensOutput: 20,
          durationMs: 500,
          status: "success",
          createdAt: new Date(),
        },
      ];
      
      vi.mocked(getApiCallLogs).mockResolvedValue(mockLogs);
      
      const result = await getApiCallLogs({
        userId: 1,
        actionType: "chat",
        limit: 100,
        offset: 0,
      });
      
      expect(result).toEqual(mockLogs);
      expect(getApiCallLogs).toHaveBeenCalledWith({
        userId: 1,
        actionType: "chat",
        limit: 100,
        offset: 0,
      });
    });

    it("should retrieve API call logs by user ID", async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 5,
          prompt: "Test prompt",
          response: "Test response",
          modelUsed: "gpt-4",
        },
      ];
      
      vi.mocked(getApiCallLogsByUser).mockResolvedValue(mockLogs);
      
      const result = await getApiCallLogsByUser(5, 50);
      
      expect(result).toEqual(mockLogs);
      expect(getApiCallLogsByUser).toHaveBeenCalledWith(5, 50);
    });

    it("should get API call statistics", async () => {
      const mockStats = {
        totalCalls: 1000,
        uniqueUsers: 50,
        avgDurationMs: 450,
        callsByModel: {
          "gemini-2.5-flash": 600,
          "gpt-4": 300,
          "claude-3": 100,
        },
      };
      
      vi.mocked(getApiCallStats).mockResolvedValue(mockStats);
      
      const result = await getApiCallStats();
      
      expect(result).toEqual(mockStats);
    });
  });

  describe("Image Access Logs", () => {
    it("should retrieve image access logs with filters", async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 1,
          userEmail: "test@example.com",
          imageUrl: "https://storage.example.com/image.png",
          prompt: "A beautiful sunset",
          actionType: "generate",
          createdAt: new Date(),
        },
      ];
      
      vi.mocked(getImageAccessLogs).mockResolvedValue(mockLogs);
      
      const result = await getImageAccessLogs({
        userId: 1,
        actionType: "generate",
        limit: 100,
        offset: 0,
      });
      
      expect(result).toEqual(mockLogs);
    });

    it("should retrieve image access logs by user ID", async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 3,
          imageUrl: "https://storage.example.com/image2.png",
          prompt: "A mountain landscape",
          actionType: "generate",
        },
      ];
      
      vi.mocked(getImageAccessLogsByUser).mockResolvedValue(mockLogs);
      
      const result = await getImageAccessLogsByUser(3, 50);
      
      expect(result).toEqual(mockLogs);
    });
  });

  describe("Retention Settings", () => {
    it("should get retention days setting", async () => {
      vi.mocked(getAuditSetting).mockResolvedValue("90");
      
      const result = await getAuditSetting("retention_days");
      
      expect(result).toBe("90");
    });

    it("should set retention days setting", async () => {
      vi.mocked(setAuditSetting).mockResolvedValue(undefined);
      
      await setAuditSetting("retention_days", "60");
      
      expect(setAuditSetting).toHaveBeenCalledWith("retention_days", "60");
    });

    it("should return null for unset setting", async () => {
      vi.mocked(getAuditSetting).mockResolvedValue(null);
      
      const result = await getAuditSetting("nonexistent_setting");
      
      expect(result).toBeNull();
    });
  });

  describe("Cleanup Operations", () => {
    it("should delete old API call logs", async () => {
      vi.mocked(deleteOldApiCallLogs).mockResolvedValue(150);
      
      const result = await deleteOldApiCallLogs(30);
      
      expect(result).toBe(150);
      expect(deleteOldApiCallLogs).toHaveBeenCalledWith(30);
    });

    it("should delete old image access logs", async () => {
      vi.mocked(deleteOldImageAccessLogs).mockResolvedValue(75);
      
      const result = await deleteOldImageAccessLogs(30);
      
      expect(result).toBe(75);
      expect(deleteOldImageAccessLogs).toHaveBeenCalledWith(30);
    });

    it("should delete all audit logs for a specific user", async () => {
      const mockResult = {
        apiCallLogsDeleted: 25,
        imageAccessLogsDeleted: 10,
      };
      
      vi.mocked(deleteUserAuditLogs).mockResolvedValue(mockResult);
      
      const result = await deleteUserAuditLogs(5);
      
      expect(result).toEqual(mockResult);
      expect(deleteUserAuditLogs).toHaveBeenCalledWith(5);
    });
  });

  describe("Audit Log Content", () => {
    it("should store prompts and responses in readable plain text", async () => {
      const mockLog = {
        id: 1,
        userId: 1,
        prompt: "What is the capital of France?",
        response: "The capital of France is Paris.",
        modelUsed: "gemini-2.5-flash",
      };
      
      vi.mocked(getApiCallLogsByUser).mockResolvedValue([mockLog]);
      
      const result = await getApiCallLogsByUser(1, 1);
      
      // Verify content is plain text, not encoded/encrypted
      expect(result[0].prompt).toBe("What is the capital of France?");
      expect(result[0].response).toBe("The capital of France is Paris.");
      expect(typeof result[0].prompt).toBe("string");
      expect(typeof result[0].response).toBe("string");
    });

    it("should include user context in logs", async () => {
      const mockLog = {
        id: 1,
        userId: 1,
        userEmail: "user@example.com",
        userName: "Test User",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        prompt: "Test prompt",
        response: "Test response",
      };
      
      vi.mocked(getApiCallLogsByUser).mockResolvedValue([mockLog]);
      
      const result = await getApiCallLogsByUser(1, 1);
      
      expect(result[0].userEmail).toBe("user@example.com");
      expect(result[0].userName).toBe("Test User");
      expect(result[0].ipAddress).toBe("192.168.1.1");
      expect(result[0].userAgent).toBe("Mozilla/5.0");
    });
  });
});
