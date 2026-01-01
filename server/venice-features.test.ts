import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock all database functions
vi.mock("./db", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditLogs: vi.fn().mockResolvedValue([]),
  getAuditLogStats: vi.fn().mockResolvedValue({ total: 0 }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  getUserSettings: vi.fn().mockResolvedValue(null),
  upsertUserSettings: vi.fn().mockResolvedValue(undefined),
  addUserApiKey: vi.fn().mockResolvedValue(1),
  getUserApiKeys: vi.fn().mockResolvedValue([]),
  deleteUserApiKey: vi.fn().mockResolvedValue(undefined),
  toggleUserApiKey: vi.fn().mockResolvedValue(undefined),
  createUsageRecord: vi.fn().mockResolvedValue(undefined),
  getUserUsageStats: vi.fn().mockResolvedValue({ totalTokens: 0, totalCost: "0" }),
  getRecentUsageRecords: vi.fn().mockResolvedValue([]),
  createUserDocument: vi.fn().mockResolvedValue(1),
  getUserDocuments: vi.fn().mockResolvedValue([]),
  getDocumentById: vi.fn().mockResolvedValue(null),
  updateDocumentStatus: vi.fn().mockResolvedValue(undefined),
  deleteUserDocument: vi.fn().mockResolvedValue(undefined),
  createDocumentChunks: vi.fn().mockResolvedValue(undefined),
  getDocumentChunks: vi.fn().mockResolvedValue([]),
  searchDocumentChunks: vi.fn().mockResolvedValue([]),
  createCharacter: vi.fn().mockResolvedValue(1),
  getUserCharacters: vi.fn().mockResolvedValue([]),
  getPublicCharacters: vi.fn().mockResolvedValue([]),
  getCharacterById: vi.fn().mockResolvedValue(null),
  updateCharacter: vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
  incrementCharacterUsage: vi.fn().mockResolvedValue(undefined),
  createSharedLink: vi.fn().mockResolvedValue("test-share-id"),
  getSharedLinkByShareId: vi.fn().mockResolvedValue(null),
  getUserSharedLinks: vi.fn().mockResolvedValue([]),
  incrementShareLinkViews: vi.fn().mockResolvedValue(undefined),
  deactivateSharedLink: vi.fn().mockResolvedValue(undefined),
  deleteSharedLink: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test response" } }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/image.png" }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "127.0.0.1",
        "user-agent": "test-agent",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "127.0.0.1",
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AI Characters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists user characters when authenticated", async () => {
    const { getUserCharacters } = await import("./db");
    (getUserCharacters as any).mockResolvedValue([
      { id: 1, name: "Test Character", systemPrompt: "You are helpful" },
    ]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.characters.list();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Character");
    expect(getUserCharacters).toHaveBeenCalledWith(1);
  });

  it("lists public characters without authentication", async () => {
    const { getPublicCharacters } = await import("./db");
    (getPublicCharacters as any).mockResolvedValue([
      { id: 2, name: "Public Character", isPublic: true },
    ]);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.characters.listPublic();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Public Character");
  });

  it("creates a new character", async () => {
    const { createCharacter } = await import("./db");
    (createCharacter as any).mockResolvedValue(5);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.characters.create({
      name: "New Character",
      systemPrompt: "You are a creative assistant",
      description: "A helpful AI",
      isPublic: false,
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe(5);
    expect(createCharacter).toHaveBeenCalled();
  });

  it("deletes a character", async () => {
    const { deleteCharacter } = await import("./db");

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.characters.remove({ id: 1 });

    expect(result.success).toBe(true);
    expect(deleteCharacter).toHaveBeenCalledWith(1, 1);
  });
});

describe("Shared Links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a share link", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shareLinks.create({
      encryptedData: "encrypted-conversation-data",
      title: "Test Conversation",
      expiresInHours: 24,
    });

    expect(result.success).toBe(true);
    expect(result.shareId).toBeDefined();
    expect(result.shareId.length).toBe(32); // 16 bytes hex = 32 chars
  });

  it("retrieves a valid share link", async () => {
    const { getSharedLinkByShareId, incrementShareLinkViews } = await import("./db");
    (getSharedLinkByShareId as any).mockResolvedValue({
      shareId: "test-share-id",
      encryptedData: "encrypted-data",
      title: "Shared Chat",
      isActive: true,
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      viewCount: 0,
      maxViews: null,
      createdAt: new Date(),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shareLinks.get({ shareId: "test-share-id" });

    expect(result.encryptedData).toBe("encrypted-data");
    expect(result.title).toBe("Shared Chat");
    expect(incrementShareLinkViews).toHaveBeenCalledWith("test-share-id");
  });

  it("rejects expired share link", async () => {
    const { getSharedLinkByShareId } = await import("./db");
    (getSharedLinkByShareId as any).mockResolvedValue({
      shareId: "expired-link",
      encryptedData: "data",
      isActive: true,
      expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      viewCount: 0,
      maxViews: null,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.shareLinks.get({ shareId: "expired-link" }))
      .rejects.toThrow("This link has expired");
  });

  it("rejects deactivated share link", async () => {
    const { getSharedLinkByShareId } = await import("./db");
    (getSharedLinkByShareId as any).mockResolvedValue({
      shareId: "inactive-link",
      encryptedData: "data",
      isActive: false,
      expiresAt: null,
      viewCount: 0,
      maxViews: null,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.shareLinks.get({ shareId: "inactive-link" }))
      .rejects.toThrow("This link has been deactivated");
  });

  it("rejects share link that exceeded max views", async () => {
    const { getSharedLinkByShareId } = await import("./db");
    (getSharedLinkByShareId as any).mockResolvedValue({
      shareId: "maxed-link",
      encryptedData: "data",
      isActive: true,
      expiresAt: null,
      viewCount: 10,
      maxViews: 10,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.shareLinks.get({ shareId: "maxed-link" }))
      .rejects.toThrow("This link has reached its view limit");
  });

  it("deactivates a share link", async () => {
    const { deactivateSharedLink } = await import("./db");

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shareLinks.deactivate({ shareId: "my-link" });

    expect(result.success).toBe(true);
    expect(deactivateSharedLink).toHaveBeenCalledWith("my-link", 1);
  });
});

describe("Model Router", () => {
  it("lists available text models", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const models = await caller.models.listText();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("name");
    expect(models[0]).toHaveProperty("tier");
  });

  it("lists available image models", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const models = await caller.models.listImage();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });
});

describe("Templates", () => {
  it("lists all templates", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const templates = await caller.templates.list();

    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty("id");
    expect(templates[0]).toHaveProperty("name");
    expect(templates[0]).toHaveProperty("category");
  });

  it("gets a specific template by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const templates = await caller.templates.list();
    
    if (templates.length > 0) {
      const template = await caller.templates.get({ id: templates[0].id });
      expect(template).toBeDefined();
      expect(template.id).toBe(templates[0].id);
    }
  });

  it("filters templates by category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const templates = await caller.templates.list({ category: "writing" });

    expect(Array.isArray(templates)).toBe(true);
    templates.forEach(t => {
      expect(t.category).toBe("writing");
    });
  });
});

describe("Cache Operations", () => {
  it("clears user cache", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.cache.clear();

    expect(result.success).toBe(true);
  });
});
