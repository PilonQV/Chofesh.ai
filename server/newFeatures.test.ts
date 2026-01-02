import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
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
  getDocumentById: vi.fn().mockResolvedValue({
    id: 1,
    filename: "test.pdf",
    mimeType: "application/pdf",
    storageUrl: "https://example.com/test.pdf",
  }),
  updateDocumentStatus: vi.fn().mockResolvedValue(undefined),
  deleteUserDocument: vi.fn().mockResolvedValue(undefined),
  createDocumentChunks: vi.fn().mockResolvedValue(undefined),
  getDocumentChunks: vi.fn().mockResolvedValue([]),
  searchDocumentChunks: vi.fn().mockResolvedValue([{ content: "test content" }]),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://example.com/test.pdf" }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test response from AI" } }],
  }),
}));

// Mock image generation
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/edited-image.png" }),
}));

// Mock voice transcription
vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    text: "Hello, this is a test transcription",
    language: "en",
    duration: 5.5,
    segments: [],
  }),
}));

// Mock data API for web search
vi.mock("./_core/dataApi", () => ({
  callDataApi: vi.fn().mockResolvedValue({
    web: {
      results: [
        { title: "Test Result 1", url: "https://example.com/1", description: "Description 1" },
        { title: "Test Result 2", url: "https://example.com/2", description: "Description 2" },
      ],
    },
  }),
}));

// Mock notifications
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
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

function createAdminContext(): TrpcContext {
  const ctx = createAuthContext();
  ctx.user = {
    ...ctx.user!,
    role: "admin",
  };
  return ctx;
}

describe("Web Search API", () => {
  it("performs web search and returns results", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.webSearch.search({
      query: "test query",
      limit: 5,
    });

    expect(result.query).toBe("test query");
    // DuckDuckGo may return 0 or more results depending on query
    expect(Array.isArray(result.results)).toBe(true);
  });
});

describe("Voice Transcription API", () => {
  it("transcribes audio from URL", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voice.transcribe({
      audioUrl: "https://example.com/audio.mp3",
      language: "en",
    });

    expect(result.text).toBe("Hello, this is a test transcription");
    expect(result.language).toBe("en");
    expect(result.duration).toBe(5.5);
  });
});

describe("Owner Notifications API", () => {
  it("sends milestone notification (admin only)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.notifyMilestone({
      milestone: "100 Users",
      details: "We reached 100 registered users!",
    });

    expect(result.success).toBe(true);
  });

  it("sends error notification", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.notifyError({
      errorType: "API Error",
      errorMessage: "Something went wrong",
      context: "During image generation",
    });

    expect(result.success).toBe(true);
  });
});

describe("Image Edit API", () => {
  it("edits an existing image with a prompt", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.imageEdit.edit({
      prompt: "Add a rainbow to the sky",
      originalImageUrl: "https://example.com/original.png",
      originalImageMimeType: "image/png",
    });

    expect(result.url).toBe("https://example.com/edited-image.png");
    expect(result.model).toBe("flux-edit");
  });
});

describe("PDF Document Upload", () => {
  it("uploads a PDF document with base64 content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a simple base64 encoded "PDF" (just for testing)
    const base64Content = Buffer.from("test pdf content").toString("base64");

    const result = await caller.documents.upload({
      filename: "test.pdf",
      mimeType: "application/pdf",
      content: base64Content,
      isBase64: true,
    });

    expect(result.id).toBe(1);
    expect(result.isPdf).toBe(true);
  });
});
