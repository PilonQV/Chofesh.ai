import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ freeCredits: 30, purchasedCredits: 100, freeCreditsLastRefresh: new Date() }]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
  getAuditLogStats: vi.fn().mockResolvedValue({
    total: 100,
    last24h: 10,
    last7d: 50,
    byActionType: { chat: 60, image_generation: 30, login: 10 },
  }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  getUserSettings: vi.fn().mockResolvedValue(null),
  upsertUserSettings: vi.fn().mockResolvedValue(undefined),
  // BYOK functions
  addUserApiKey: vi.fn().mockResolvedValue(undefined),
  getUserApiKeys: vi.fn().mockResolvedValue([]),
  deleteUserApiKey: vi.fn().mockResolvedValue(undefined),
  toggleUserApiKey: vi.fn().mockResolvedValue(undefined),
  // Usage tracking functions
  createUsageRecord: vi.fn().mockResolvedValue(undefined),
  getUserUsageStats: vi.fn().mockResolvedValue({
    totalTokens: 1000,
    totalRequests: 50,
    totalCost: 0.15,
    byType: { chat: { count: 40, tokens: 800 }, image_generation: { count: 10, tokens: 0 } },
    byDay: [],
  }),
  getRecentUsageRecords: vi.fn().mockResolvedValue([]),
  // Document functions
  createUserDocument: vi.fn().mockResolvedValue(1),
  getUserDocuments: vi.fn().mockResolvedValue([]),
  getDocumentById: vi.fn().mockResolvedValue(null),
  updateDocumentStatus: vi.fn().mockResolvedValue(undefined),
  deleteUserDocument: vi.fn().mockResolvedValue(undefined),
  createDocumentChunks: vi.fn().mockResolvedValue(undefined),
  getDocumentChunks: vi.fn().mockResolvedValue([]),
  searchDocumentChunks: vi.fn().mockResolvedValue([]),
  // Subscription and usage limit functions
  getDailyQueryCount: vi.fn().mockResolvedValue(0),
  incrementDailyQueries: vi.fn().mockResolvedValue(undefined),
  getUserSubscription: vi.fn().mockResolvedValue({ tier: 'free', dailyLimit: 20 }),
  updateUserSubscription: vi.fn().mockResolvedValue(undefined),
  // Memory functions
  getMemoryEnabled: vi.fn().mockResolvedValue(false),
  getActiveMemoriesForContext: vi.fn().mockResolvedValue([]),
  createMemory: vi.fn().mockResolvedValue(1),
  getUserMemories: vi.fn().mockResolvedValue([]),
  updateMemory: vi.fn().mockResolvedValue(undefined),
  deleteMemory: vi.fn().mockResolvedValue(undefined),
  // Preferences functions
  getUserPreferences: vi.fn().mockResolvedValue({ memoryEnabled: true, showThinking: false }),
  updateUserPreferences: vi.fn().mockResolvedValue(undefined),
  // Artifacts functions
  createArtifact: vi.fn().mockResolvedValue(1),
  getUserArtifacts: vi.fn().mockResolvedValue([]),
  getArtifactById: vi.fn().mockResolvedValue(null),
  updateArtifact: vi.fn().mockResolvedValue(undefined),
  deleteArtifact: vi.fn().mockResolvedValue(undefined),
  createArtifactVersion: vi.fn().mockResolvedValue(1),
  getArtifactVersionHistory: vi.fn().mockResolvedValue([]),
  // Generated images functions
  createGeneratedImage: vi.fn().mockResolvedValue(1),
  getUserGeneratedImages: vi.fn().mockResolvedValue([]),
  getAllGeneratedImages: vi.fn().mockResolvedValue({ images: [], total: 0 }),
  getGeneratedImageStats: vi.fn().mockResolvedValue({ total: 0, last24h: 0, last7d: 0, byModel: {} }),
  getGeneratedImageById: vi.fn().mockResolvedValue(null),
  deleteGeneratedImage: vi.fn().mockResolvedValue(undefined),
  // Audit logging functions
  logApiCall: vi.fn().mockResolvedValue(1),
  getApiCallLogs: vi.fn().mockResolvedValue([]),
  getApiCallLogsByUser: vi.fn().mockResolvedValue([]),
  getApiCallStats: vi.fn().mockResolvedValue({ totalCalls: 0, callsByType: {}, callsByUser: [] }),
  logImageAccess: vi.fn().mockResolvedValue(1),
  getImageAccessLogs: vi.fn().mockResolvedValue([]),
  getImageAccessLogsByUser: vi.fn().mockResolvedValue([]),
  getAuditSetting: vi.fn().mockResolvedValue("90"),
  setAuditSetting: vi.fn().mockResolvedValue(undefined),
  deleteOldApiCallLogs: vi.fn().mockResolvedValue(0),
  deleteOldImageAccessLogs: vi.fn().mockResolvedValue(0),
  deleteUserAuditLogs: vi.fn().mockResolvedValue({ apiCallLogsDeleted: 0, imageAccessLogsDeleted: 0 }),
}));

// Mock LLM and image generation
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test response" } }],
  }),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://example.com/image.png",
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Test Browser",
      },
      socket: { remoteAddress: "127.0.0.1" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("models router", () => {
  it("returns list of text models", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const models = await caller.models.listText();

    expect(models).toBeInstanceOf(Array);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("name");
  });

  it("returns list of image models", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const models = await caller.models.listImage();

    expect(models).toBeInstanceOf(Array);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("name");
  });
});

describe("chat router", () => {
  it("requires authentication for chat.send", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.chat.send({
        messages: [{ role: "user", content: "Hello" }],
      })
    ).rejects.toThrow();
  });

  it("sends chat message when authenticated", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result).toHaveProperty("content");
    // Content should be a non-empty string (actual response from LLM)
    expect(typeof result.content).toBe("string");
    expect((result.content as string).length).toBeGreaterThan(0);
  });
});

describe("image router", () => {
  it("requires authentication for image.generate", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.image.generate({
        prompt: "A beautiful sunset",
      })
    ).rejects.toThrow();
  });

  it("generates image when authenticated", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.image.generate({
      prompt: "A beautiful sunset",
    });

    expect(result).toHaveProperty("url");
    expect(result.url).toBe("https://example.com/image.png");
  });
});

describe("admin router", () => {
  it("denies access to non-admin users for auditLogs", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.auditLogs()).rejects.toThrow("Admin access required");
  });

  it("allows admin access to auditLogs", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.auditLogs();

    expect(result).toHaveProperty("logs");
    expect(result).toHaveProperty("total");
  });

  it("allows admin access to auditStats", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.auditStats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("last24h");
    expect(result).toHaveProperty("last7d");
    expect(result).toHaveProperty("byActionType");
  });

  it("allows admin to view users", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.users();

    expect(result).toBeInstanceOf(Array);
  });

  it("denies non-admin access to users list", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.users()).rejects.toThrow("Admin access required");
  });
});

describe("settings router", () => {
  it("requires authentication for settings.get", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.settings.get()).rejects.toThrow();
  });

  it("returns default settings when none exist", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.get();

    expect(result).toHaveProperty("preferredModel");
    expect(result).toHaveProperty("theme");
  });

  it("updates settings when authenticated", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.update({
      theme: "dark",
    });

    expect(result).toEqual({ success: true });
  });
});
