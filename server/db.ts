import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, auditLogs, InsertAuditLog, userSettings, InsertUserSettings,
  aiCharacters, InsertAiCharacter, sharedLinks, InsertSharedLink,
  userMemories, InsertUserMemory, artifacts, InsertArtifact, userPreferences, InsertUserPreference,
  userDevices, InsertUserDevice, generatedImages, InsertGeneratedImage
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
    subscriptionTier: users.subscriptionTier,
    subscriptionStatus: users.subscriptionStatus,
    dailyQueries: users.dailyQueries,
    stripeCustomerId: users.stripeCustomerId,
  }).from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============ EMAIL/PASSWORD AUTH FUNCTIONS ============

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEmailUser(data: {
  openId: string;
  email: string;
  name: string;
  passwordHash: string;
  verificationToken: string;
  verificationTokenExpiry: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(users).values({
    openId: data.openId,
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    emailVerified: false,
    verificationToken: data.verificationToken,
    verificationTokenExpiry: data.verificationTokenExpiry,
  });
  
  return await getUserByOpenId(data.openId);
}

export async function verifyUserEmail(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1);
  if (result.length === 0) return null;
  
  const user = result[0];
  if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
    return null; // Token expired
  }
  
  await db.update(users).set({
    emailVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  }).where(eq(users.id, user.id));
  
  return user;
}

export async function setPasswordResetToken(email: string, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(users).set({
    resetToken: token,
    resetTokenExpiry: expiry,
  }).where(eq(users.email, email.toLowerCase()));
  
  return result;
}

export async function resetPassword(token: string, newPasswordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  if (result.length === 0) return null;
  
  const user = result[0];
  if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
    return null; // Token expired
  }
  
  await db.update(users).set({
    passwordHash: newPasswordHash,
    resetToken: null,
    resetTokenExpiry: null,
  }).where(eq(users.id, user.id));
  
  return user;
}

export async function updateUserPassword(userId: number, newPasswordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));
}

// ============ AUDIT LOG FUNCTIONS ============

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create audit log: database not available");
    return;
  }

  try {
    await db.insert(auditLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
  }
}

export async function getAuditLogs(options: {
  limit?: number;
  offset?: number;
  userId?: number;
  actionType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const { limit = 50, offset = 0, userId, actionType, startDate, endDate } = options;

  const conditions = [];
  if (userId) conditions.push(eq(auditLogs.userId, userId));
  if (actionType) conditions.push(eq(auditLogs.actionType, actionType as any));
  if (startDate) conditions.push(gte(auditLogs.timestamp, startDate));
  if (endDate) conditions.push(lte(auditLogs.timestamp, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, countResult] = await Promise.all([
    db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userOpenId: auditLogs.userOpenId,
      actionType: auditLogs.actionType,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      contentHash: auditLogs.contentHash,
      modelUsed: auditLogs.modelUsed,
      promptLength: auditLogs.promptLength,
      responseLength: auditLogs.responseLength,
      metadata: auditLogs.metadata,
      timestamp: auditLogs.timestamp,
    })
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause),
  ]);

  return {
    logs,
    total: countResult[0]?.count ?? 0,
  };
}

export async function getAuditLogStats() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total, last24hCount, last7dCount, byActionType] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(auditLogs),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(gte(auditLogs.timestamp, last24h)),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(gte(auditLogs.timestamp, last7d)),
    db.select({
      actionType: auditLogs.actionType,
      count: sql<number>`count(*)`,
    }).from(auditLogs).groupBy(auditLogs.actionType),
  ]);

  return {
    total: total[0]?.count ?? 0,
    last24h: last24hCount[0]?.count ?? 0,
    last7d: last7dCount[0]?.count ?? 0,
    byActionType: byActionType.reduce((acc, item) => {
      acc[item.actionType] = item.count;
      return acc;
    }, {} as Record<string, number>),
  };
}

