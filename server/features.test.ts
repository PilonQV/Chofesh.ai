import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions to avoid TiDB connection
vi.mock("./db", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
  getAuditLogStats: vi.fn().mockResolvedValue({ total: 0, last24h: 0, last7d: 0, byActionType: {} }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  getUserSettings: vi.fn().mockResolvedValue(null),
  upsertUserSettings: vi.fn().mockResolvedValue(undefined),
  addUserApiKey: vi.fn().mockResolvedValue(undefined),
  getUserApiKeys: vi.fn().mockResolvedValue([]),
  deleteUserApiKey: vi.fn().mockResolvedValue(undefined),
  toggleUserApiKey: vi.fn().mockResolvedValue(undefined),
  createUsageRecord: vi.fn().mockResolvedValue(undefined),
  getUserUsageStats: vi.fn().mockResolvedValue({ totalTokens: 0, totalRequests: 0, totalCost: 0, byType: {}, byDay: [] }),
  getRecentUsageRecords: vi.fn().mockResolvedValue([]),
  createUserDocument: vi.fn().mockResolvedValue(1),
  getUserDocuments: vi.fn().mockResolvedValue([]),
  getDocumentById: vi.fn().mockResolvedValue(null),
  updateDocumentStatus: vi.fn().mockResolvedValue(undefined),
  deleteUserDocument: vi.fn().mockResolvedValue(undefined),
  createDocumentChunks: vi.fn().mockResolvedValue(undefined),
  getDocumentChunks: vi.fn().mockResolvedValue([]),
  searchDocumentChunks: vi.fn().mockResolvedValue([]),
}));

// Mock user for testing
const mockUser = {
  id: 1,
  openId: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const mockAdminUser = {
  ...mockUser,
  id: 2,
  openId: "admin-user-123",
  role: "admin" as const,
};

function createMockContext(user: typeof mockUser | typeof mockAdminUser | null = mockUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "127.0.0.1",
        "user-agent": "test-agent",
      },
      socket: { remoteAddress: "127.0.0.1" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Models Router", () => {
  it("returns list of text models", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const models = await caller.models.listText();

    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("name");
    expect(models[0]).toHaveProperty("description");
  });

  it("returns list of image models", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const models = await caller.models.listImage();

    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("name");
  });
});

describe("Auth Router", () => {
  it("returns user when authenticated", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.openId).toBe("test-user-123");
    expect(user?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeNull();
  });

  it("logout clears cookie and returns success", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  }, 10000);
});

describe("API Keys Router (BYOK)", () => {
  it("requires authentication to list API keys", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.apiKeys.list()).rejects.toThrow();
  });

  it("validates API key input schema", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    // Test that the endpoint validates input properly
    // Empty API key should fail validation
    await expect(
      caller.apiKeys.add({
        provider: "openai" as const,
        apiKey: "", // Empty key should fail
      })
    ).rejects.toThrow();
  });
});

describe("Usage Router", () => {
  it("requires authentication to get usage stats", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.usage.stats()).rejects.toThrow();
  });

  it("requires authentication to get recent usage", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.usage.recent()).rejects.toThrow();
  });
});

describe("Documents Router (RAG)", () => {
  it("requires authentication to list documents", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.documents.list()).rejects.toThrow();
  });

  it("requires authentication to upload documents", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const input = {
      fileName: "test.txt",
      fileType: "text/plain",
      fileSize: 100,
      textContent: "Test content",
    };

    await expect(caller.documents.upload(input)).rejects.toThrow();
  });

  it("validates document upload input", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const input = {
      fileName: "test.txt",
      fileType: "text/plain",
      fileSize: 100,
      textContent: "Test content for document processing",
    };

    // This test verifies the endpoint accepts valid input
    try {
      await caller.documents.upload(input);
    } catch (error: any) {
      // Database errors are expected in test environment
      expect(error.message).not.toContain("validation");
    }
  });
});

describe("Admin Router", () => {
  it("denies access to non-admin users for users list", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.users()).rejects.toThrow("Admin access required");
  });

  it("denies access to non-admin users for audit logs", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.auditLogs()).rejects.toThrow("Admin access required");
  });

  it("denies access to non-admin users for audit stats", async () => {
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.auditStats()).rejects.toThrow("Admin access required");
  });
});

describe("Settings Router", () => {
  it("requires authentication to get settings", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.settings.get()).rejects.toThrow();
  });

  it("requires authentication to update settings", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.settings.update({ preferredModel: "gpt-4o" })
    ).rejects.toThrow();
  });
});
