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
  // Password authentication fields
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 64 }),
  verificationTokenExpiry: timestamp("verificationTokenExpiry"),
  resetToken: varchar("resetToken", { length: 64 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  // Subscription fields
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "starter", "pro", "unlimited"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trialing", "none"]).default("none").notNull(),
  // Daily usage tracking
  dailyQueries: int("dailyQueries").default(0).notNull(),
  dailyQueriesResetAt: timestamp("dailyQueriesResetAt").defaultNow().notNull(),
  lastQueryAt: timestamp("lastQueryAt"),
  // Age verification for adult content
  ageVerified: boolean("ageVerified").default(false).notNull(),
  ageVerifiedAt: timestamp("ageVerifiedAt"),
  // NSFW subscription add-on ($7.99/month)
  nsfwSubscriptionId: varchar("nsfwSubscriptionId", { length: 64 }),
  nsfwSubscriptionStatus: mysqlEnum("nsfwSubscriptionStatus", ["active", "canceled", "past_due", "none"]).default("none").notNull(),
  nsfwImagesUsed: int("nsfwImagesUsed").default(0).notNull(),
  nsfwImagesResetAt: timestamp("nsfwImagesResetAt"),
  // Timestamps
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
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
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
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
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
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: mysqlEnum("provider", ["openai", "anthropic", "google", "groq"]).notNull(),
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
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  actionType: mysqlEnum("actionType", ["chat", "image_generation", "document_chat", "youtube_summary", "url_analysis", "math_solve", "code_review"]).notNull(),
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
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  documentId: int("documentId").references(() => userDocuments.id, { onDelete: "cascade" }).notNull(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"), // JSON string of embedding vector
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;


/**
 * AI Characters/Personas table.
 * Users can create custom AI personalities with backstories.
 */
export const aiCharacters = mysqlTable("ai_characters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt").notNull(),
  avatarUrl: text("avatarUrl"),
  personality: text("personality"), // JSON string of personality traits
  isPublic: boolean("isPublic").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiCharacter = typeof aiCharacters.$inferSelect;
export type InsertAiCharacter = typeof aiCharacters.$inferInsert;

/**
 * Shared conversation links table.
 * Allows users to share encrypted conversations via secure links.
 */
export const sharedLinks = mysqlTable("shared_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  shareId: varchar("shareId", { length: 32 }).notNull().unique(),
  encryptedData: text("encryptedData").notNull(), // Encrypted conversation data
  title: varchar("title", { length: 255 }),
  expiresAt: timestamp("expiresAt"),
  viewCount: int("viewCount").default(0).notNull(),
  maxViews: int("maxViews"), // Optional limit on views
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SharedLink = typeof sharedLinks.$inferSelect;
export type InsertSharedLink = typeof sharedLinks.$inferInsert;


/**
 * User memories table for persistent context.
 * Stores important facts, preferences, and context that the AI should remember.
 */
export const userMemories = mysqlTable("user_memories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["preference", "fact", "context", "instruction"]).default("fact").notNull(),
  importance: mysqlEnum("importance", ["low", "medium", "high"]).default("medium").notNull(),
  source: mysqlEnum("source", ["user", "auto"]).default("user").notNull(), // user-created or auto-extracted
  isActive: boolean("isActive").default(true).notNull(),
  lastUsed: timestamp("lastUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserMemory = typeof userMemories.$inferSelect;
export type InsertUserMemory = typeof userMemories.$inferInsert;

/**
 * Artifacts table for storing generated documents, code, and other content.
 * Supports versioning and iterative editing.
 */
export const artifacts = mysqlTable("artifacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["document", "code", "table", "diagram", "markdown"]).default("document").notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 50 }), // For code artifacts
  version: int("version").default(1).notNull(),
  parentId: int("parentId"), // For version history - references previous version
  conversationId: varchar("conversationId", { length: 64 }), // Link to conversation that created it
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

/**
 * Extended user preferences for advanced features.
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  // Thinking mode settings
  showThinking: boolean("showThinking").default(false).notNull(),
  thinkingExpanded: boolean("thinkingExpanded").default(false).notNull(), // Default collapsed or expanded
  // Memory settings
  memoryEnabled: boolean("memoryEnabled").default(true).notNull(),
  autoExtractMemories: boolean("autoExtractMemories").default(false).notNull(),
  // Artifact settings
  artifactPanelEnabled: boolean("artifactPanelEnabled").default(true).notNull(),
  artifactPanelPosition: mysqlEnum("artifactPanelPosition", ["right", "bottom"]).default("right").notNull(),
  // Response format preferences
  preferredResponseFormat: mysqlEnum("preferredResponseFormat", ["detailed", "concise", "bullet", "auto"]).default("auto").notNull(),
  // Other preferences
  codeTheme: varchar("codeTheme", { length: 50 }).default("github-dark"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;


/**
 * Rate limits table for tracking login attempts and preventing brute force attacks.
 */
export const rateLimits = mysqlTable("rate_limits", {
  id: int("id").autoincrement().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  identifierType: mysqlEnum("identifier_type", ["ip", "email"]).notNull(),
  attempts: int("attempts").default(1).notNull(),
  firstAttemptAt: timestamp("first_attempt_at").defaultNow().notNull(),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until"),
});

export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = typeof rateLimits.$inferInsert;


/**
 * User devices table for tracking known login devices.
 * Used to detect new device logins and send security notifications.
 */
export const userDevices = mysqlTable("user_devices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  deviceFingerprint: varchar("deviceFingerprint", { length: 64 }).notNull(), // SHA-256 hash of user agent + other factors
  deviceName: varchar("deviceName", { length: 255 }), // Parsed device name (e.g., "Chrome on Windows")
  lastIpAddress: varchar("lastIpAddress", { length: 45 }),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserDevice = typeof userDevices.$inferSelect;
export type InsertUserDevice = typeof userDevices.$inferInsert;


/**
 * Generated images table for tracking all AI-generated images.
 * Stores image URLs, prompts, and metadata for admin review and user history.
 */
export const generatedImages = mysqlTable("generated_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  prompt: text("prompt").notNull(),
  negativePrompt: text("negativePrompt"),
  model: varchar("model", { length: 64 }).default("flux").notNull(),
  aspectRatio: varchar("aspectRatio", { length: 20 }),
  seed: varchar("seed", { length: 64 }),
  steps: int("steps"),
  cfgScale: varchar("cfgScale", { length: 10 }),
  isEdit: boolean("isEdit").default(false).notNull(), // Whether this was an image edit
  originalImageUrl: text("originalImageUrl"), // For edits, the source image
  status: mysqlEnum("status", ["completed", "failed"]).default("completed").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = typeof generatedImages.$inferInsert;


/**
 * GitHub OAuth connections table.
 * Stores encrypted GitHub access tokens for seamless integration.
 */
export const githubConnections = mysqlTable("github_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  githubId: varchar("githubId", { length: 64 }).notNull(), // GitHub user ID
  githubUsername: varchar("githubUsername", { length: 100 }).notNull(),
  githubEmail: varchar("githubEmail", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  encryptedAccessToken: text("encryptedAccessToken").notNull(),
  tokenScope: text("tokenScope"), // Comma-separated scopes
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GithubConnection = typeof githubConnections.$inferSelect;
export type InsertGithubConnection = typeof githubConnections.$inferInsert;


/**
 * Conversation folders table for organizing chats.
 * Users can create folders to categorize their conversations by project or topic.
 */
export const conversationFolders = mysqlTable("conversation_folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#6366f1"), // Hex color for folder icon
  icon: varchar("icon", { length: 50 }).default("folder"), // Lucide icon name
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConversationFolder = typeof conversationFolders.$inferSelect;
export type InsertConversationFolder = typeof conversationFolders.$inferInsert;

/**
 * Conversation to folder mapping table.
 * Links conversations (stored locally) to folders via conversation ID.
 */
export const conversationFolderMappings = mysqlTable("conversation_folder_mappings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  folderId: int("folderId").references(() => conversationFolders.id, { onDelete: "cascade" }).notNull(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(), // Local storage conversation ID
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});
export type ConversationFolderMapping = typeof conversationFolderMappings.$inferSelect;
export type InsertConversationFolderMapping = typeof conversationFolderMappings.$inferInsert;


/**
 * Detailed API call logs for admin auditing.
 * Stores full prompts and responses in plain text for readability.
 * Used for debugging, abuse detection, and support investigations.
 */
export const apiCallLogs = mysqlTable("api_call_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  userEmail: varchar("userEmail", { length: 320 }),
  userName: varchar("userName", { length: 255 }),
  
  // Request details
  actionType: mysqlEnum("actionType", [
    "chat", "image_generation", "image_edit", "document_chat", 
    "code_review", "web_search", "voice_transcription", "embedding"
  ]).notNull(),
  modelUsed: varchar("modelUsed", { length: 64 }),
  prompt: text("prompt"), // Full prompt in plain text
  systemPrompt: text("systemPrompt"), // System prompt if any
  
  // Response details
  response: text("response"), // Full response in plain text
  tokensInput: int("tokensInput"),
  tokensOutput: int("tokensOutput"),
  durationMs: int("durationMs"), // Request duration in milliseconds
  
  // Context
  conversationId: varchar("conversationId", { length: 64 }),
  personaUsed: varchar("personaUsed", { length: 64 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Status
  status: mysqlEnum("status", ["success", "error", "rate_limited"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  
  // Uncensored/NSFW flag
  isUncensored: boolean("isUncensored").default(false).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiCallLog = typeof apiCallLogs.$inferSelect;
export type InsertApiCallLog = typeof apiCallLogs.$inferInsert;

/**
 * Image access logs for tracking image generation and views.
 */
export const imageAccessLogs = mysqlTable("image_access_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  userEmail: varchar("userEmail", { length: 320 }),
  
  // Image details
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 255 }),
  prompt: text("prompt"), // Generation prompt
  
  // Action
  actionType: mysqlEnum("actionType", ["generate", "view", "download", "delete"]).notNull(),
  
  // Context
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImageAccessLog = typeof imageAccessLogs.$inferSelect;
export type InsertImageAccessLog = typeof imageAccessLogs.$inferInsert;

/**
 * Audit retention settings for configurable log cleanup.
 */
export const auditSettings = mysqlTable("audit_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 64 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuditSetting = typeof auditSettings.$inferSelect;
export type InsertAuditSetting = typeof auditSettings.$inferInsert;


/**
 * User credits table for the credits-based billing system.
 * Tracks both free daily credits and purchased credits separately.
 */
export const userCredits = mysqlTable("user_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Free credits (refresh daily, use-it-or-lose-it)
  freeCredits: int("freeCredits").default(30).notNull(),
  freeCreditsLastRefresh: timestamp("freeCreditsLastRefresh").defaultNow().notNull(),
  
  // Purchased credits (never expire)
  purchasedCredits: int("purchasedCredits").default(0).notNull(),
  
  // Lifetime stats
  totalCreditsUsed: int("totalCreditsUsed").default(0).notNull(),
  totalCreditsPurchased: int("totalCreditsPurchased").default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredit = typeof userCredits.$inferSelect;
export type InsertUserCredit = typeof userCredits.$inferInsert;

/**
 * Credit transactions table for audit trail.
 * Records all credit additions (purchases) and deductions (usage).
 */
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  
  // Transaction type
  type: mysqlEnum("type", ["purchase", "usage", "refund", "bonus", "daily_refresh"]).notNull(),
  
  // Amount (positive for additions, negative for deductions)
  amount: int("amount").notNull(),
  
  // Balance after transaction
  balanceAfter: int("balanceAfter").notNull(),
  
  // Source of credits used (for usage transactions)
  creditSource: mysqlEnum("creditSource", ["free", "purchased"]),
  
  // Details
  description: varchar("description", { length: 255 }),
  actionType: varchar("actionType", { length: 64 }), // chat, image_generation, etc.
  model: varchar("model", { length: 64 }), // Model used for this action
  
  // For purchases: Stripe reference
  stripePaymentId: varchar("stripePaymentId", { length: 64 }),
  packName: varchar("packName", { length: 64 }), // starter, standard, pro, power
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

/**
 * Credit packs configuration table.
 * Defines available credit packs for purchase.
 */
export const creditPacks = mysqlTable("credit_packs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(), // starter, standard, pro, power
  displayName: varchar("displayName", { length: 100 }).notNull(),
  credits: int("credits").notNull(),
  priceUsd: int("priceUsd").notNull(), // Price in cents (e.g., 500 = $5.00)
  stripePriceId: varchar("stripePriceId", { length: 64 }), // Stripe Price ID
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditPack = typeof creditPacks.$inferSelect;
export type InsertCreditPack = typeof creditPacks.$inferInsert;

/**
 * Credit costs configuration table.
 * Defines how many credits each action costs.
 */
export const creditCosts = mysqlTable("credit_costs", {
  id: int("id").autoincrement().primaryKey(),
  actionType: varchar("actionType", { length: 64 }).notNull(), // chat, image_generation, etc.
  modelTier: varchar("modelTier", { length: 64 }), // free, standard, premium, uncensored
  model: varchar("model", { length: 64 }), // Specific model name (optional)
  credits: int("credits").notNull(),
  description: varchar("description", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditCost = typeof creditCosts.$inferSelect;
export type InsertCreditCost = typeof creditCosts.$inferInsert;


/**
 * Support requests table for customer support tickets.
 */
export const supportRequests = mysqlTable("support_requests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  category: varchar("category", { length: 64 }).default("general").notNull(),
  priority: varchar("priority", { length: 32 }).default("normal").notNull(),
  message: text("message").notNull(),
  userId: int("userId"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  adminNotes: text("adminNotes"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = typeof supportRequests.$inferInsert;


/**
 * Provider usage analytics table.
 * Tracks which AI providers and models are being used.
 */
export const providerUsage = mysqlTable("provider_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 32 }).notNull(), // groq, openrouter, cerebras, puter, etc.
  model: varchar("model", { length: 128 }).notNull(),
  modelTier: mysqlEnum("modelTier", ["free", "standard", "premium"]).default("free").notNull(),
  actionType: mysqlEnum("actionType", ["chat", "image", "search", "code", "document"]).default("chat").notNull(),
  inputTokens: int("inputTokens").default(0),
  outputTokens: int("outputTokens").default(0),
  totalTokens: int("totalTokens").default(0),
  latencyMs: int("latencyMs"), // Response time in milliseconds
  success: boolean("success").default(true).notNull(),
  errorMessage: text("errorMessage"),
  costSaved: varchar("costSaved", { length: 20 }), // Estimated cost saved by using free tier
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ProviderUsage = typeof providerUsage.$inferSelect;
export type InsertProviderUsage = typeof providerUsage.$inferInsert;

/**
 * Provider usage daily aggregates for dashboard.
 * Pre-computed daily stats for faster analytics queries.
 */
export const providerUsageDaily = mysqlTable("provider_usage_daily", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  totalRequests: int("totalRequests").default(0).notNull(),
  successfulRequests: int("successfulRequests").default(0).notNull(),
  failedRequests: int("failedRequests").default(0).notNull(),
  totalTokens: bigint("totalTokens", { mode: "number" }).default(0).notNull(),
  avgLatencyMs: int("avgLatencyMs"),
  totalCostSaved: varchar("totalCostSaved", { length: 20 }),
  uniqueUsers: int("uniqueUsers").default(0).notNull(),
});

export type ProviderUsageDaily = typeof providerUsageDaily.$inferSelect;
export type InsertProviderUsageDaily = typeof providerUsageDaily.$inferInsert;