// ============ USER SETTINGS FUNCTIONS ============

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserSettings(userId: number, settings: Partial<InsertUserSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserSettings(userId);
  
  if (existing) {
    await db.update(userSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({
      userId,
      ...settings,
    });
  }
}


// ============ API KEYS FUNCTIONS (BYOK) ============

import { userApiKeys, InsertUserApiKey, usageRecords, InsertUsageRecord, userDocuments, InsertUserDocument, documentChunks, InsertDocumentChunk } from "../drizzle/schema";
import crypto from "crypto";

// Simple encryption for API keys (in production, use a proper key management service)
const ENCRYPTION_KEY = process.env.JWT_SECRET || "default-encryption-key-change-me";

function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

function decryptApiKey(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function addUserApiKey(userId: number, provider: "openai" | "anthropic" | "google" | "groq", apiKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const encryptedKey = encryptApiKey(apiKey);
  const keyHint = apiKey.slice(-4);

  // Check if user already has a key for this provider
  const existing = await db.select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing key
    await db.update(userApiKeys)
      .set({ encryptedKey, keyHint, isActive: true, updatedAt: new Date() })
      .where(eq(userApiKeys.id, existing[0].id));
    return existing[0].id;
  }

  // Insert new key
  const result = await db.insert(userApiKeys).values({
    userId,
    provider,
    encryptedKey,
    keyHint,
    isActive: true,
  });

  return result[0].insertId;
}

export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: userApiKeys.id,
    provider: userApiKeys.provider,
    keyHint: userApiKeys.keyHint,
    isActive: userApiKeys.isActive,
    lastUsed: userApiKeys.lastUsed,
    createdAt: userApiKeys.createdAt,
  }).from(userApiKeys).where(eq(userApiKeys.userId, userId));
}

export async function getDecryptedApiKey(userId: number, provider: "openai" | "anthropic" | "google" | "groq"): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(userApiKeys)
    .where(and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider),
      eq(userApiKeys.isActive, true)
    ))
    .limit(1);

  if (result.length === 0) return null;

  // Update last used
  await db.update(userApiKeys)
    .set({ lastUsed: new Date() })
    .where(eq(userApiKeys.id, result[0].id));

  return decryptApiKey(result[0].encryptedKey);
}

export async function deleteUserApiKey(userId: number, keyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userApiKeys).where(and(
    eq(userApiKeys.id, keyId),
    eq(userApiKeys.userId, userId)
  ));
}

export async function toggleUserApiKey(userId: number, keyId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userApiKeys)
    .set({ isActive })
    .where(and(eq(userApiKeys.id, keyId), eq(userApiKeys.userId, userId)));
}

// ============ USAGE TRACKING FUNCTIONS ============

export async function createUsageRecord(record: InsertUsageRecord) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create usage record: database not available");
    return;
  }

  try {
    await db.insert(usageRecords).values(record);
  } catch (error) {
    console.error("[Database] Failed to create usage record:", error);
  }
}

export async function getUserUsageStats(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;

  const conditions = [eq(usageRecords.userId, userId)];
  if (startDate) conditions.push(gte(usageRecords.timestamp, startDate));
  if (endDate) conditions.push(lte(usageRecords.timestamp, endDate));

  const whereClause = and(...conditions);

  const [totals, byType, byDay] = await Promise.all([
    db.select({
      totalTokens: sql<number>`COALESCE(SUM(totalTokens), 0)`,
      totalRequests: sql<number>`COUNT(*)`,
      totalCost: sql<string>`COALESCE(SUM(CAST(estimatedCost AS DECIMAL(10,6))), 0)`,
    }).from(usageRecords).where(whereClause),
    
    db.select({
      actionType: usageRecords.actionType,
      count: sql<number>`COUNT(*)`,
      tokens: sql<number>`COALESCE(SUM(totalTokens), 0)`,
    }).from(usageRecords).where(whereClause).groupBy(usageRecords.actionType),
    
    db.select({
      date: sql<string>`DATE(timestamp)`,
      tokens: sql<number>`COALESCE(SUM(totalTokens), 0)`,
      requests: sql<number>`COUNT(*)`,
    }).from(usageRecords).where(whereClause).groupBy(sql`DATE(timestamp)`).orderBy(sql`DATE(timestamp)`),
  ]);

  return {
    totalTokens: totals[0]?.totalTokens ?? 0,
    totalRequests: totals[0]?.totalRequests ?? 0,
    totalCost: parseFloat(totals[0]?.totalCost ?? "0"),
    byType: byType.reduce((acc, item) => {
      acc[item.actionType] = { count: item.count, tokens: item.tokens };
      return acc;
    }, {} as Record<string, { count: number; tokens: number }>),
    byDay,
  };
}

