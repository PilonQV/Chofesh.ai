import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Audit logs table for legal compliance.
 * Stores metadata about user activity without storing full conversation content.
 * Content is hashed for verification purposes while preserving privacy.
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  userOpenId: varchar("userOpenId", { length: 64 }),
  actionType: mysqlEnum("actionType", ["chat", "image_generation", "login", "logout", "settings_change", "document_upload", "document_chat"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userAgent: text("userAgent"),
  contentHash: varchar("contentHash", { length: 64 }),
  modelUsed: varchar("modelUsed", { length: 64 }),
  promptLength: int("promptLength"),
  responseLength: int("responseLength"),
  tokensUsed: int("tokensUsed"),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * User settings table for storing preferences.
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull().unique(),
  preferredModel: varchar("preferredModel", { length: 64 }).default("llama-3.1-8b"),
  preferredImageModel: varchar("preferredImageModel", { length: 64 }).default("flux"),
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("dark"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * User API keys table for BYOK (Bring Your Own Key).
 * Keys are encrypted before storage.
 */
export const userApiKeys = mysqlTable("user_api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  provider: mysqlEnum("provider", ["openai", "anthropic", "google"]).notNull(),
  encryptedKey: text("encryptedKey").notNull(),
  keyHint: varchar("keyHint", { length: 8 }), // Last 4 chars for display
  isActive: boolean("isActive").default(true).notNull(),
  lastUsed: timestamp("lastUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserApiKey = typeof userApiKeys.$inferSelect;
export type InsertUserApiKey = typeof userApiKeys.$inferInsert;

/**
 * Usage tracking table for monitoring consumption.
 */
export const usageRecords = mysqlTable("usage_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  actionType: mysqlEnum("actionType", ["chat", "image_generation", "document_chat"]).notNull(),
  model: varchar("model", { length: 64 }),
  inputTokens: int("inputTokens").default(0),
  outputTokens: int("outputTokens").default(0),
  totalTokens: int("totalTokens").default(0),
  estimatedCost: varchar("estimatedCost", { length: 20 }), // Store as string to avoid float issues
  keySource: mysqlEnum("keySource", ["platform", "user"]).default("platform").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type UsageRecord = typeof usageRecords.$inferSelect;
export type InsertUsageRecord = typeof usageRecords.$inferInsert;

/**
 * User documents table for RAG (Retrieval Augmented Generation).
 */
export const userDocuments = mysqlTable("user_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(),
  storageUrl: text("storageUrl").notNull(),
  textContent: text("textContent"), // Extracted text for RAG
  chunkCount: int("chunkCount").default(0),
  status: mysqlEnum("status", ["processing", "ready", "error"]).default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserDocument = typeof userDocuments.$inferSelect;
export type InsertUserDocument = typeof userDocuments.$inferInsert;

/**
 * Document chunks table for vector search.
 */
export const documentChunks = mysqlTable("document_chunks", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").references(() => userDocuments.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"), // JSON string of embedding vector
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;
