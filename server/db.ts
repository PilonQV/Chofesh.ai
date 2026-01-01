import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, auditLogs, InsertAuditLog, userSettings, InsertUserSettings } from "../drizzle/schema";
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
  }).from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ role }).where(eq(users.id, userId));
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

  // Simple text search - in production, use vector similarity
  return await db.select({
    id: documentChunks.id,
    documentId: documentChunks.documentId,
    content: documentChunks.content,
    chunkIndex: documentChunks.chunkIndex,
  })
    .from(documentChunks)
    .where(and(
      eq(documentChunks.userId, userId),
      sql`LOWER(${documentChunks.content}) LIKE LOWER(${'%' + query + '%'})`
    ))
    .limit(limit);
}