export async function getRecentUsageRecords(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(usageRecords)
    .where(eq(usageRecords.userId, userId))
    .orderBy(desc(usageRecords.timestamp))
    .limit(limit);
}

// ============ DOCUMENT FUNCTIONS (RAG) ============

export async function createUserDocument(doc: InsertUserDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userDocuments).values(doc);
  return result[0].insertId;
}

export async function getUserDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(userDocuments)
    .where(eq(userDocuments.userId, userId))
    .orderBy(desc(userDocuments.createdAt));
}

export async function getDocumentById(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(userDocuments)
    .where(and(eq(userDocuments.id, documentId), eq(userDocuments.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateDocumentStatus(documentId: number, status: "processing" | "ready" | "error", textContent?: string, chunkCount?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (textContent !== undefined) updateData.textContent = textContent;
  if (chunkCount !== undefined) updateData.chunkCount = chunkCount;

  await db.update(userDocuments)
    .set(updateData)
    .where(eq(userDocuments.id, documentId));
}

export async function deleteUserDocument(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete chunks first
  await db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));
  // Delete document
  await db.delete(userDocuments).where(and(
    eq(userDocuments.id, documentId),
    eq(userDocuments.userId, userId)
  ));
}

export async function createDocumentChunks(chunks: InsertDocumentChunk[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (chunks.length === 0) return;
  await db.insert(documentChunks).values(chunks);
}

export async function getDocumentChunks(documentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(documentChunks)
    .where(eq(documentChunks.documentId, documentId))
    .orderBy(documentChunks.chunkIndex);
}

export async function searchDocumentChunks(userId: number, query: string, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  // Simple text search with document name - in production, use vector similarity
  const results = await db.select({
    id: documentChunks.id,
    documentId: documentChunks.documentId,
    content: documentChunks.content,
    chunkIndex: documentChunks.chunkIndex,
    documentName: userDocuments.filename,
  })
    .from(documentChunks)
    .leftJoin(userDocuments, eq(documentChunks.documentId, userDocuments.id))
    .where(and(
      eq(documentChunks.userId, userId),
      sql`LOWER(${documentChunks.content}) LIKE LOWER(${'%' + query + '%'})`
    ))
    .limit(limit);
  
  // Add similarity score (placeholder - in production use vector similarity)
  return results.map(r => ({
    ...r,
    similarity: 0.85, // Placeholder similarity score
  }));
}


// ============ AI CHARACTERS FUNCTIONS ============

export async function createCharacter(character: InsertAiCharacter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(aiCharacters).values(character);
  return result[0].insertId;
}

export async function getUserCharacters(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(aiCharacters)
    .where(eq(aiCharacters.userId, userId))
    .orderBy(desc(aiCharacters.updatedAt));
}

export async function getPublicCharacters(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(aiCharacters)
    .where(eq(aiCharacters.isPublic, true))
    .orderBy(desc(aiCharacters.usageCount))
    .limit(limit);
}

export async function getCharacterById(characterId: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select()
    .from(aiCharacters)
    .where(eq(aiCharacters.id, characterId))
    .limit(1);

  const character = results[0];
  if (!character) return undefined;

  // Check access: either owner or public
  if (character.userId !== userId && !character.isPublic) {
    return undefined;
  }

  return character;
}

export async function updateCharacter(characterId: number, userId: number, updates: Partial<InsertAiCharacter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(aiCharacters)
    .set(updates)
    .where(and(
      eq(aiCharacters.id, characterId),
      eq(aiCharacters.userId, userId)
    ));
}

export async function deleteCharacter(characterId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(aiCharacters).where(and(
    eq(aiCharacters.id, characterId),
    eq(aiCharacters.userId, userId)
  ));
}

export async function incrementCharacterUsage(characterId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(aiCharacters)
    .set({ usageCount: sql`${aiCharacters.usageCount} + 1` })
    .where(eq(aiCharacters.id, characterId));
}

// ============ SHARED LINKS FUNCTIONS ============

export async function createSharedLink(link: InsertSharedLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(sharedLinks).values(link);
  return link.shareId;
}

export async function getSharedLinkByShareId(shareId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select()
    .from(sharedLinks)
    .where(eq(sharedLinks.shareId, shareId))
    .limit(1);

  return results[0];
}

export async function getUserSharedLinks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(sharedLinks)
    .where(eq(sharedLinks.userId, userId))
    .orderBy(desc(sharedLinks.createdAt));
}

export async function incrementShareLinkViews(shareId: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(sharedLinks)
    .set({ viewCount: sql`${sharedLinks.viewCount} + 1` })
    .where(eq(sharedLinks.shareId, shareId));
}

export async function deactivateSharedLink(shareId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(sharedLinks)
    .set({ isActive: false })
    .where(and(
      eq(sharedLinks.shareId, shareId),
      eq(sharedLinks.userId, userId)
    ));
}

export async function deleteSharedLink(shareId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(sharedLinks).where(and(
    eq(sharedLinks.shareId, shareId),
    eq(sharedLinks.userId, userId)
  ));
}


// ============ DAILY USAGE TRACKING ============

export async function incrementDailyQueries(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get current user data
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return 0;

  // Check if we need to reset daily count (new day)
  const lastReset = user.dailyQueriesResetAt ? new Date(user.dailyQueriesResetAt) : null;
  const shouldReset = !lastReset || lastReset < today;

  const newCount = shouldReset ? 1 : (user.dailyQueries || 0) + 1;

  await db.update(users)
    .set({
      dailyQueries: newCount,
      dailyQueriesResetAt: shouldReset ? today : user.dailyQueriesResetAt,
    })
    .where(eq(users.id, userId));

  return newCount;
}

export async function getDailyQueryCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return 0;

  // Check if count is from today
  const lastReset = user.dailyQueriesResetAt ? new Date(user.dailyQueriesResetAt) : null;
  if (!lastReset || lastReset < today) {
    return 0; // New day, count is 0
  }

  return user.dailyQueries || 0;
}

export async function updateUserSubscription(
  userId: number,
  tier: "free" | "starter" | "pro" | "unlimited",
  status: "active" | "canceled" | "past_due" | "trialing" | "none",
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: status,
      ...(stripeCustomerId && { stripeCustomerId }),
      ...(stripeSubscriptionId && { stripeSubscriptionId }),
    })
    .where(eq(users.id, userId));
}


