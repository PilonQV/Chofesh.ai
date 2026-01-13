import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
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

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "127.0.0.1",
        "user-agent": "test-agent",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});