// ============ USER MEMORIES FUNCTIONS ============

export async function createMemory(memory: InsertUserMemory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userMemories).values(memory);
  return result[0].insertId;
}

export async function getUserMemories(userId: number, category?: string, activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(userMemories.userId, userId)];
  if (activeOnly) conditions.push(eq(userMemories.isActive, true));
  if (category) conditions.push(eq(userMemories.category, category as "preference" | "fact" | "context" | "instruction"));

  return await db.select()
    .from(userMemories)
    .where(and(...conditions))
    .orderBy(desc(userMemories.importance), desc(userMemories.createdAt));
}

export async function getMemoryById(memoryId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select()
    .from(userMemories)
    .where(and(
      eq(userMemories.id, memoryId),
      eq(userMemories.userId, userId)
    ))
    .limit(1);

  return results[0];
}

export async function updateMemory(memoryId: number, userId: number, updates: Partial<InsertUserMemory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userMemories)
    .set(updates)
    .where(and(
      eq(userMemories.id, memoryId),
      eq(userMemories.userId, userId)
    ));
}

export async function deleteMemory(memoryId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userMemories).where(and(
    eq(userMemories.id, memoryId),
    eq(userMemories.userId, userId)
  ));
}

export async function touchMemory(memoryId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(userMemories)
    .set({ lastUsed: new Date() })
    .where(eq(userMemories.id, memoryId));
}

export async function getActiveMemoriesForContext(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  // Get most important and recently used memories
  return await db.select()
    .from(userMemories)
    .where(and(
      eq(userMemories.userId, userId),
      eq(userMemories.isActive, true)
    ))
    .orderBy(
      desc(userMemories.importance),
      desc(userMemories.lastUsed),
      desc(userMemories.createdAt)
    )
    .limit(limit);
}

// ============ ARTIFACTS FUNCTIONS ============

export async function createArtifact(artifact: InsertArtifact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(artifacts).values(artifact);
  return result[0].insertId;
}

export async function getUserArtifacts(userId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(artifacts.userId, userId)];
  if (type) conditions.push(eq(artifacts.type, type as "document" | "code" | "table" | "diagram" | "markdown"));

  return await db.select()
    .from(artifacts)
    .where(and(...conditions))
    .orderBy(desc(artifacts.updatedAt));
}

export async function getArtifactById(artifactId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select()
    .from(artifacts)
    .where(and(
      eq(artifacts.id, artifactId),
      eq(artifacts.userId, userId)
    ))
    .limit(1);

  return results[0];
}

export async function updateArtifact(artifactId: number, userId: number, updates: Partial<InsertArtifact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(artifacts)
    .set(updates)
    .where(and(
      eq(artifacts.id, artifactId),
      eq(artifacts.userId, userId)
    ));
}

export async function deleteArtifact(artifactId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(artifacts).where(and(
    eq(artifacts.id, artifactId),
    eq(artifacts.userId, userId)
  ));
}

export async function createArtifactVersion(originalId: number, userId: number, newContent: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the original artifact
  const original = await getArtifactById(originalId, userId);
  if (!original) throw new Error("Original artifact not found");

  // Create new version
  const result = await db.insert(artifacts).values({
    userId,
    title: original.title,
    type: original.type,
    content: newContent,
    language: original.language,
    version: original.version + 1,
    parentId: originalId,
    conversationId: original.conversationId,
    metadata: original.metadata,
  });

  return result[0].insertId;
}

export async function getArtifactVersionHistory(artifactId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get the artifact and all its ancestors
  const artifact = await getArtifactById(artifactId, userId);
  if (!artifact) return [];

  const history = [artifact];
  let currentId = artifact.parentId;

  while (currentId) {
    const parent = await getArtifactById(currentId, userId);
    if (!parent) break;
    history.push(parent);
    currentId = parent.parentId;
  }

  return history.reverse(); // Oldest first
}

// ============ USER PREFERENCES FUNCTIONS ============

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return results[0] || null;
}

export async function upsertUserPreferences(userId: number, prefs: Partial<InsertUserPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserPreferences(userId);

  if (existing) {
    await db.update(userPreferences)
      .set(prefs)
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      ...prefs,
    });
  }
}

export async function getShowThinking(userId: number): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  return prefs?.showThinking ?? false;
}

export async function getMemoryEnabled(userId: number): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  return prefs?.memoryEnabled ?? true;
}


// ============ USER DEVICE FUNCTIONS ============

/**
 * Generate a device fingerprint from user agent and other factors
 */
export function generateDeviceFingerprint(userAgent: string): string {
  // Create a hash of the user agent as the device fingerprint
  // We don't include IP because it can change (mobile networks, VPNs)
  return crypto.createHash("sha256").update(userAgent).digest("hex").substring(0, 64);
}

/**
 * Parse user agent to get a human-readable device name
 */
export function parseDeviceName(userAgent: string): string {
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect OS
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("Linux")) os = "Linux";

  // Detect Browser
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";

  return `${browser} on ${os}`;
}

/**
 * Check if a device is known for a user
 */
export async function isKnownDevice(userId: number, deviceFingerprint: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true; // Assume known if DB unavailable to avoid spam

  const results = await db.select()
    .from(userDevices)
    .where(and(
      eq(userDevices.userId, userId),
      eq(userDevices.deviceFingerprint, deviceFingerprint)
    ))
    .limit(1);

  return results.length > 0;
}

/**
 * Register a new device for a user
 */
export async function registerDevice(
  userId: number, 
  deviceFingerprint: string, 
  userAgent: string,
  ipAddress: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const deviceName = parseDeviceName(userAgent);

  await db.insert(userDevices).values({
    userId,
    deviceFingerprint,
    deviceName,
    lastIpAddress: ipAddress,
  });
}

/**
 * Update last used timestamp for a device
 */
export async function updateDeviceLastUsed(
  userId: number, 
  deviceFingerprint: string,
  ipAddress: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(userDevices)
    .set({ 
      lastUsedAt: new Date(),
      lastIpAddress: ipAddress,
    })
    .where(and(
      eq(userDevices.userId, userId),
      eq(userDevices.deviceFingerprint, deviceFingerprint)
    ));
}

/**
 * Get all devices for a user
 */
export async function getUserDevices(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(userDevices)
    .where(eq(userDevices.userId, userId))
    .orderBy(desc(userDevices.lastUsedAt));
}


// ============ GENERATED IMAGES FUNCTIONS ============

export async function createGeneratedImage(image: InsertGeneratedImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generatedImages).values(image);
  return result[0].insertId;
}

export async function getUserGeneratedImages(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(generatedImages)
    .where(eq(generatedImages.userId, userId))
    .orderBy(desc(generatedImages.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllGeneratedImages(options?: {
  limit?: number;
  offset?: number;
  userId?: number;
  status?: "completed" | "failed";
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return { images: [], total: 0 };

  const conditions = [];
  
  if (options?.userId) {
    conditions.push(eq(generatedImages.userId, options.userId));
  }
  if (options?.status) {
    conditions.push(eq(generatedImages.status, options.status));
  }
  if (options?.startDate) {
    conditions.push(gte(generatedImages.createdAt, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(generatedImages.createdAt, options.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(generatedImages)
    .where(whereClause);
  const total = Number(countResult[0]?.count ?? 0);

  // Get images with user info
  const images = await db.select({
    id: generatedImages.id,
    userId: generatedImages.userId,
    imageUrl: generatedImages.imageUrl,
    prompt: generatedImages.prompt,
    negativePrompt: generatedImages.negativePrompt,
    model: generatedImages.model,
    aspectRatio: generatedImages.aspectRatio,
    seed: generatedImages.seed,
    steps: generatedImages.steps,
    cfgScale: generatedImages.cfgScale,
    isEdit: generatedImages.isEdit,
    originalImageUrl: generatedImages.originalImageUrl,
    status: generatedImages.status,
    metadata: generatedImages.metadata,
    createdAt: generatedImages.createdAt,
    userName: users.name,
    userEmail: users.email,
  })
    .from(generatedImages)
    .leftJoin(users, eq(generatedImages.userId, users.id))
    .where(whereClause)
    .orderBy(desc(generatedImages.createdAt))
    .limit(options?.limit ?? 50)
    .offset(options?.offset ?? 0);

  return { images, total };
}

export async function getGeneratedImageStats() {
  const db = await getDb();
  if (!db) return { total: 0, last24h: 0, last7d: 0, byModel: {} };

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Total count
  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(generatedImages);
  const total = Number(totalResult[0]?.count ?? 0);

  // Last 24h
  const last24hResult = await db.select({ count: sql<number>`count(*)` })
    .from(generatedImages)
    .where(gte(generatedImages.createdAt, yesterday));
  const last24h = Number(last24hResult[0]?.count ?? 0);

  // Last 7 days
  const last7dResult = await db.select({ count: sql<number>`count(*)` })
    .from(generatedImages)
    .where(gte(generatedImages.createdAt, lastWeek));
  const last7d = Number(last7dResult[0]?.count ?? 0);

  // By model
  const byModelResult = await db.select({
    model: generatedImages.model,
    count: sql<number>`count(*)`,
  })
    .from(generatedImages)
    .groupBy(generatedImages.model);
  
  const byModel: Record<string, number> = {};
  for (const row of byModelResult) {
    byModel[row.model] = Number(row.count);
  }

  return { total, last24h, last7d, byModel };
}

export async function getGeneratedImageById(imageId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db.select({
    id: generatedImages.id,
    userId: generatedImages.userId,
    imageUrl: generatedImages.imageUrl,
    prompt: generatedImages.prompt,
    negativePrompt: generatedImages.negativePrompt,
    model: generatedImages.model,
    aspectRatio: generatedImages.aspectRatio,
    seed: generatedImages.seed,
    steps: generatedImages.steps,
    cfgScale: generatedImages.cfgScale,
    isEdit: generatedImages.isEdit,
    originalImageUrl: generatedImages.originalImageUrl,
    status: generatedImages.status,
    metadata: generatedImages.metadata,
    createdAt: generatedImages.createdAt,
    userName: users.name,
    userEmail: users.email,
  })
    .from(generatedImages)
    .leftJoin(users, eq(generatedImages.userId, users.id))
    .where(eq(generatedImages.id, imageId))
    .limit(1);

  return results[0];
}

export async function deleteGeneratedImage(imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(generatedImages).where(eq(generatedImages.id, imageId));
}
