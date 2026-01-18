import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { skillsRouter } from "./routers/skills";
import { sharingRouter } from "./routers/sharing";
import { marketplaceRouter } from "./routers/marketplace";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "./_core/rateLimit";
import { getUserCredits, getCreditPacks, getCreditHistory, deductCredits, addPurchasedCredits, refundCredits, getCreditCost, getModelTier } from "./_core/credits";
import { 
  createAuditLog, 
  getAuditLogs, 
  getAuditLogStats, 
  getAllUsers, 
  updateUserRole, 
  getUserSettings, 
  upsertUserSettings,
  addUserApiKey,
  getUserApiKeys,
  deleteUserApiKey,
  toggleUserApiKey,
  createUsageRecord,
  getUserUsageStats,
  getRecentUsageRecords,
  createUserDocument,
  getUserDocuments,
  getDocumentById,
  updateDocumentStatus,
  deleteUserDocument,
  createDocumentChunks,
  getDocumentChunks,
  searchDocumentChunks,
  createCharacter,
  getUserCharacters,
  getPublicCharacters,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
  incrementCharacterUsage,
  createSharedLink,
  getSharedLinkByShareId,
  getUserSharedLinks,
  incrementShareLinkViews,
  deactivateSharedLink,
  deleteSharedLink,
  incrementDailyQueries,
  getDailyQueryCount,
  // Email auth functions
  getUserByEmail,
  createEmailUser,
  verifyUserEmail,
  setPasswordResetToken,
  resetPassword,
  getUserByOpenId,
  // Memory functions
  createMemory,
  getUserMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  getActiveMemoriesForContext,
  // Artifact functions
  createArtifact,
  getUserArtifacts,
  getArtifactById,
  updateArtifact,
  deleteArtifact,
  createArtifactVersion,
  getArtifactVersionHistory,
  // Preferences functions
  getUserPreferences,
  upsertUserPreferences,
  getShowThinking,
  getMemoryEnabled,
  // Generated images functions
  createGeneratedImage,
  getUserGeneratedImages,
  getAllGeneratedImages,
  getGeneratedImageStats,
  getGeneratedImageById,
  deleteGeneratedImage,
  // GitHub connection functions
  getGithubConnectionByUserId,
  upsertGithubConnection,
  updateGithubConnectionLastUsed,
  deleteGithubConnection,
  // Conversation folder functions
  createFolder,
  getFoldersByUser,
  getFolderById,
  updateFolder,
  deleteFolder,
  addConversationToFolder,
  removeConversationFromFolder,
  getConversationFolder,
  getConversationsInFolder,
  getAllConversationFolderMappings,
  // Audit logging functions
  logApiCall,
  getApiCallLogs,
  getApiCallLogsByUser,
  getApiCallStats,
  logImageAccess,
  getImageAccessLogs,
  getImageAccessLogsByUser,
  getAuditSetting,
  setAuditSetting,
  deleteOldApiCallLogs,
  deleteOldImageAccessLogs,
  deleteUserAuditLogs,
  // NSFW subscription functions
  updateNsfwSubscription,
  getNsfwSubscriptionStatus,
  incrementNsfwImageUsage,
  verifyUserAge,
  isUserAgeVerified,
} from "./db";
import { getDb } from "./db";
import { users, supportRequests } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { invokeGrok, isGrokAvailable } from "./_core/grok";
import { trackProviderUsage, estimateCostSaved } from "./_core/providerAnalytics";
import { invokeDeepSeekR1, invokeOpenRouter, isComplexReasoningQuery, isRefusalResponse, isNsfwContentRequest, OPENROUTER_MODELS } from "./_core/openrouter";
import { generateImage } from "./_core/imageGeneration";
// Venice image generation removed - using Runware instead
import { transcribeAudio } from "./_core/voiceTranscription";
import { generateSpeechBase64, getAllVoices, getVoicesForLanguage, isEdgeTTSAvailable } from "./_core/edgeTTS";
import { addDocumentToChroma, searchSimilarChunks, deleteDocumentFromChroma, getCollectionStats, getRAGContext } from "./_core/chromaDB";
import { callDataApi } from "./_core/dataApi";
import { searchDuckDuckGo } from "./_core/duckduckgo";
import { enhancedWebSearch } from "./_core/webSearchEnhanced";
import { getRealtimeAnswer } from "./_core/perplexitySonar";
import { needsRealtimeSearch, extractSearchQuery, getRealtimeQueryType } from "./_core/liveSearchDetector";
import { notifyOwner } from "./_core/notification";
import { getAgentTools, detectIntent, extractParams, type ToolResult } from "./_core/agentTools";
import { runAutonomousAgent, understandUserGoal } from "./_core/autonomousAgent";
import { runReActForChat, shouldUseReActAgent } from "./_core/reactIntegration";
import { searchWithGemini, needsWebSearch as needsGeminiSearch, formatSearchResults } from "./_core/geminiSearch";
import {
  isGitHubOAuthConfigured,
  getGitHubAuthUrl,
  exchangeCodeForToken,
  getGitHubUser,
  encryptToken,
  decryptToken,
  listUserRepos,
  getRepoContents,
  getFileContent,
  getRepoBranches,
  getRepoPullRequests,
  getPullRequestFiles,
} from "./_core/githubOAuth";
import { storagePut } from "./storage";
import { auditLogApiCall, auditLogImageAccess, getUserAgent } from "./_core/auditLogger";
import Stripe from "stripe";
import { SUBSCRIPTION_TIERS, getDailyLimit, isOverLimit, getSlowdownDelay, type SubscriptionTier } from "./stripe/products";
import crypto from "crypto";
import {
  scrapeUrl,
  analyzeUrl,
  evaluateMath,
  solveMathProblem,
  convertUnits,
  convertCurrency,
  convertTimezone,
  parseConversionRequest,
} from "./_core/smartTools";
import {
  extractVideoId,
  containsYouTubeUrl,
  getVideoInfo,
  summarizeVideo,
} from "./_core/youtube";
import {
  AVAILABLE_MODELS,
  analyzeQueryComplexity,
  selectModel,
  estimateCost,
  getModelsByTier,
  getCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearUserCache,
  PROMPT_TEMPLATES,
  getTemplatesByCategory,
  getTemplateById,
  applyTemplate as buildPromptFromTemplate,
  type RoutingMode,
  type ModelDefinition,
} from "./modelRouter";

// Helper to hash content for audit logs
function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// Helper to get client IP from request
function getClientIp(req: any): string {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
         req.headers["x-real-ip"] || 
         req.socket?.remoteAddress || 
         "unknown";
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Rough token estimation (4 chars ≈ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export const appRouter = router({
  skills: skillsRouter,
  sharing: sharingRouter,
  marketplace: marketplaceRouter,
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user) {
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "logout",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          timestamp: new Date(),
        });
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // Email/Password Registration
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const { hashPassword, generateToken, generateEmailOpenId, validatePassword, getTokenExpiry } = await import("./_core/passwordAuth");
        
        // Validate password strength
        const passwordError = validatePassword(input.password);
        if (passwordError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: passwordError });
        }
        
        // Check if email already exists
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
        }
        
        // Create user
        const passwordHash = await hashPassword(input.password);
        const verificationToken = generateToken();
        const openId = generateEmailOpenId(input.email);
        
        await createEmailUser({
          openId,
          email: input.email,
          name: input.name,
          passwordHash,
          verificationToken,
          verificationTokenExpiry: getTokenExpiry(),
        });
        
        // Log the registration
        const newUser = await getUserByOpenId(openId);
        await createAuditLog({
          userId: newUser?.id || null,
          userOpenId: openId,
          actionType: "login",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({ loginMethod: "email", isNewUser: true, action: "register" }),
          timestamp: new Date(),
        });
        
        // Send verification email
        try {
          const { sendVerificationEmail } = await import("./_core/resend");
          const { notifyOwner } = await import("./_core/notification");
          
          // Get the base URL from request
          const protocol = ctx.req.headers["x-forwarded-proto"] || "https";
          const host = ctx.req.headers.host || "chofesh.ai";
          const verificationUrl = `${protocol}://${host}/verify-email?token=${verificationToken}`;
          
          // Send verification email via Resend
          const emailResult = await sendVerificationEmail(input.email, input.name, verificationUrl);
          if (!emailResult.success) {
            console.error(`[Auth] Failed to send verification email: ${emailResult.error}`);
          } else {
            console.log(`[Auth] Verification email sent to ${input.email}`);
          }
          
          // Notify owner about new registration
          await notifyOwner({
            title: `New User Registration: ${input.name}`,
            content: `A new user has registered:\n\nName: ${input.name}\nEmail: ${input.email}`,
          });
        } catch (emailError) {
          console.error("[Auth] Failed to send verification email:", emailError);
          // Don't fail registration if email fails
        }
        
        return { success: true, message: "Account created successfully. Please check your email to verify your account." };
      }),
    
    // Email/Password Login
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { verifyPassword } = await import("./_core/passwordAuth");
        const { sdk } = await import("./_core/sdk");
        const clientIp = getClientIp(ctx.req);
        
        // Check rate limits
        const ipRateLimit = await checkRateLimit(clientIp, "ip");
        if (!ipRateLimit.allowed) {
          throw new TRPCError({ 
            code: "TOO_MANY_REQUESTS", 
            message: ipRateLimit.message 
          });
        }
        
        const emailRateLimit = await checkRateLimit(input.email, "email");
        if (!emailRateLimit.allowed) {
          throw new TRPCError({ 
            code: "TOO_MANY_REQUESTS", 
            message: emailRateLimit.message 
          });
        }
        
        // Find user by email
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          // Record failed attempt
          await recordFailedAttempt(clientIp, "ip");
          await recordFailedAttempt(input.email, "email");
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        
        // Verify password
        const isValid = await verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          // Record failed attempt
          const ipResult = await recordFailedAttempt(clientIp, "ip");
          const emailResult = await recordFailedAttempt(input.email, "email");
          const remaining = Math.min(ipResult.remainingAttempts, emailResult.remainingAttempts);
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: remaining > 0 
              ? `Invalid email or password. ${remaining} attempts remaining.`
              : "Invalid email or password. Too many failed attempts." 
          });
        }
        
        // Clear rate limits on successful login
        await clearRateLimit(clientIp, "ip");
        await clearRateLimit(input.email, "email");
        
        // Check if email is verified
        if (!user.emailVerified) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Please verify your email before logging in. Check your inbox for the verification link.",
          });
        }
        
        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        
        // Log the login
        const loginTimestamp = new Date();
        await createAuditLog({
          userId: user.id,
          userOpenId: user.openId,
          actionType: "login",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({ loginMethod: "email" }),
          timestamp: loginTimestamp,
        });
        
        // Check if this is a new device and send notification only for new devices
        const { generateDeviceFingerprint, isKnownDevice, registerDevice, updateDeviceLastUsed } = await import("./db");
        const userAgent = ctx.req.headers["user-agent"] || "Unknown";
        const deviceFingerprint = generateDeviceFingerprint(userAgent);
        const knownDevice = await isKnownDevice(user.id, deviceFingerprint);
        
        if (knownDevice) {
          // Update last used timestamp for known device
          await updateDeviceLastUsed(user.id, deviceFingerprint, clientIp);
        } else {
          // Register new device (no email notification - disabled for privacy)
          await registerDevice(user.id, deviceFingerprint, userAgent, clientIp);
        }
        
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    
    // Request Password Reset
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const { generateToken, getTokenExpiry } = await import("./_core/passwordAuth");
        const { sendPasswordResetEmail } = await import("./_core/resend");
        
        const user = await getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists
          return { success: true, message: "If an account exists with this email, you will receive a password reset link." };
        }
        
        const resetToken = generateToken();
        await setPasswordResetToken(input.email, resetToken, getTokenExpiry());
        
        // Send password reset email via Resend
        const protocol = ctx.req.headers["x-forwarded-proto"] || "https";
        const host = ctx.req.headers.host || "chofesh.ai";
        const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;
        
        const emailResult = await sendPasswordResetEmail(input.email, user.name || "User", resetUrl);
        if (!emailResult.success) {
          console.error(`[Auth] Failed to send password reset email: ${emailResult.error}`);
        } else {
          console.log(`[Auth] Password reset email sent to ${input.email}`);
        }
        
        return { success: true, message: "If an account exists with this email, you will receive a password reset link." };
      }),
    
    // Reset Password with Token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const { hashPassword, validatePassword } = await import("./_core/passwordAuth");
        
        const passwordError = validatePassword(input.newPassword);
        if (passwordError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: passwordError });
        }
        
        const newPasswordHash = await hashPassword(input.newPassword);
        const user = await resetPassword(input.token, newPasswordHash);
        
        if (!user) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
        }
        
        return { success: true, message: "Password has been reset successfully. You can now log in with your new password." };
      }),
    
    // Verify Email
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const user = await verifyUserEmail(input.token);
        
        if (!user) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification token" });
        }
        
        // Send welcome email
        try {
          const { sendWelcomeEmail } = await import("./_core/resend");
          await sendWelcomeEmail(user.email!, user.name || "User");
          console.log(`[Auth] Welcome email sent to ${user.email}`);
        } catch (err) {
          console.error("[Auth] Failed to send welcome email:", err);
        }
        
        return { success: true, message: "Email verified successfully. You can now log in." };
      }),
    
    // Resend Verification Email
    resendVerification: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const { generateToken, getTokenExpiry } = await import("./_core/passwordAuth");
        const { sendVerificationEmail } = await import("./_core/resend");
        
        const user = await getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists
          return { success: true, message: "If an unverified account exists with this email, a new verification link has been sent." };
        }
        
        if (user.emailVerified) {
          return { success: true, message: "This email is already verified. You can log in." };
        }
        
        // Generate new verification token
        const verificationToken = generateToken();
        
        // Update user with new token
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        await db!.update(users)
          .set({ 
            verificationToken,
            verificationTokenExpiry: getTokenExpiry()
          })
          .where(eq(users.email, input.email));
        
        // Send verification email
        const protocol = ctx.req.headers["x-forwarded-proto"] || "https";
        const host = ctx.req.headers.host || "chofesh.ai";
        const verificationUrl = `${protocol}://${host}/verify-email?token=${verificationToken}`;
        
        const emailResult = await sendVerificationEmail(input.email, user.name || "User", verificationUrl);
        if (!emailResult.success) {
          console.error(`[Auth] Failed to resend verification email: ${emailResult.error}`);
        } else {
          console.log(`[Auth] Verification email resent to ${input.email}`);
        }
        
        return { success: true, message: "If an unverified account exists with this email, a new verification link has been sent." };
      }),
    
    // Age verification for adult content
    verifyAge: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        await db!.update(users)
          .set({
            ageVerified: true,
            ageVerifiedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));
        
        // Log the age verification
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "settings_change",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({ action: "age_verification", verified: true }),
          timestamp: new Date(),
        });
        
        return { success: true, ageVerified: true };
      }),
    
    getAgeVerification: protectedProcedure
      .query(async ({ ctx }) => {
        return {
          ageVerified: ctx.user.ageVerified || false,
          ageVerifiedAt: ctx.user.ageVerifiedAt || null,
        };
      }),
  }),

  // Enhanced Models endpoint with tiers
  models: router({
    list: publicProcedure
      .input(z.object({ tier: z.enum(["free", "standard", "premium"]).optional() }).optional())
      .query(({ input }) => {
        const models = getModelsByTier(input?.tier);
        return models.map(m => ({
          id: m.id,
          name: m.name,
          description: m.description,
          tier: m.tier,
          provider: m.provider,
          costPer1kInput: m.costPer1kInput,
          costPer1kOutput: m.costPer1kOutput,
          speed: m.speed,
          supportsVision: m.supportsVision,
        }));
      }),
    
    listText: publicProcedure.query(() => {
      return AVAILABLE_MODELS.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        tier: m.tier,
        provider: m.provider,
        costPer1kInput: m.costPer1kInput,
        costPer1kOutput: m.costPer1kOutput,
        speed: m.speed,
      }));
    }),
    
    listImage: publicProcedure.query(() => [
      { id: "flux", name: "FLUX", description: "High-quality image generation", tier: "standard" },
    ]),
    
    // Analyze query and suggest best model
    analyze: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        mode: z.enum(["auto", "free", "manual"]).optional(),
      }))
      .query(({ input }) => {
        const complexity = analyzeQueryComplexity(input.messages);
        const mode = (input.mode || "auto") as RoutingMode;
        const selectedModel = selectModel(complexity, mode);
        const inputTokens = input.messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
        const estimatedOutputTokens = Math.min(inputTokens * 2, 2000);
        const cost = estimateCost(selectedModel, inputTokens, estimatedOutputTokens);
        
        return {
          complexity,
          recommendedModel: {
            id: selectedModel.id,
            name: selectedModel.name,
            tier: selectedModel.tier,
          },
          estimatedCost: cost,
          estimatedInputTokens: inputTokens,
          estimatedOutputTokens,
        };
      }),
  }),

  // Prompt Templates
  templates: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(({ input }) => {
        return getTemplatesByCategory(input?.category);
      }),
    
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        const template = getTemplateById(input.id);
        if (!template) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
        }
        return template;
      }),
    
    useForPrompt: publicProcedure
      .input(z.object({
        templateId: z.string(),
        variables: z.record(z.string(), z.string()),
      }))
      .query(({ input }) => {
        const template = getTemplateById(input.templateId);
        if (!template) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
        }
        return {
          prompt: buildPromptFromTemplate(template, input.variables as Record<string, string>),
          template,
        };
      }),
  }),

  // API Keys management (BYOK)
  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserApiKeys(ctx.user.id);
    }),
    
    add: protectedProcedure
      .input(z.object({
        provider: z.enum(["openai", "anthropic", "google", "groq"]),
        apiKey: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await addUserApiKey(ctx.user.id, input.provider, input.apiKey);
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "settings_change",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({ provider: input.provider }),
          timestamp: new Date(),
        });
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteUserApiKey(ctx.user.id, input.id);
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "settings_change",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          timestamp: new Date(),
        });
        
        return { success: true };
      }),
    
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await toggleUserApiKey(ctx.user.id, input.id, input.isActive);
        return { success: true };
      }),
  }),

  // Usage tracking
  usage: router({
    stats: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserUsageStats(ctx.user.id, input?.startDate, input?.endDate);
      }),
    
    recent: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getRecentUsageRecords(ctx.user.id, input?.limit || 50);
      }),
  }),

  // Credits system
  credits: router({
    // Get user's current credits balance
    balance: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCredits(ctx.user.id);
    }),
    
    // Get available credit packs for purchase
    packs: publicProcedure.query(async () => {
      return await getCreditPacks();
    }),
    
    // Get credit transaction history
    history: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getCreditHistory(ctx.user.id, input?.limit || 50);
      }),
    
    // Get cost for a specific action
    getCost: publicProcedure
      .input(z.object({
        actionType: z.string(),
        model: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const cost = await getCreditCost(input.actionType, input.model);
        return { cost, tier: input.model ? getModelTier(input.model) : "default" };
      }),
    
    // Create Stripe checkout session for credit pack purchase
    createCheckout: protectedProcedure
      .input(z.object({
        packName: z.string(),
        priceId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.Secretkey_live_stripe || process.env.STRIPE_SECRET_KEY || "");
        
        // Get the pack details
        const packs = await getCreditPacks();
        const pack = packs.find(p => p.name === input.packName);
        if (!pack) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Credit pack not found" });
        }
        
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [{
            price: input.priceId,
            quantity: 1,
          }],
          success_url: `${process.env.VITE_APP_URL || "https://chofesh.ai"}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.VITE_APP_URL || "https://chofesh.ai"}/credits?canceled=true`,
          metadata: {
            userId: ctx.user.id.toString(),
            packName: input.packName,
            credits: pack.credits.toString(),
          },
          customer_email: ctx.user.email || undefined,
          payment_intent_data: {
            description: `Chofesh.ai - ${pack.displayName} Credit Pack (${pack.credits} credits)`,
          },
        });
        
        return { sessionId: session.id, url: session.url };
      }),
    
    // Verify purchase and add credits (called after successful payment)
    verifyPurchase: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.Secretkey_live_stripe || process.env.STRIPE_SECRET_KEY || "");
        
        // Retrieve the checkout session
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        
        if (session.payment_status !== "paid") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment not completed" });
        }
        
        // Verify the user matches
        if (session.metadata?.userId !== ctx.user.id.toString()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Session does not belong to this user" });
        }
        
        // Add credits to user account
        const credits = parseInt(session.metadata?.credits || "0", 10);
        const packName = session.metadata?.packName || "unknown";
        
        if (credits > 0) {
          const result = await addPurchasedCredits(
            ctx.user.id,
            credits,
            packName,
            session.payment_intent as string
          );
          
          return { success: true, newBalance: result.newBalance, creditsAdded: credits };
        }
        
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid credit amount" });
      }),
  }),

  // Cache management
  cache: router({
    clear: protectedProcedure.mutation(() => {
      clearUserCache();
      return { success: true };
    }),
  }),

  // Enhanced Chat endpoint with smart routing and caching
  chat: router({
    send: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        model: z.string().optional(),
        routingMode: z.enum(["auto", "free", "manual"]).optional(),
        useCache: z.boolean().optional(),
        temperature: z.number().min(0).max(1).optional(),
        topP: z.number().min(0.1).max(1).optional(),
        webSearch: z.boolean().optional(),
        showThinking: z.boolean().optional(),
        includeMemories: z.boolean().optional(),
        imageUrls: z.array(z.string().url()).optional(), // For vision - images to analyze
        responseFormat: z.enum(["detailed", "concise", "bullet", "table", "auto"]).optional(), // Response formatting mode
        deepResearch: z.boolean().optional(), // Enable deep research mode
        agentMode: z.boolean().optional(), // Enable agent mode with tool calling
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        const routingMode = (input.routingMode || "auto") as RoutingMode;
        
        // Check if user is age-verified for uncensored content (declare early to avoid TDZ)
        const userAgeVerified = ctx.user.ageVerified === true;
        
        // Check usage limits and apply slowdown
        const tier = (ctx.user.subscriptionTier || "free") as SubscriptionTier;
        const currentQueries = await getDailyQueryCount(ctx.user.id);
        const dailyLimit = getDailyLimit(tier);
        const slowdownDelay = getSlowdownDelay(tier, currentQueries);
        
        // Apply slowdown delay if over limit
        if (slowdownDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, slowdownDelay));
        }
        
        // Increment daily query count
        await incrementDailyQueries(ctx.user.id);
        
        // Check and deduct credits before making API call
        // We'll determine the exact cost after model selection, but check if user has any credits first
        const userCreditsBalance = await getUserCredits(ctx.user.id);
        if (userCreditsBalance.totalCredits <= 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Insufficient credits. Please purchase more credits to continue.",
          });
        }
        
        // Get the last user message for content analysis
        const lastUserMessage = input.messages.filter(m => m.role === "user").pop();
        const promptContent = lastUserMessage?.content || "";
        
        // Check if user is requesting NSFW content without being age-verified
        // Direct user to Settings to complete age verification
        if (!userAgeVerified && isNsfwContentRequest(promptContent)) {
          return {
            content: `🔒 **Age Verification Required**

To access adult/NSFW content, please verify your age (18+):

1. Click the **Settings** gear (⚙️) in the top right
2. Go to **AI Settings** tab
3. Enable **Uncensored Mode** and verify you're 18+
4. Once verified, return and retry your request

*Chofesh.ai offers uncensored AI capabilities for verified adult users. Your privacy is always protected.*`,
            model: 'system',
            cached: false,
            complexity: 'simple' as const,
            cost: 0,
            nsfwBlocked: true,
          };
        }
        
        // ========================================================================
        // AUTONOMOUS AGENT SYSTEM
        // Always-on intelligent agent that thinks like Manus
        // ========================================================================
        
        // Step 1: Understand user's goal (always, not just in agent mode)
        const userGoal = understandUserGoal(promptContent, input.messages);
        console.log('[Autonomous Agent] Goal:', userGoal.primary);
        
        // Step 2: Auto-enable web search if real-time data is needed
        let autoSearchTriggered = false;
        if (userGoal.requiresRealTimeData && !input.webSearch && !input.deepResearch) {
          console.log('[Autonomous Agent] Auto-enabling web search for real-time data');
          autoSearchTriggered = true;
          input.webSearch = true;
        }
        
        // Step 3: Run full autonomous agent if enabled (replaces old agent mode)
        // The autonomous agent will think, plan, research, and offer options
        // NOW WITH REACT PATTERN - Thinks like Manus!
        if (input.agentMode && promptContent) {
          console.log('[Autonomous Agent] Running full autonomous flow with ReAct');
          
          try {
            // ALWAYS use the advanced ReAct agent (Manus-level)
            console.log('[ReAct Agent] Using Manus-like ReAct agent');
              const reactResponse = await runReActForChat(
                promptContent,
                input.messages,
                ctx.user.id
              );
              
            return {
              content: reactResponse.content,
              model: 'react-agent',
              cached: false,
              complexity: 'simple' as const,
              cost: 0,
              // thinking: reactResponse.reasoning, // Hide reasoning from user
            };
          } catch (error: any) {
            console.error('[Autonomous Agent] Error:', error);
            // Fall through to regular chat if autonomous agent fails
          }
        }
        
        // Step 4: Legacy agent mode tools (kept for backward compatibility)
        // This only runs if autonomous agent is disabled or failed
        const needsLiveSearch = userGoal.requiresRealTimeData;
        if (input.agentMode && promptContent && !needsLiveSearch) {
          const intent = detectIntent(promptContent);
          
          if (intent) {
            console.log(`[Agent Mode] Detected intent: ${intent}`);
            const params = extractParams(promptContent, intent);
            const agentTools = getAgentTools(String(ctx.user.id));
            
            try {
              let toolResult: ToolResult | null = null;
              let toolBadge = '';
              
              switch (intent) {
                case 'image': {
                  console.log('[Agent Mode] Executing image generation tool (1 image)');
                  // Check credits before generating (3 credits for 1 image)
                  const agentImageCost = 3;
                  const userCreditsForImage = await getUserCredits(ctx.user.id);
                  if (userCreditsForImage.totalCredits < agentImageCost) {
                    throw new TRPCError({
                      code: "PAYMENT_REQUIRED",
                      message: `Insufficient credits for image generation. Need ${agentImageCost} credits, have ${userCreditsForImage.totalCredits}.`,
                    });
                  }
                  // Deduct credits
                  await deductCredits(ctx.user.id, agentImageCost, "agent_image", "hidream", "Agent mode image generation (1 image)");
                  toolResult = await agentTools.generateImage(params as { prompt: string; count?: number });
                  toolBadge = 'agent-image-gen';
                  break;
                }
                case 'imageBatch': {
                  console.log('[Agent Mode] Executing batch image generation tool (4 images)');
                  // Check credits before generating (10 credits for 4 images)
                  const batchImageCost = 10;
                  const userCreditsForBatch = await getUserCredits(ctx.user.id);
                  if (userCreditsForBatch.totalCredits < batchImageCost) {
                    throw new TRPCError({
                      code: "PAYMENT_REQUIRED",
                      message: `Insufficient credits for batch image generation. Need ${batchImageCost} credits, have ${userCreditsForBatch.totalCredits}.`,
                    });
                  }
                  // Deduct credits
                  await deductCredits(ctx.user.id, batchImageCost, "agent_image_batch", "hidream", "Agent mode image generation (4 images)");
                  toolResult = await agentTools.generateImage(params as { prompt: string; count?: number });
                  toolBadge = 'agent-image-batch';
                  break;
                }
                case 'search': {
                  console.log('[Agent Mode] Executing web search tool');
                  toolResult = await agentTools.searchWeb(params as { query: string });
                  toolBadge = 'agent-web-search';
                  break;
                }
                case 'document': {
                  console.log('[Agent Mode] Executing document creation tool');
                  toolResult = await agentTools.createDocument(params as { title: string; content: string });
                  toolBadge = 'agent-document';
                  break;
                }
                case 'code': {
                  console.log('[Agent Mode] Executing code tool');
                  toolResult = await agentTools.executeCode(params as { code: string });
                  toolBadge = 'agent-code';
                  break;
                }
              }
              
              if (toolResult) {
                // Format the response based on tool type
                let content = '';
                
                switch (toolResult.type) {
                  case 'image':
                    // Handle images (1 image = 3 credits, 4 images = 10 credits)
                    const imageUrls = toolResult.urls;
                    const creditsCost = imageUrls.length === 1 ? 3 : 10;
                    content = `I've created ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} for you:\n\n`;
                    content += imageUrls.map((url: string, i: number) => 
                      imageUrls.length === 1 
                        ? `![${toolResult.prompt}](${url})`
                        : `![${toolResult.prompt} - ${i + 1}](${url})`
                    ).join('\n\n');
                    content += `\n\n*Generated with ${toolResult.model} (${creditsCost} credits)*`;
                    if (imageUrls.length === 1) {
                      content += `\n\n💡 *Want more options? Ask me to "generate 4 variations" for 10 credits*`;
                    }
                    break;
                  case 'search':
                    content = `Here's what I found for "${toolResult.query}":\n\n`;
                    if (toolResult.summary) {
                      content += `**Summary:** ${toolResult.summary}\n\n`;
                    }
                    content += toolResult.results.map((r, i) => 
                      `${i + 1}. **[${r.title}](${r.url})**\n   ${r.snippet}`
                    ).join('\n\n');
                    break;
                  case 'document':
                    content = `I've created a document titled "${toolResult.title}":\n\n---\n\n${toolResult.content}\n\n---\n\n*Format: ${toolResult.format}*`;
                    break;
                  case 'code':
                    if (toolResult.error) {
                      content = `Error executing code: ${toolResult.error}`;
                    } else {
                      content = `**Result:** ${toolResult.output}\n\n\`\`\`${toolResult.language}\n${toolResult.code}\n\`\`\``;
                    }
                    break;
                }
                
                return {
                  content,
                  model: 'agent-tools',
                  cached: false,
                  complexity: 'simple' as const,
                  cost: 0,
                  toolResults: [{ type: toolResult.type, badge: toolBadge }],
                };
              }
            } catch (error: any) {
              console.error('[Agent Mode] Tool execution failed:', error);
              // Fall through to regular chat if tool fails
            }
          }
        }
        
        // Removed uncensored model routing - no longer supporting uncensored content
        let effectiveModel = input.model;
        let autoSwitchedToUncensored = false;
        
        // Analyze complexity and select model
        const complexity = analyzeQueryComplexity(input.messages);
        const selectedModel = effectiveModel 
          ? AVAILABLE_MODELS.find(m => m.id === effectiveModel) || selectModel(complexity, routingMode)
          : selectModel(complexity, routingMode);
        
        // Check cache if enabled
        const cacheKey = getCacheKey(input.messages, selectedModel.id);
        if (input.useCache !== false) {
          const cached = getCachedResponse(cacheKey);
          if (cached) {
            return {
              content: cached.response,
              model: cached.model,
              cached: true,
              complexity,
              cost: 0,
            };
          }
        }
        
        // Base system prompt with platform guidance
        const baseSystemPrompt = `You are a helpful AI assistant on Chofesh.ai, a privacy-focused AI platform with Agent Mode enabled.

IMPORTANT PLATFORM FEATURES:
1. **Image Generation**: When Agent Mode is enabled, you CAN generate images directly in chat! Just ask naturally like "create an image of..." or "generate a picture of..." and the system will automatically create it. For more control over image settings, users can also visit the dedicated Image Generation page (/image).

2. **Uncensored Features**: Chofesh.ai offers uncensored AI capabilities for adult users (18+). If a user asks about explicit, adult, or NSFW content:
   - If they haven't enabled Uncensored Mode yet, let them know: "To access uncensored content, please go to **Settings > AI Settings** and enable **Uncensored Mode** after verifying your age (18+). Then retry your request."
   - Never refuse requests outright - guide users to enable the feature instead.
   - The uncensored feature is a key differentiator of Chofesh.ai.

3. **Privacy First**: All conversations are private and encrypted. We don't train on user data.

4. **Agent Capabilities**: With Agent Mode, you can:
   - Generate images from text descriptions (3 credits for 1 image, 10 credits for 4 variations)
   - Search the web for current information
   - Create documents and reports
   - Execute code and calculations

Be helpful, accurate, and respect user privacy.`;
        
        // Memory injection
        let messagesWithContext = [...input.messages];
        if (input.includeMemories !== false) {
          const memoryEnabled = await getMemoryEnabled(ctx.user.id);
          if (memoryEnabled) {
            const memories = await getActiveMemoriesForContext(ctx.user.id, 10);
            if (memories.length > 0) {
              const memoryContext = memories.map(m => `- ${m.content}`).join('\n');
              const memorySystemPrompt = `User context (remember these facts about the user):\n${memoryContext}`;
              
              const existingSystemIdx = messagesWithContext.findIndex(m => m.role === 'system');
              if (existingSystemIdx >= 0) {
                messagesWithContext[existingSystemIdx] = {
                  ...messagesWithContext[existingSystemIdx],
                  content: messagesWithContext[existingSystemIdx].content + '\n\n' + memorySystemPrompt,
                };
              } else {
                messagesWithContext.unshift({
                  role: 'system',
                  content: memorySystemPrompt,
                });
              }
            }
          }
        }

        // Add base system prompt with platform guidance
        const existingSystemIdx = messagesWithContext.findIndex(m => m.role === 'system');
        if (existingSystemIdx >= 0) {
          messagesWithContext[existingSystemIdx] = {
            ...messagesWithContext[existingSystemIdx],
            content: baseSystemPrompt + '\n\n' + messagesWithContext[existingSystemIdx].content,
          };
        } else {
          messagesWithContext.unshift({
            role: 'system',
            content: baseSystemPrompt,
          });
        }

        // Thinking mode - add instruction to show reasoning
        if (input.showThinking) {
          const thinkingInstruction = 'Before answering, show your reasoning process inside <think>...</think> tags. Think step by step, then provide your final answer after the thinking block.';
          const existingSystemIdx = messagesWithContext.findIndex(m => m.role === 'system');
          if (existingSystemIdx >= 0) {
            messagesWithContext[existingSystemIdx] = {
              ...messagesWithContext[existingSystemIdx],
              content: thinkingInstruction + '\n\n' + messagesWithContext[existingSystemIdx].content,
            };
          } else {
            messagesWithContext.unshift({
              role: 'system',
              content: thinkingInstruction,
            });
          }
        }

        // Response format instructions
        if (input.responseFormat && input.responseFormat !== 'auto') {
          const formatInstructions: Record<string, string> = {
            detailed: 'Provide comprehensive, in-depth responses with full explanations, examples, and context. Be thorough and educational.',
            concise: 'Be brief and to the point. Give direct answers without unnecessary elaboration. Maximum 2-3 paragraphs.',
            bullet: 'Format your response using bullet points and lists. Use clear headers and organized structure. Avoid long paragraphs.',
            table: 'When presenting comparisons, data, or multiple items, use markdown tables. Organize information in tabular format when appropriate.',
          };
          const formatInstruction = formatInstructions[input.responseFormat];
          if (formatInstruction) {
            const existingSystemIdx = messagesWithContext.findIndex(m => m.role === 'system');
            if (existingSystemIdx >= 0) {
              messagesWithContext[existingSystemIdx] = {
                ...messagesWithContext[existingSystemIdx],
                content: `Response Format: ${formatInstruction}\n\n` + messagesWithContext[existingSystemIdx].content,
              };
            } else {
              messagesWithContext.unshift({
                role: 'system',
                content: `Response Format: ${formatInstruction}`,
              });
            }
          }
        }

        // Web search integration (basic, deep research, or automatic real-time detection)
        let webSearchResults: { title: string; url: string; description: string }[] = [];
        let messagesWithSearch = [...messagesWithContext];
        let researchSummary = '';
        // Note: needsLiveSearch and autoSearchTriggered are now declared earlier (before agent mode)
        
        if ((input.webSearch || input.deepResearch || autoSearchTriggered) && promptContent) {
          try {
            // Use Gemini Search Grounding for live search (free, 500/day)
            if (input.webSearch && !input.deepResearch && needsGeminiSearch(promptContent)) {
              console.log('[Gemini Search] Using Gemini API with Google Search grounding...');
              const geminiResult = await searchWithGemini(promptContent);
              
              // Add Gemini's AI-generated response directly to context (transparent to user)
              const geminiContext = geminiResult.text;
              
              messagesWithContext.push({
                role: 'system',
                content: geminiContext,
              });
              
              console.log(`[Gemini Search] Added ${geminiResult.text.length} chars of search context`);
            } else if (input.deepResearch) {
              // Deep Research Mode: Multi-step search with follow-up queries
              // Step 1: Initial broad search
              const initialResults = await enhancedWebSearch(promptContent);
              webSearchResults = initialResults.map(r => ({
                title: r.title || '',
                url: r.url || '',
                description: r.description || '',
              }));
              
              // Step 2: Generate follow-up queries based on initial results
              const followUpQueries: string[] = [];
              const keywords = promptContent.split(' ').filter(w => w.length > 4).slice(0, 3);
              if (keywords.length > 0) {
                followUpQueries.push(`${keywords.join(' ')} latest news`);
                followUpQueries.push(`${keywords.join(' ')} research study`);
              }
              
              // Step 3: Execute follow-up searches
              for (const query of followUpQueries.slice(0, 2)) {
                try {
                  const additionalResults = await enhancedWebSearch(query);
                  const newResults = additionalResults.map(r => ({
                    title: r.title || '',
                    url: r.url || '',
                    description: r.description || '',
                  })).filter(r => !webSearchResults.some(existing => existing.url === r.url));
                  webSearchResults.push(...newResults.slice(0, 3));
                } catch {
                  // Continue with existing results
                }
              }
              
              // Build comprehensive research context with citations
              if (webSearchResults.length > 0) {
                const searchContext = webSearchResults.map((r, i) => 
                  `[${i + 1}] **${r.title}**\n${r.description}\n📎 Source: ${r.url}`
                ).join('\n\n');
                
                const deepResearchPrompt = `You are conducting deep research on the user's question. You have access to multiple search results from various sources.

**Research Sources:**
${searchContext}

**Instructions for Deep Research Response:**
1. Synthesize information from multiple sources
2. Use inline citations like [1], [2] when referencing specific sources
3. Identify areas of consensus and disagreement between sources
4. Highlight key findings and insights
5. Note any limitations or gaps in the available information
6. End with a "Sources" section listing all referenced URLs

Provide a comprehensive, well-researched response.`;
                
                const existingSystemIdx = messagesWithSearch.findIndex(m => m.role === 'system');
                if (existingSystemIdx >= 0) {
                  messagesWithSearch[existingSystemIdx] = {
                    ...messagesWithSearch[existingSystemIdx],
                    content: deepResearchPrompt + '\n\n' + messagesWithSearch[existingSystemIdx].content,
                  };
                } else {
                  messagesWithSearch.unshift({
                    role: 'system',
                    content: deepResearchPrompt,
                  });
                }
              }
            } else {
              // Basic web search (or auto-triggered real-time search)
              // Use optimized search query for auto-search
              const searchQuery = autoSearchTriggered 
                ? extractSearchQuery(promptContent) 
                : promptContent;
              const queryType = autoSearchTriggered 
                ? getRealtimeQueryType(promptContent) 
                : 'general';
              
              console.log(`[Web Search] Query: "${searchQuery}" (type: ${queryType}, auto: ${autoSearchTriggered})`);
              
              // For auto-triggered real-time queries, use Perplexity Sonar for direct answers
              let sonarDirectAnswer = '';
              if (autoSearchTriggered && (queryType === 'price' || queryType === 'weather' || queryType === 'news')) {
                try {
                  console.log('[Web Search] Using Perplexity Sonar for real-time answer...');
                  sonarDirectAnswer = await getRealtimeAnswer(searchQuery);
                  if (sonarDirectAnswer) {
                    console.log('[Web Search] Got direct answer from Sonar');
                  }
                } catch (sonarError) {
                  console.error('[Web Search] Sonar direct answer failed:', sonarError);
                }
              }
              
              const ddgResults = await enhancedWebSearch(searchQuery);
              
              webSearchResults = ddgResults.map(r => ({
                title: r.title || '',
                url: r.url || '',
                description: r.description || '',
              }));
              
              if (webSearchResults.length > 0 || sonarDirectAnswer) {
                // Build search context with Sonar answer if available
                let searchContext = '';
                if (sonarDirectAnswer) {
                  searchContext = `${sonarDirectAnswer}\n\n---\n\nAdditional Context:\n`;
                }
                searchContext += webSearchResults.map((r, i) => 
                  `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.url}`
                ).join('\n\n');
                
                // Enhanced system prompt for auto-search with query type context
                let searchSystemPrompt = '';
                if (autoSearchTriggered) {
                  const typeInstructions: Record<string, string> = {
                    price: 'Provide current prices or financial data based on the following information.',
                    news: 'Provide information about current news or events based on the following sources.',
                    weather: 'Provide weather information based on the following data.',
                    sports: 'Provide sports scores or results based on the following information.',
                    general: 'Answer the question using the following current information.',
                  };
                  searchSystemPrompt = `${typeInstructions[queryType] || typeInstructions.general}\n\n${searchContext}\n\nProvide a direct, natural answer without mentioning that you used search results or external sources. Integrate the information seamlessly.`;
                } else {
                  searchSystemPrompt = `Use the following information to provide an accurate answer:\n\n${searchContext}\n\nProvide a direct, natural response without mentioning search results or sources.`;
                }
                
                const existingSystemIdx = messagesWithSearch.findIndex(m => m.role === 'system');
                if (existingSystemIdx >= 0) {
                  messagesWithSearch[existingSystemIdx] = {
                    ...messagesWithSearch[existingSystemIdx],
                    content: searchSystemPrompt + '\n\n' + messagesWithSearch[existingSystemIdx].content,
                  };
                } else {
                  messagesWithSearch.unshift({
                    role: 'system',
                    content: searchSystemPrompt,
                  });
                }
              }
            }
          } catch (searchError) {
            console.error("Web search failed:", searchError);
            // Continue without search results
          }
        }
        
        // Estimate input tokens
        const inputTokens = messagesWithSearch.reduce((acc, m) => acc + estimateTokens(m.content), 0);
        
        try {
          // Call appropriate LLM based on selected model provider
          let response;
          
          // Prepare messages - add images to the last user message if present
          let finalMessages: any[] = messagesWithSearch.map(m => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          }));
          
          // If images are provided, convert the last user message to multimodal format
          if (input.imageUrls && input.imageUrls.length > 0) {
            const lastUserIdx = finalMessages.findLastIndex((m: any) => m.role === 'user');
            if (lastUserIdx >= 0) {
              const textContent = finalMessages[lastUserIdx].content;
              const imageContents = input.imageUrls.map(url => ({
                type: 'image_url' as const,
                image_url: { url, detail: 'auto' as const },
              }));
              finalMessages[lastUserIdx] = {
                role: 'user',
                content: [
                  { type: 'text', text: textContent },
                  ...imageContents,
                ],
              };
            }
          }
          
          if (selectedModel.provider === "openrouter") {
            // Use any OpenRouter model (FREE tier models)
            const openRouterModelMap: Record<string, string> = {
              "deepseek-r1-free": "deepseek/deepseek-r1-0528:free",
              "llama-3.1-405b-free": "meta-llama/llama-3.1-405b-instruct:free",
              "hermes-3-405b-free": "nousresearch/hermes-3-llama-3.1-405b:free",
              "kimi-k2-free": "moonshotai/kimi-k2:free",
              "mistral-small-free": "mistralai/mistral-small-3.1-24b-instruct:free",
              "qwen-vl-free": "qwen/qwen-2.5-vl-7b-instruct:free",
              "gemma-3-27b-free": "google/gemma-3-27b-it:free",
              // NEW models (January 2026)
              "mimo-v2-flash-free": "xiaomi/mimo-v2-flash:free",
              "devstral-2-free": "mistralai/devstral-2-2512:free",
              "deepseek-r1t2-chimera-free": "tngtech/deepseek-r1t2-chimera:free",
              "gemini-2-flash-exp-free": "google/gemini-2.0-flash-exp:free",
              "qwen3-coder-480b-free": "qwen/qwen3-coder-480b-a35b:free",
            };
            const openRouterModelId = openRouterModelMap[selectedModel.id] || "deepseek/deepseek-r1-0528:free";
            
            response = await invokeOpenRouter({
              messages: messagesWithSearch.map(m => ({
                role: m.role as "system" | "user" | "assistant",
                content: m.content,
              })),
              model: openRouterModelId,
              temperature: input.temperature,
            });
          } else if (selectedModel.provider === "groq") {
            // Use Groq API for ultra-fast inference (FREE)
            const groqModelMap: Record<string, string> = {
              "llama-3.1-8b": "llama-3.1-8b-instant",
              "llama-3.1-70b": "llama-3.3-70b-versatile",
              "mixtral-8x7b": "mixtral-8x7b-32768",
              "llama-3.3-70b-groq": "llama-3.3-70b-versatile",
              "gemma2-9b-groq": "gemma2-9b-it",
            };
            const groqModelId = groqModelMap[selectedModel.id] || "llama-3.3-70b-versatile";
            
            // Check if Groq API key is available
            if (process.env.GROQ_API_KEY) {
              const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                  model: groqModelId,
                  messages: messagesWithSearch.map(m => ({
                    role: m.role,
                    content: m.content,
                  })),
                  temperature: input.temperature ?? 0.7,
                  max_tokens: 4096,
                }),
              });
              
              if (!groqResponse.ok) {
                const errorText = await groqResponse.text();
                throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
              }
              
              response = await groqResponse.json();
            } else {
              // Fallback to default LLM if Groq not configured
              response = await invokeLLM({ messages: finalMessages });
            }
          } else if (selectedModel.id === "deepseek-r1-free") {
            // Use DeepSeek R1 via OpenRouter (FREE for complex reasoning)
            // Note: DeepSeek R1 doesn't support vision, fall back to text-only
            response = await invokeDeepSeekR1({
              messages: messagesWithSearch.map(m => ({
                role: m.role as "system" | "user" | "assistant",
                content: m.content,
              })),
              temperature: input.temperature,
            });
          } else if (selectedModel.provider === "grok" && isGrokAvailable()) {
            // Use Grok API for xAI models
            // Note: Grok may not support vision, fall back to text-only
            response = await invokeGrok({
              messages: messagesWithSearch.map(m => ({
                role: m.role as "system" | "user" | "assistant",
                content: m.content,
              })),
              model: selectedModel.id,
              temperature: input.temperature,
            });
          } else {
            // Use default LLM (Manus Forge API) - supports vision
            response = await invokeLLM({
              messages: finalMessages,
            });
          }

          let rawContent = response.choices[0]?.message?.content;
          let assistantContent = typeof rawContent === 'string' ? rawContent : '';
          let usedFallback = false;
          let fallbackMessage = '';
          let actualModelUsed = selectedModel;
          
          // Removed Venice uncensored fallback - no longer using uncensored models
          
          const outputTokens = estimateTokens(assistantContent);
          const totalTokens = inputTokens + outputTokens;
          
          // Calculate estimated cost based on actual model used
          const cost = estimateCost(actualModelUsed, inputTokens, outputTokens);
          
          // Cache the response
          if (input.useCache !== false) {
            setCachedResponse(cacheKey, assistantContent, selectedModel.id);
          }
          
          // Deduct credits based on model tier
          const creditCost = await getCreditCost("chat", actualModelUsed.id);
          const creditDeduction = await deductCredits(
            ctx.user.id,
            creditCost,
            "chat",
            actualModelUsed.id,
            `Chat with ${actualModelUsed.name}`
          );
          
          if (!creditDeduction.success) {
            console.warn("Credit deduction failed:", creditDeduction.error);
          }
          
          // Create usage record
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "chat",
            model: selectedModel.id,
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCost: cost.toFixed(6),
            timestamp: new Date(),
          });
          
          // Create audit log (hash content, don't store it)
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "chat",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(promptContent + assistantContent),
            modelUsed: selectedModel.id,
            promptLength: promptContent.length,
            responseLength: assistantContent.length,
            metadata: JSON.stringify({
              duration: Date.now() - startTime,
              messageCount: input.messages.length,
              tokens: totalTokens,
              complexity,
              routingMode,
              tier: selectedModel.tier,
            }),
            timestamp: new Date(),
          });
          
          // Create detailed API call log (full content for admin review)
          auditLogApiCall({
            userId: ctx.user.id,
            userEmail: ctx.user.email || undefined,
            userName: ctx.user.name || undefined,
            actionType: "chat",
            modelUsed: actualModelUsed.id,
            prompt: promptContent,
            systemPrompt: baseSystemPrompt || undefined,
            response: assistantContent,
            usedFallback: usedFallback,
            tokensInput: inputTokens,
            tokensOutput: outputTokens,
            durationMs: Date.now() - startTime,
            ipAddress: getClientIp(ctx.req),
            userAgent: getUserAgent(ctx.req),
            status: "success",
            isUncensored: actualModelUsed.isUncensored === true || autoSwitchedToUncensored,
          });
          
          // Track provider usage analytics
          trackProviderUsage({
            userId: ctx.user.id,
            provider: actualModelUsed.provider,
            model: actualModelUsed.id,
            modelTier: actualModelUsed.tier as "free" | "standard" | "premium",
            actionType: "chat",
            inputTokens,
            outputTokens,
            totalTokens,
            latencyMs: Date.now() - startTime,
            success: true,
            costSaved: actualModelUsed.tier === "free" ? estimateCostSaved(actualModelUsed.id, inputTokens, outputTokens) : undefined,
          });

          return {
            content: usedFallback ? `${fallbackMessage}\n\n${assistantContent}` : assistantContent,
            model: actualModelUsed.id,
            modelName: actualModelUsed.name,
            tier: actualModelUsed.tier,
            cached: false,
            complexity,
            cost,
            webSearchUsed: webSearchResults.length > 0,
            webSearchResultsCount: webSearchResults.length,
            autoSearchTriggered,
            deepResearchUsed: input.deepResearch && webSearchResults.length > 0,
            sources: input.deepResearch ? webSearchResults.map(r => ({ title: r.title, url: r.url })) : undefined,
            tokens: {
              input: inputTokens,
              output: outputTokens,
              total: totalTokens,
            },
            usedFallback,
            fallbackReason: usedFallback ? "Original model declined - switched to unrestricted model" : undefined,
            autoSwitchedToUncensored,
            creditsUsed: creditCost,
            creditsRemaining: creditDeduction.remainingCredits,
          };
        } catch (error: any) {
          // Log the actual error for debugging
          console.error("[Chat] Error generating response:", error.message || error);
          
          // Log failed attempts too
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "chat",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(promptContent),
            modelUsed: selectedModel.id,
            promptLength: promptContent.length,
            metadata: JSON.stringify({
              error: true,
              errorMessage: error.message || "Unknown error",
              duration: Date.now() - startTime,
              complexity,
              routingMode,
            }),
            timestamp: new Date(),
          });
          
          // Provide more specific error messages
          let errorMessage = "Failed to generate response. Please try again.";
          if (error.message?.includes("API key") || error.message?.includes("not configured")) {
            errorMessage = "AI service temporarily unavailable. Please try again later.";
          } else if (error.message?.includes("rate limit") || error.message?.includes("429")) {
            errorMessage = "Too many requests. Please wait a moment and try again.";
          } else if (error.message?.includes("timeout")) {
            errorMessage = "Request timed out. Please try again.";
          }
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage,
          });
        }
      }),
    
    // Upload image for vision/analysis in chat
    uploadImage: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.string(),
        filename: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.imageBase64, 'base64');
        const ext = input.mimeType.split('/')[1] || 'png';
        const filename = input.filename || `image-${Date.now()}.${ext}`;
        const s3Key = `chat-images/${ctx.user.id}/${Date.now()}-${filename}`;
        
        const { url } = await storagePut(s3Key, buffer, input.mimeType);
        
        // Log the upload
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "document_upload",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({
            filename,
            mimeType: input.mimeType,
            size: buffer.length,
          }),
          timestamp: new Date(),
        });
        
        return { url, filename };
      }),
  }),

  // Image generation endpoint with audit logging
  image: router({
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(2000),
        negativePrompt: z.string().max(1000).optional(),
        model: z.string().optional(),
        aspectRatio: z.string().optional(),
        seed: z.number().optional(),
        steps: z.number().min(10).max(50).optional(),
        cfgScale: z.number().min(1).max(20).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        const imageModel = input.model || "flux";
        
        // Check and deduct credits before generating
        const creditCost = await getCreditCost("image_generation", imageModel);
        const userCreditsBalance = await getUserCredits(ctx.user.id);
        
        if (userCreditsBalance.totalCredits < creditCost) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Insufficient credits. Need ${creditCost}, have ${userCreditsBalance.totalCredits}. Please purchase more credits.`,
          });
        }
        
        // Deduct credits upfront
        const creditDeduction = await deductCredits(
          ctx.user.id,
          creditCost,
          "image_generation",
          imageModel,
          `Image generation with ${imageModel}`
        );
        
        if (!creditDeduction.success) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: creditDeduction.error || "Failed to deduct credits",
          });
        }
        
        try {
          const result = await generateImage({
            prompt: input.prompt,
          });

          // Save generated image to database for admin visibility
          if (result.url) {
            await createGeneratedImage({
              userId: ctx.user.id,
              imageUrl: result.url,
              prompt: input.prompt,
              negativePrompt: input.negativePrompt || null,
              model: input.model || "flux",
              aspectRatio: input.aspectRatio || null,
              seed: input.seed?.toString() || null,
              steps: input.steps || null,
              cfgScale: input.cfgScale?.toString() || null,
              isEdit: false,
              status: "completed",
              metadata: JSON.stringify({
                duration: Date.now() - startTime,
              }),
            });
          }

          // Create usage record for image generation
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "image_generation",
            model: input.model || "flux",
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCost: "0.02",
            timestamp: new Date(),
          });

          // Create audit log
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "image_generation",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(input.prompt),
            modelUsed: input.model || "flux",
            promptLength: input.prompt.length,
            metadata: JSON.stringify({
              duration: Date.now() - startTime,
            }),
            timestamp: new Date(),
          });
          
          // Log image generation for admin review (with full prompt)
          if (result.url) {
            auditLogImageAccess({
              userId: ctx.user.id,
              userEmail: ctx.user.email || undefined,
              imageUrl: result.url,
              prompt: input.prompt,
              actionType: "generate",
              ipAddress: getClientIp(ctx.req),
            });
          }

          return {
            url: result.url,
            model: input.model || "flux",
          };
        } catch (error: any) {
          // Refund credits on failure
          await refundCredits(
            ctx.user.id,
            creditCost,
            `Image generation failed: ${error.message || 'Unknown error'}`
          );
          
          // Save failed generation attempt
          await createGeneratedImage({
            userId: ctx.user.id,
            imageUrl: "",
            prompt: input.prompt,
            negativePrompt: input.negativePrompt || null,
            model: input.model || "flux",
            aspectRatio: input.aspectRatio || null,
            seed: input.seed?.toString() || null,
            steps: input.steps || null,
            cfgScale: input.cfgScale?.toString() || null,
            isEdit: false,
            status: "failed",
            metadata: JSON.stringify({
              error: true,
              duration: Date.now() - startTime,
              refunded: true,
            }),
          });

          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "image_generation",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(input.prompt),
            modelUsed: input.model || "flux",
            promptLength: input.prompt.length,
            metadata: JSON.stringify({
              error: true,
              duration: Date.now() - startTime,
              refunded: true,
            }),
            timestamp: new Date(),
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Image generation failed. Your credits have been refunded.",
          });
        }
      }),
    
    // User's own gallery
    myGallery: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const images = await getUserGeneratedImages(
          ctx.user.id,
          input?.limit ?? 50,
          input?.offset ?? 0
        );
        return images;
      }),
    
    // Delete user's own image
    deleteMyImage: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // First verify the image belongs to this user
        const image = await getGeneratedImageById(input.imageId);
        if (!image || image.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Image not found or you don't have permission to delete it",
          });
        }
        
        await deleteGeneratedImage(input.imageId);
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "settings_change",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({
            action: "delete_own_image",
            imageId: input.imageId,
          }),
          timestamp: new Date(),
        });
        
        return { success: true };
      }),
    
    // Download proxy - fetches image server-side to avoid CORS issues
    downloadProxy: protectedProcedure
      .input(z.object({ imageUrl: z.string().url() }))
      .mutation(async ({ input }) => {
        try {
          const response = await fetch(input.imageUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const contentType = response.headers.get('content-type') || 'image/png';
          return {
            success: true,
            data: `data:${contentType};base64,${base64}`,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to download image",
          });
        }
      }),
  }),

  // Images router for batch operations
  images: router({
    regenerateSingle: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(2000),
        originalUrl: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        // Cost: 1 credit for single image regeneration
        const creditCost = 1;
        const userCreditsBalance = await getUserCredits(ctx.user.id);
        
        if (userCreditsBalance.totalCredits < creditCost) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Insufficient credits. Need ${creditCost}, have ${userCreditsBalance.totalCredits}. Please purchase more credits.`,
          });
        }
        
        // Deduct credits upfront
        const creditDeduction = await deductCredits(
          ctx.user.id,
          creditCost,
          "image_regeneration",
          "hidream",
          `Single image regeneration`
        );
        
        if (!creditDeduction.success) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: creditDeduction.error || "Failed to deduct credits",
          });
        }
        
        try {
          // Generate new image with a random seed for variation
          const result = await generateImage({
            prompt: input.prompt,
          });
          
          // Save generated image to database
          await createGeneratedImage({
            userId: ctx.user.id,
            imageUrl: result.url,
            prompt: input.prompt,
            negativePrompt: null,
            model: 'runware-flux',
            aspectRatio: '1024x1024',
            seed: null,
            steps: null,
            cfgScale: null,
            isEdit: false,
            status: "completed",
            metadata: JSON.stringify({
              duration: Date.now() - startTime,
              type: 'regeneration',
              originalUrl: input.originalUrl,
            }),
          });
          
          // Create audit log
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "image_generation",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(input.prompt),
            modelUsed: 'hidream',
            promptLength: input.prompt.length,
            timestamp: new Date(),
          });
          
          return {
            url: result.url,
            prompt: input.prompt,
            creditCost,
          };
        } catch (error: any) {
          console.error('[Image Regeneration] Error:', error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to regenerate image",
          });
        }
      }),
  }),

  // User settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getUserSettings(ctx.user.id);
      return settings || {
        preferredModel: "auto",
        routingMode: "auto",
        theme: "dark",
        enableCache: true,
      };
    }),
    
    update: protectedProcedure
      .input(z.object({
        preferredModel: z.string().optional(),
        theme: z.enum(["light", "dark", "system"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertUserSettings(ctx.user.id, input);
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "settings_change",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          timestamp: new Date(),
        });
        
        return { success: true };
      }),
  }),

  // Documents (RAG)
  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDocuments(ctx.user.id);
    }),
    
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        content: z.string(),
        mimeType: z.string(),
        isBase64: z.boolean().optional(), // For PDF uploads
      }))
      .mutation(async ({ ctx, input }) => {
        const isPdf = input.mimeType === 'application/pdf';
        let storageUrl = "local://" + input.filename;
        let fileSize = input.content.length;
        
        // For PDFs, upload to S3 and use LLM for text extraction
        if (isPdf && input.isBase64) {
          const buffer = Buffer.from(input.content, 'base64');
          fileSize = buffer.length;
          const s3Key = `documents/${ctx.user.id}/${Date.now()}-${input.filename}`;
          const { url } = await storagePut(s3Key, buffer, 'application/pdf');
          storageUrl = url;
        }
        
        // Create document record
        const docId = await createUserDocument({
          userId: ctx.user.id,
          filename: input.filename,
          originalName: input.filename,
          mimeType: input.mimeType,
          fileSize,
          storageUrl,
          status: "processing",
        });
        
        let chunkTexts: string[] = [];
        
        if (isPdf) {
          // For PDFs, we'll process them on-demand during chat using LLM file_url
          // Store a single chunk indicating it's a PDF
          chunkTexts = [`[PDF Document: ${input.filename}]\n\nThis document will be analyzed directly by the AI when you ask questions about it.`];
        } else {
          // Simple text chunking for text files (split by paragraphs, ~500 chars each)
          const paragraphs = input.content.split(/\n\n+/);
          let currentChunk = "";
          
          for (const para of paragraphs) {
            if (currentChunk.length + para.length > 500) {
              if (currentChunk) chunkTexts.push(currentChunk.trim());
              currentChunk = para;
            } else {
              currentChunk += (currentChunk ? "\n\n" : "") + para;
            }
          }
          if (currentChunk) chunkTexts.push(currentChunk.trim());
        }
        
        // Generate embeddings for each chunk (for semantic search)
        let embeddings: (string | null)[] = [];
        try {
          const { generateEmbeddings } = await import('./_core/embeddings');
          const embeddingVectors = await generateEmbeddings(chunkTexts);
          embeddings = embeddingVectors.map(v => JSON.stringify(v));
          console.log(`[Knowledge Base] Generated ${embeddings.length} embeddings for ${input.filename}`);
        } catch (error) {
          console.warn('[Knowledge Base] Failed to generate embeddings, falling back to text search:', error);
          embeddings = chunkTexts.map(() => null);
        }
        
        // Store chunks with embeddings
        const chunksToInsert = chunkTexts.map((content, index) => ({
          documentId: docId,
          userId: ctx.user.id,
          chunkIndex: index,
          content,
          embedding: embeddings[index],
        }));
        await createDocumentChunks(chunksToInsert);
        
        // Update status
        await updateDocumentStatus(docId, "ready", storageUrl, chunkTexts.length);
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "document_upload",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({
            filename: input.filename,
            size: fileSize,
            chunks: chunkTexts.length,
            isPdf,
          }),
          timestamp: new Date(),
        });
        
        return { id: docId, chunks: chunkTexts.length, isPdf };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteUserDocument(ctx.user.id, input.id);
        return { success: true };
      }),
    
    chat: protectedProcedure
      .input(z.object({
        documentId: z.number(),
        question: z.string(),
        routingMode: z.enum(["auto", "free", "manual"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        // Get document
        const doc = await getDocumentById(ctx.user.id, input.documentId);
        if (!doc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
        }
        
        const isPdf = doc.mimeType === 'application/pdf';
        
        // Determine routing
        const routingMode = (input.routingMode || "auto") as RoutingMode;
        const messages = [
          { role: "user" as const, content: input.question }
        ];
        const complexity = analyzeQueryComplexity(messages);
        const selectedModel = selectModel(complexity, routingMode);
        
        let ragMessages: any[];
        let chunksUsed = 0;
        
        if (isPdf && doc.storageUrl && doc.storageUrl.startsWith('http')) {
          // For PDFs, use the LLM's native file_url support
          ragMessages = [
            {
              role: "system" as const,
              content: `You are a helpful assistant answering questions about a PDF document titled "${doc.filename}". Analyze the document and answer the user's question based on its content. If the answer is not in the document, say so.`,
            },
            {
              role: "user" as const,
              content: [
                {
                  type: "file_url",
                  file_url: {
                    url: doc.storageUrl,
                    mime_type: "application/pdf",
                  },
                },
                {
                  type: "text",
                  text: input.question,
                },
              ],
            },
          ];
          chunksUsed = 1; // PDF counts as 1 source
        } else {
          // For text files, use traditional RAG with chunks
          const chunks = await searchDocumentChunks(ctx.user.id, input.question);
          const context = chunks.slice(0, 3).map(c => c.content).join("\n\n---\n\n");
          chunksUsed = chunks.length;
          
          ragMessages = [
            {
              role: "system" as const,
              content: `You are a helpful assistant answering questions about a document. Use the following context to answer the user's question. If the answer is not in the context, say so.\n\nContext from "${doc.filename}":\n${context}`,
            },
            {
              role: "user" as const,
              content: input.question,
            },
          ];
        }
        
        try {
          const response = await invokeLLM({ messages: ragMessages });
          const rawContent = response.choices[0]?.message?.content;
          const answer = typeof rawContent === 'string' ? rawContent : '';
          
          // Estimate tokens (rough for PDF since we don't know exact content)
          const inputTokens = isPdf ? 5000 : ragMessages.reduce((acc, m) => {
            if (typeof m.content === 'string') return acc + estimateTokens(m.content);
            return acc + 100; // Rough estimate for file content
          }, 0);
          const outputTokens = estimateTokens(answer);
          const cost = estimateCost(selectedModel, inputTokens, outputTokens);
          
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "document_chat",
            model: selectedModel.id,
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            estimatedCost: cost.toFixed(6),
            timestamp: new Date(),
          });
          
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "document_chat",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(input.question + answer),
            modelUsed: selectedModel.id,
            promptLength: input.question.length,
            responseLength: answer.length,
            metadata: JSON.stringify({
              documentId: input.documentId,
              chunksUsed,
              isPdf,
              duration: Date.now() - startTime,
            }),
            timestamp: new Date(),
          });
          
          return {
            answer,
            model: selectedModel.id,
            modelName: selectedModel.name,
            tier: selectedModel.tier,
            sourcesUsed: chunksUsed,
            cost,
            isPdf,
          };
        } catch (error) {
          console.error("Document chat error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process document question",
          });
        }
      }),
    
    // Multi-document chat
    multiChat: protectedProcedure
      .input(z.object({
        documentIds: z.array(z.number()).min(1).max(10),
        question: z.string(),
        routingMode: z.enum(["auto", "free", "manual"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        // Get all documents
        const docs = await Promise.all(
          input.documentIds.map(id => getDocumentById(ctx.user.id, id))
        );
        
        const validDocs = docs.filter((d): d is NonNullable<typeof d> => d !== null);
        if (validDocs.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No valid documents found" });
        }
        
        // Check for PDFs - we'll handle them differently
        const pdfDocs = validDocs.filter(d => d.mimeType === 'application/pdf');
        const textDocs = validDocs.filter(d => d.mimeType !== 'application/pdf');
        
        // Determine routing
        const routingMode = (input.routingMode || "auto") as RoutingMode;
        const messages = [{ role: "user" as const, content: input.question }];
        const complexity = analyzeQueryComplexity(messages);
        const selectedModel = selectModel(complexity, routingMode);
        
        let ragMessages: any[];
        let chunksUsed = 0;
        
        // Build context from all documents
        let combinedContext = "";
        const docNames: string[] = [];
        
        // Get chunks from text documents
        if (textDocs.length > 0) {
          const chunks = await searchDocumentChunks(ctx.user.id, input.question, 10);
          // Filter chunks to only include those from selected documents
          const relevantChunks = chunks.filter(c => 
            input.documentIds.includes(c.documentId)
          );
          combinedContext = relevantChunks.slice(0, 6).map(c => 
            `[From ${c.documentName || 'Document'}]:\n${c.content}`
          ).join("\n\n---\n\n");
          chunksUsed = relevantChunks.length;
          textDocs.forEach(d => docNames.push(d.filename));
        }
        
        // For PDFs, we need to use file_url approach
        // If there are PDFs, we'll include them as file attachments
        if (pdfDocs.length > 0 && pdfDocs.some(d => d.storageUrl?.startsWith('http'))) {
          const pdfContent = pdfDocs.map(d => ({
            type: "file_url" as const,
            file_url: {
              url: d.storageUrl,
              mime_type: "application/pdf",
            },
          }));
          pdfDocs.forEach(d => docNames.push(d.filename));
          chunksUsed += pdfDocs.length;
          
          ragMessages = [
            {
              role: "system" as const,
              content: `You are a helpful assistant answering questions about multiple documents: ${docNames.join(", ")}. Analyze all provided documents and answer the user's question based on their combined content. If the answer is not in any document, say so. When referencing information, mention which document it came from.${combinedContext ? `\n\nText document context:\n${combinedContext}` : ''}`,
            },
            {
              role: "user" as const,
              content: [
                ...pdfContent,
                {
                  type: "text" as const,
                  text: input.question,
                },
              ],
            },
          ];
        } else {
          // Text-only documents
          ragMessages = [
            {
              role: "system" as const,
              content: `You are a helpful assistant answering questions about multiple documents: ${docNames.join(", ")}. Use the following context from these documents to answer the user's question. If the answer is not in the context, say so. When referencing information, mention which document it came from.\n\nContext:\n${combinedContext}`,
            },
            {
              role: "user" as const,
              content: input.question,
            },
          ];
        }
        
        try {
          const response = await invokeLLM({ messages: ragMessages });
          const rawContent = response.choices[0]?.message?.content;
          const answer = typeof rawContent === 'string' ? rawContent : '';
          
          // Estimate tokens
          const inputTokens = pdfDocs.length > 0 ? 5000 * pdfDocs.length : ragMessages.reduce((acc, m) => {
            if (typeof m.content === 'string') return acc + estimateTokens(m.content);
            return acc + 100;
          }, 0);
          const outputTokens = estimateTokens(answer);
          const cost = estimateCost(selectedModel, inputTokens, outputTokens);
          
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "document_chat",
            model: selectedModel.id,
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            estimatedCost: cost.toFixed(6),
            timestamp: new Date(),
          });
          
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "document_chat",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(input.question + answer),
            modelUsed: selectedModel.id,
            promptLength: input.question.length,
            responseLength: answer.length,
            metadata: JSON.stringify({
              documentIds: input.documentIds,
              documentCount: validDocs.length,
              chunksUsed,
              hasPdfs: pdfDocs.length > 0,
              duration: Date.now() - startTime,
            }),
            timestamp: new Date(),
          });
          
          return {
            answer,
            model: selectedModel.id,
            modelName: selectedModel.name,
            tier: selectedModel.tier,
            sourcesUsed: chunksUsed,
            documentsUsed: validDocs.length,
            cost,
          };
        } catch (error) {
          console.error("Multi-document chat error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process multi-document question",
          });
        }
      }),
    
    // ChromaDB Vector Search Endpoints
    vectorSearch: protectedProcedure
      .input(z.object({
        query: z.string().min(1),
        documentId: z.number().optional(),
        maxResults: z.number().min(1).max(20).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const results = await searchSimilarChunks(ctx.user.id.toString(), input.query, {
            nResults: input.maxResults || 5,
            documentId: input.documentId?.toString(),
          });
          
          return {
            results: results.map(r => ({
              text: r.text,
              score: r.score,
              documentId: r.metadata.documentId,
              filename: r.metadata.filename,
            })),
            count: results.length,
          };
        } catch (error) {
          console.error('[ChromaDB] Search error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Vector search failed',
          });
        }
      }),
    
    // Index document in ChromaDB
    indexInChroma: protectedProcedure
      .input(z.object({
        documentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const doc = await getDocumentById(ctx.user.id, input.documentId);
        if (!doc) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
        }
        
        // Get document chunks
        const chunks = await getDocumentChunks(input.documentId);
        const fullText = chunks.map(c => c.content).join('\n\n');
        
        try {
          const result = await addDocumentToChroma(
            ctx.user.id.toString(),
            input.documentId.toString(),
            fullText,
            {
              filename: doc.filename,
              title: doc.originalName,
            }
          );
          
          return {
            success: true,
            chunksAdded: result.chunksAdded,
            collectionName: result.collectionName,
          };
        } catch (error) {
          console.error('[ChromaDB] Index error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to index document',
          });
        }
      }),
    
    // Get RAG context for a query
    getRAGContext: protectedProcedure
      .input(z.object({
        query: z.string().min(1),
        documentId: z.number().optional(),
        maxResults: z.number().min(1).max(10).optional(),
        maxTokens: z.number().min(100).max(4000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await getRAGContext(ctx.user.id.toString(), input.query, {
            maxResults: input.maxResults || 5,
            maxTokens: input.maxTokens || 2000,
            documentId: input.documentId?.toString(),
          });
          
          return result;
        } catch (error) {
          console.error('[ChromaDB] RAG context error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get RAG context',
          });
        }
      }),
    
    // Get ChromaDB collection stats
    getVectorStats: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const stats = await getCollectionStats(ctx.user.id.toString());
          return stats;
        } catch (error) {
          console.error('[ChromaDB] Stats error:', error);
          return { name: '', count: 0, metadata: {} };
        }
      }),
    
    // Delete document from ChromaDB
    removeFromChroma: protectedProcedure
      .input(z.object({
        documentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await deleteDocumentFromChroma(ctx.user.id.toString(), input.documentId.toString());
          return { success: true };
        } catch (error) {
          console.error('[ChromaDB] Delete error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to remove document from vector store',
          });
        }
      }),
  }),

  // AI Characters
  characters: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCharacters(ctx.user.id);
    }),

    listPublic: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ input }) => {
        return await getPublicCharacters(input?.limit || 50);
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const character = await getCharacterById(input.id, ctx.user?.id);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Character not found" });
        }
        return character;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(1000).optional(),
        systemPrompt: z.string().min(1).max(5000),
        avatarUrl: z.string().url().optional(),
        personality: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const characterId = await createCharacter({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || null,
          systemPrompt: input.systemPrompt,
          avatarUrl: input.avatarUrl || null,
          personality: input.personality || null,
          isPublic: input.isPublic || false,
        });
        return { id: characterId, success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        systemPrompt: z.string().min(1).max(5000).optional(),
        avatarUrl: z.string().url().optional().nullable(),
        personality: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateCharacter(id, ctx.user.id, updates);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCharacter(input.id, ctx.user.id);
        return { success: true };
      }),

    use: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacterById(input.id, ctx.user.id);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Character not found" });
        }
        await incrementCharacterUsage(input.id);
        return { systemPrompt: character.systemPrompt, name: character.name };
      }),
  }),

  // Shared Links
  shareLinks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSharedLinks(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        encryptedData: z.string(),
        title: z.string().max(255).optional(),
        expiresInHours: z.number().min(1).max(720).optional(),
        maxViews: z.number().min(1).max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const shareId = crypto.randomBytes(16).toString("hex");
        const expiresAt = input.expiresInHours 
          ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
          : null;

        await createSharedLink({
          userId: ctx.user.id,
          shareId,
          encryptedData: input.encryptedData,
          title: input.title || null,
          expiresAt,
          maxViews: input.maxViews || null,
        });

        return { shareId, success: true };
      }),

    get: publicProcedure
      .input(z.object({ shareId: z.string() }))
      .query(async ({ input }) => {
        const link = await getSharedLinkByShareId(input.shareId);
        if (!link) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found" });
        }
        if (!link.isActive) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This link has been deactivated" });
        }
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This link has expired" });
        }
        if (link.maxViews && link.viewCount >= link.maxViews) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This link has reached its view limit" });
        }

        await incrementShareLinkViews(input.shareId);

        return {
          encryptedData: link.encryptedData,
          title: link.title,
          createdAt: link.createdAt,
        };
      }),

    deactivate: protectedProcedure
      .input(z.object({ shareId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deactivateSharedLink(input.shareId, ctx.user.id);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ shareId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSharedLink(input.shareId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Admin endpoints
  admin: router({
    auditLogs: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        actionType: z.string().optional(),
        userId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getAuditLogs({
          limit: input?.limit || 50,
          offset: input?.offset || 0,
          actionType: input?.actionType,
          userId: input?.userId,
          startDate: input?.startDate,
          endDate: input?.endDate,
        });
      }),
    
    auditStats: adminProcedure.query(async () => {
      return await getAuditLogStats();
    }),
    
    // Dashboard stats - comprehensive metrics
    dashboardStats: adminProcedure.query(async () => {
      const allUsers = await getAllUsers();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // User stats
      const totalUsers = allUsers.length;
      const newUsersToday = allUsers.filter(u => new Date(u.createdAt) >= today).length;
      const newUsersLast7Days = allUsers.filter(u => new Date(u.createdAt) >= last7Days).length;
      const activeUsersLast7Days = allUsers.filter(u => u.lastSignedIn && new Date(u.lastSignedIn) >= last7Days).length;
      
      // Subscription breakdown
      const subscriptionBreakdown = {
        free: allUsers.filter(u => !u.subscriptionTier || u.subscriptionTier === 'free').length,
        starter: allUsers.filter(u => u.subscriptionTier === 'starter').length,
        pro: allUsers.filter(u => u.subscriptionTier === 'pro').length,
        unlimited: allUsers.filter(u => u.subscriptionTier === 'unlimited').length,
      };
      
      // Revenue calculation (MRR)
      const mrr = 
        subscriptionBreakdown.starter * 4.99 +
        subscriptionBreakdown.pro * 14.99 +
        subscriptionBreakdown.unlimited * 27.99;
      
      // Usage stats
      const totalQueriesToday = allUsers.reduce((sum, u) => sum + (u.dailyQueries || 0), 0);
      
      // Top users by usage
      const topUsersByQueries = [...allUsers]
        .sort((a, b) => (b.dailyQueries || 0) - (a.dailyQueries || 0))
        .slice(0, 5)
        .map(u => ({
          name: u.name || 'Anonymous',
          queries: u.dailyQueries || 0,
          tier: u.subscriptionTier || 'free',
        }));
      
      return {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newLast7Days: newUsersLast7Days,
          activeLast7Days: activeUsersLast7Days,
        },
        subscriptions: subscriptionBreakdown,
        revenue: {
          mrr: Math.round(mrr * 100) / 100,
          projectedArr: Math.round(mrr * 12 * 100) / 100,
          paidUsers: subscriptionBreakdown.starter + subscriptionBreakdown.pro + subscriptionBreakdown.unlimited,
          conversionRate: totalUsers > 0 
            ? Math.round((subscriptionBreakdown.starter + subscriptionBreakdown.pro + subscriptionBreakdown.unlimited) / totalUsers * 10000) / 100 
            : 0,
        },
        usage: {
          queriesToday: totalQueriesToday,
        },
        topUsers: topUsersByQueries,
      };
    }),
    
    users: adminProcedure.query(async () => {
      return await getAllUsers();
    }),
    
    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserRole(input.userId, input.role);
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "settings_change",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({
            action: "update_role",
            targetUserId: input.userId,
            newRole: input.role,
          }),
          timestamp: new Date(),
        });
        
        return { success: true };
      }),
    
    // Generated Images endpoints for admin
    generatedImages: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        userId: z.number().optional(),
        status: z.enum(["completed", "failed"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getAllGeneratedImages({
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
          userId: input?.userId,
          status: input?.status,
          startDate: input?.startDate,
          endDate: input?.endDate,
        });
      }),
    
    generatedImageStats: adminProcedure.query(async () => {
      return await getGeneratedImageStats();
    }),
    
    generatedImageById: adminProcedure
      .input(z.object({ imageId: z.number() }))
      .query(async ({ input }) => {
        return await getGeneratedImageById(input.imageId);
      }),
    
    deleteGeneratedImage: adminProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteGeneratedImage(input.imageId);
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "settings_change",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({
            action: "delete_generated_image",
            imageId: input.imageId,
          }),
          timestamp: new Date(),
        });
        
        return { success: true };
      }),
    
    // Get user details with activity
    userDetails: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.id === input.userId);
        if (!user) return null;
        
        // Get user's generated images
        const images = await getUserGeneratedImages(input.userId, 20);
        
        // Get user's audit logs
        const auditData = await getAuditLogs({
          userId: input.userId,
          limit: 20,
        });
        
        return {
          user,
          images,
          recentActivity: auditData.logs,
        };
      }),
    
    // Provider Analytics endpoints
    providerStats: adminProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getProviderStats } = await import("./_core/providerAnalytics");
        const now = new Date();
        const startDate = input?.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input?.endDate || now;
        return await getProviderStats(startDate, endDate);
      }),
    
    popularModels: adminProcedure
      .input(z.object({
        days: z.number().min(1).max(90).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getPopularModels } = await import("./_core/providerAnalytics");
        return await getPopularModels(input?.days || 7);
      }),
    
    costSavings: adminProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getCostSavings } = await import("./_core/providerAnalytics");
        const now = new Date();
        const startDate = input?.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input?.endDate || now;
        return await getCostSavings(startDate, endDate);
      }),
    
    usageTrend: adminProcedure
      .input(z.object({
        days: z.number().min(1).max(90).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getUsageTrend } = await import("./_core/providerAnalytics");
        return await getUsageTrend(input?.days || 30);
      }),
  }),

  // Web Search using Data API
  webSearch: router({
    search: protectedProcedure
      .input(z.object({
        query: z.string().min(1).max(500),
        limit: z.number().min(1).max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Use DuckDuckGo Instant Answers API (free, no API key required)
          const ddgResults = await searchDuckDuckGo(input.query);
          
          const formattedResults = ddgResults.slice(0, input.limit || 5).map(r => ({
            title: r.title || '',
            url: r.url || '',
            description: r.description || '',
          }));
          
          return {
            results: formattedResults,
            query: input.query,
          };
        } catch (error) {
          console.error("Web search error:", error);
          // Return empty results on error rather than failing
          return {
            results: [],
            query: input.query,
            error: "Search temporarily unavailable",
          };
        }
      }),
    
    // Perplexity-style search with AI-generated summary and citations
    searchWithCitations: protectedProcedure
      .input(z.object({
        query: z.string().min(1).max(500),
        maxSources: z.number().min(1).max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Step 1: Search the web using DuckDuckGo
          const ddgResults = await searchDuckDuckGo(input.query);
          const maxSources = input.maxSources || 5;
          
          // Extract top sources
          const sources = ddgResults.slice(0, maxSources).map((result, index) => ({
            title: result.title || `Source ${index + 1}`,
            url: result.url || '',
            snippet: result.description || '',
            position: index + 1,
          }));
          
          if (sources.length === 0) {
            return {
              query: input.query,
              summary: "No search results found for this query.",
              sources: [],
              citations: [],
            };
          }
          
          // Step 2: Build context from search results
          const searchContext = sources.map((source, i) => 
            `[${i + 1}] ${source.title}\nURL: ${source.url}\n${source.snippet}`
          ).join('\n\n');
          
          // Step 3: Generate AI summary with citations
          const systemPrompt = `You are a helpful research assistant. Your task is to answer the user's question based on the provided search results.

IMPORTANT RULES:
1. Use ONLY information from the provided search results
2. Include inline citations like [1], [2], etc. to reference your sources
3. Be concise but comprehensive
4. If the search results don't contain enough information, say so
5. Format your response in clear paragraphs
6. Do NOT make up information not in the sources`;

          const userPrompt = `Question: ${input.query}\n\nSearch Results:\n${searchContext}\n\nPlease provide a comprehensive answer with inline citations [1], [2], etc.`;
          
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            maxTokens: 1024,
          });
          
          const messageContent = response.choices[0]?.message?.content;
          const summary = typeof messageContent === 'string' 
            ? messageContent 
            : Array.isArray(messageContent) 
              ? messageContent.map((c: any) => 'text' in c ? c.text : '').join('')
              : 'Unable to generate summary.';
          
          // Extract citations used in the response
          const citationMatches = summary.match(/\[\d+\]/g) || [];
          const citations = Array.from(new Set(citationMatches));
          
          // Create audit log
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: 'chat',
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers['user-agent'] || null,
            metadata: JSON.stringify({
              type: 'search_with_citations',
              query: input.query,
              sourcesCount: sources.length,
            }),
            timestamp: new Date(),
          });
          
          return {
            query: input.query,
            summary,
            sources,
            citations,
          };
        } catch (error) {
          console.error('Search with citations error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to perform search with citations',
          });
        }
      }),
  }),

  // Voice Transcription using Whisper API
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string().url(),
        language: z.string().optional(),
        prompt: z.string().optional(),
        provider: z.enum(["default", "groq"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let result;
        
        // Use Groq Whisper V3 Turbo if specified
        if (input.provider === "groq") {
          const { transcribeWithGroq } = await import("./_core/groqWhisper");
          const userApiKeys = await getUserApiKeys(ctx.user.id);
          const groqKey = userApiKeys.find(k => k.provider === "groq" && k.isActive);
          
          result = await transcribeWithGroq({
            audioUrl: input.audioUrl,
            language: input.language,
            prompt: input.prompt,
            apiKey: groqKey?.apiKey,
          });
        } else {
          // Use default transcription service
          result = await transcribeAudio({
            audioUrl: input.audioUrl,
            language: input.language,
            prompt: input.prompt,
          });
        }
        
        // Check if it's an error
        if ('error' in result) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
          });
        }
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "chat",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({
            type: "voice_transcription",
            duration: result.duration,
            language: result.language,
          }),
          timestamp: new Date(),
        });
        
        return result;
      }),
    
    uploadAndTranscribe: protectedProcedure
      .input(z.object({
        audioBase64: z.string(),
        mimeType: z.string(),
        language: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.audioBase64, 'base64');
        const filename = `audio/${ctx.user.id}/${Date.now()}.${input.mimeType.split('/')[1] || 'webm'}`;
        
        const { url } = await storagePut(filename, buffer, input.mimeType);
        
        // Transcribe the uploaded audio
        const result = await transcribeAudio({
          audioUrl: url,
          language: input.language,
        });
        
        if ('error' in result) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
          });
        }
        
        return result;
      }),
    
    // Edge TTS - Text-to-Speech (FREE)
    speak: protectedProcedure
      .input(z.object({
        text: z.string().min(1).max(5000),
        voice: z.string().optional(),
        rate: z.string().optional(), // e.g., '+10%', '-20%'
        pitch: z.string().optional(), // e.g., '+5Hz', '-10Hz'
        volume: z.string().optional(), // e.g., '+10%', '-20%'
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await generateSpeechBase64(input.text, {
            voice: input.voice,
            rate: input.rate,
            pitch: input.pitch,
            volume: input.volume,
          });
          
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "chat",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            metadata: JSON.stringify({
              type: "text_to_speech",
              voice: input.voice || 'auto',
              textLength: input.text.length,
            }),
            timestamp: new Date(),
          });
          
          return result;
        } catch (error) {
          console.error('[EdgeTTS] Error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to generate speech',
          });
        }
      }),
    
    // Get available TTS voices
    getVoices: publicProcedure
      .input(z.object({
        language: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input?.language) {
          return getVoicesForLanguage(input.language);
        }
        return getAllVoices();
      }),
    
    // Check if Edge TTS is available
    checkTTSAvailable: publicProcedure
      .query(async () => {
        const available = await isEdgeTTSAvailable();
        return { available, provider: 'edge-tts' };
      }),
  }),

  // Owner Notifications
  notifications: router({
    notifyNewUser: protectedProcedure
      .input(z.object({
        userName: z.string(),
        userEmail: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const success = await notifyOwner({
          title: "New User Registration - Chofesh.ai",
          content: `A new user has registered:\n\nName: ${input.userName}\nEmail: ${input.userEmail || 'Not provided'}\nTime: ${new Date().toISOString()}`,
        });
        return { success };
      }),
    
    notifyMilestone: adminProcedure
      .input(z.object({
        milestone: z.string(),
        details: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const success = await notifyOwner({
          title: `Milestone Reached - ${input.milestone}`,
          content: input.details || `Milestone: ${input.milestone}`,
        });
        return { success };
      }),
    
    notifyError: protectedProcedure
      .input(z.object({
        errorType: z.string(),
        errorMessage: z.string(),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const success = await notifyOwner({
          title: `Error Alert - ${input.errorType}`,
          content: `Error: ${input.errorMessage}\n\nContext: ${input.context || 'None'}\nUser: ${ctx.user.name || ctx.user.openId}\nTime: ${new Date().toISOString()}`,
        });
        return { success };
      }),
  }),

  // Image Editing
  imageEdit: router({
    edit: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(2000),
        originalImageUrl: z.string().url(),
        originalImageMimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        try {
          const result = await generateImage({
            prompt: input.prompt,
            originalImages: [{
              url: input.originalImageUrl,
              mimeType: input.originalImageMimeType || 'image/png',
            }],
          });
          
          // Save edited image to database for admin visibility
          if (result.url) {
            await createGeneratedImage({
              userId: ctx.user.id,
              imageUrl: result.url,
              prompt: input.prompt,
              model: "flux-edit",
              isEdit: true,
              originalImageUrl: input.originalImageUrl,
              status: "completed",
              metadata: JSON.stringify({
                type: "image_edit",
                duration: Date.now() - startTime,
              }),
            });
          }

          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "image_generation",
            model: "flux-edit",
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCost: "0.03",
            timestamp: new Date(),
          });
          
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "image_generation",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(input.prompt),
            modelUsed: "flux-edit",
            promptLength: input.prompt.length,
            metadata: JSON.stringify({
              type: "image_edit",
              duration: Date.now() - startTime,
            }),
            timestamp: new Date(),
          });
          
          // Log image edit for admin review (with full prompt)
          if (result.url) {
            auditLogImageAccess({
              userId: ctx.user.id,
              userEmail: ctx.user.email || undefined,
              imageUrl: result.url,
              prompt: input.prompt,
              actionType: "generate",
              ipAddress: getClientIp(ctx.req),
            });
          }
          
          return {
            url: result.url,
            model: "flux-edit",
          };
        } catch (error) {
          // Save failed edit attempt
          await createGeneratedImage({
            userId: ctx.user.id,
            imageUrl: "",
            prompt: input.prompt,
            model: "flux-edit",
            isEdit: true,
            originalImageUrl: input.originalImageUrl,
            status: "failed",
            metadata: JSON.stringify({
              type: "image_edit",
              error: true,
              duration: Date.now() - startTime,
            }),
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to edit image",
          });
        }
      }),
  }),

  // Subscription Management
  subscription: router({
    // Get current user's subscription info
    current: protectedProcedure.query(async ({ ctx }) => {
      const tier = (ctx.user.subscriptionTier || "free") as SubscriptionTier;
      const tierInfo = SUBSCRIPTION_TIERS[tier];
      const dailyLimit = getDailyLimit(tier);
      const dailyQueries = ctx.user.dailyQueries || 0;
      const isSlowedDown = isOverLimit(tier, dailyQueries);
      const slowdownDelay = getSlowdownDelay(tier, dailyQueries);
      
      return {
        tier,
        tierInfo,
        dailyLimit,
        dailyQueries,
        queriesRemaining: dailyLimit === Infinity ? Infinity : Math.max(0, dailyLimit - dailyQueries),
        isSlowedDown,
        slowdownDelay,
        subscriptionStatus: ctx.user.subscriptionStatus || "none",
        stripeCustomerId: ctx.user.stripeCustomerId,
      };
    }),

    // Get all available tiers
    tiers: publicProcedure.query(() => {
      return Object.entries(SUBSCRIPTION_TIERS).map(([key, value]) => ({
        id: key,
        ...value,
        price: value.price / 100, // Convert cents to dollars
      }));
    }),

    // Create checkout session for upgrade
    createCheckout: protectedProcedure
      .input(z.object({
        tier: z.enum(["starter", "pro", "unlimited"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const stripe = new Stripe(process.env.Secretkey_live_stripe || process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2025-12-15.clover",
        });

        const tierConfig = SUBSCRIPTION_TIERS[input.tier];
        if (!tierConfig || !("priceId" in tierConfig) || !tierConfig.priceId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid tier or price not configured",
          });
        }

        const origin = ctx.req.headers.origin || "https://chofesh.ai";

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: tierConfig.priceId,
              quantity: 1,
            },
          ],
          success_url: `${origin}/settings?subscription=success`,
          cancel_url: `${origin}/settings?subscription=canceled`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          allow_promotion_codes: true,
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
          },
        });

        return { checkoutUrl: session.url };
      }),

    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription to cancel",
        });
      }

      const stripe = new Stripe(process.env.Secretkey_live_stripe || process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2025-12-15.clover",
      });

      await stripe.subscriptions.update(ctx.user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      return { success: true, message: "Subscription will be canceled at end of billing period" };
    }),

    // Get billing portal URL
    billingPortal: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No billing account found",
        });
      }

      const stripe = new Stripe(process.env.Secretkey_live_stripe || process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2025-12-15.clover",
      });

      const origin = ctx.req.headers.origin || "https://chofesh.ai";

      const session = await stripe.billingPortal.sessions.create({
        customer: ctx.user.stripeCustomerId,
        return_url: `${origin}/settings`,
      });

      return { portalUrl: session.url };
    }),
  }),

  // User Memories
  memories: router({
    list: protectedProcedure
      .input(z.object({
        category: z.enum(["preference", "fact", "context", "instruction"]).optional(),
        activeOnly: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserMemories(
          ctx.user.id,
          input?.category,
          input?.activeOnly ?? true
        );
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const memory = await getMemoryById(input.id, ctx.user.id);
        if (!memory) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Memory not found" });
        }
        return memory;
      }),

    create: protectedProcedure
      .input(z.object({
        content: z.string().min(1).max(2000),
        category: z.enum(["preference", "fact", "context", "instruction"]).optional(),
        importance: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createMemory({
          userId: ctx.user.id,
          content: input.content,
          category: input.category || "fact",
          importance: input.importance || "medium",
          source: "user",
        });
        return { id, success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().min(1).max(2000).optional(),
        category: z.enum(["preference", "fact", "context", "instruction"]).optional(),
        importance: z.enum(["low", "medium", "high"]).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateMemory(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteMemory(input.id, ctx.user.id);
        return { success: true };
      }),

    getForContext: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(20).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getActiveMemoriesForContext(ctx.user.id, input?.limit || 10);
      }),
  }),

  // Artifacts
  artifacts: router({
    list: protectedProcedure
      .input(z.object({
        type: z.enum(["document", "code", "table", "diagram", "markdown"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserArtifacts(ctx.user.id, input?.type);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const artifact = await getArtifactById(input.id, ctx.user.id);
        if (!artifact) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Artifact not found" });
        }
        return artifact;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        type: z.enum(["document", "code", "table", "diagram", "markdown"]),
        content: z.string(),
        language: z.string().optional(),
        conversationId: z.string().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createArtifact({
          userId: ctx.user.id,
          title: input.title,
          type: input.type,
          content: input.content,
          language: input.language,
          conversationId: input.conversationId,
          metadata: input.metadata,
        });
        return { id, success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
        language: z.string().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateArtifact(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteArtifact(input.id, ctx.user.id);
        return { success: true };
      }),

    createVersion: protectedProcedure
      .input(z.object({
        originalId: z.number(),
        newContent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createArtifactVersion(input.originalId, ctx.user.id, input.newContent);
        return { id, success: true };
      }),

    getVersionHistory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getArtifactVersionHistory(input.id, ctx.user.id);
      }),
  }),

  // User Preferences (for advanced features)
  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const prefs = await getUserPreferences(ctx.user.id);
      return prefs || {
        showThinking: false,
        thinkingExpanded: false,
        memoryEnabled: true,
        autoExtractMemories: false,
        artifactPanelEnabled: true,
        artifactPanelPosition: "right",
        preferredResponseFormat: "auto",
        codeTheme: "github-dark",
      };
    }),

    update: protectedProcedure
      .input(z.object({
        showThinking: z.boolean().optional(),
        thinkingExpanded: z.boolean().optional(),
        memoryEnabled: z.boolean().optional(),
        autoExtractMemories: z.boolean().optional(),
        artifactPanelEnabled: z.boolean().optional(),
        artifactPanelPosition: z.enum(["right", "bottom"]).optional(),
        preferredResponseFormat: z.enum(["detailed", "concise", "bullet", "auto"]).optional(),
        codeTheme: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Knowledge Base / RAG
  knowledge: router({
    search: protectedProcedure
      .input(z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Search across all user documents using semantic search
        const results = await searchDocumentChunks(
          ctx.user.id,
          input.query,
          input.limit || 10
        );
        
        return results.map(r => ({
          documentName: r.documentName || "Unknown",
          content: r.content,
          relevance: r.similarity || 0.8,
          page: r.chunkIndex,
        }));
      }),

    chat: protectedProcedure
      .input(z.object({
        query: z.string().min(1),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        // Search for relevant chunks
        const relevantChunks = await searchDocumentChunks(
          ctx.user.id,
          input.query,
          5
        );
        
        // Build context from relevant chunks
        const context = relevantChunks.map((chunk, i) => 
          `[Source ${i + 1}: ${chunk.documentName}]\n${chunk.content}`
        ).join("\n\n");
        
        const systemPrompt = `You are a helpful AI assistant that answers questions based on the user's knowledge base. 
Use the following context from the user's documents to answer their question. 
If the context doesn't contain relevant information, say so honestly.
Always cite which source you're using when providing information.

Context from user's documents:
${context}`;

        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
        ];
        
        // Add history
        if (input.history) {
          for (const msg of input.history) {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
        
        messages.push({ role: "user", content: input.query });
        
        const response = await invokeLLM({ messages });
        const answer = typeof response.choices[0]?.message?.content === "string" 
          ? response.choices[0].message.content 
          : "I couldn't generate a response.";
        
        return {
          answer,
          sources: relevantChunks.map(chunk => ({
            docName: chunk.documentName || "Unknown",
            chunk: chunk.content.substring(0, 100) + "...",
            relevance: chunk.similarity || 0.8,
          })),
        };
      }),
  }),

  // GitHub OAuth Integration
  github: router({
    // Check if GitHub OAuth is configured
    isConfigured: publicProcedure.query(() => {
      return { configured: isGitHubOAuthConfigured() };
    }),

    // Get current user's GitHub connection status
    getConnection: protectedProcedure.query(async ({ ctx }) => {
      const connection = await getGithubConnectionByUserId(ctx.user.id);
      if (!connection) {
        return { connected: false };
      }
      return {
        connected: true,
        username: connection.githubUsername,
        email: connection.githubEmail,
        avatarUrl: connection.avatarUrl,
        connectedAt: connection.createdAt,
      };
    }),

    // Get OAuth authorization URL
    getAuthUrl: protectedProcedure.query(({ ctx }) => {
      // Use user ID as state for security
      const state = Buffer.from(JSON.stringify({
        userId: ctx.user.id,
        timestamp: Date.now(),
      })).toString('base64');
      
      const authUrl = getGitHubAuthUrl(state);
      if (!authUrl) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
        });
      }
      return { authUrl, state };
    }),

    // Handle OAuth callback (exchange code for token)
    handleCallback: protectedProcedure
      .input(z.object({
        code: z.string(),
        state: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify state
        try {
          const stateData = JSON.parse(Buffer.from(input.state, 'base64').toString());
          if (stateData.userId !== ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Invalid OAuth state",
            });
          }
          // Check timestamp (5 minute expiry)
          if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "OAuth state expired",
            });
          }
        } catch (e) {
          if (e instanceof TRPCError) throw e;
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid OAuth state",
          });
        }

        // Exchange code for token
        const tokenResponse = await exchangeCodeForToken(input.code);
        if (!tokenResponse) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to exchange code for token",
          });
        }

        // Get GitHub user info
        const githubUser = await getGitHubUser(tokenResponse.access_token);
        if (!githubUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get GitHub user info",
          });
        }

        // Store encrypted token
        await upsertGithubConnection({
          userId: ctx.user.id,
          githubId: String(githubUser.id),
          githubUsername: githubUser.login,
          githubEmail: githubUser.email,
          avatarUrl: githubUser.avatar_url,
          encryptedAccessToken: encryptToken(tokenResponse.access_token),
          tokenScope: tokenResponse.scope,
        });

        return {
          success: true,
          username: githubUser.login,
          email: githubUser.email,
          avatarUrl: githubUser.avatar_url,
        };
      }),

    // Disconnect GitHub account
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteGithubConnection(ctx.user.id);
      return { success: true };
    }),

    // List user's repositories
    listRepos: protectedProcedure
      .input(z.object({
        page: z.number().default(1),
        perPage: z.number().default(30),
      }))
      .query(async ({ ctx, input }) => {
        const connection = await getGithubConnectionByUserId(ctx.user.id);
        if (!connection) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "GitHub account not connected",
          });
        }

        const accessToken = decryptToken(connection.encryptedAccessToken);
        const repos = await listUserRepos(accessToken, input.page, input.perPage);
        
        await updateGithubConnectionLastUsed(ctx.user.id);

        return repos.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          private: repo.private,
          htmlUrl: repo.html_url,
          language: repo.language,
          stargazersCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          updatedAt: repo.updated_at,
          defaultBranch: repo.default_branch,
        }));
      }),

    // Get repository contents
    getRepoContents: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string().default(""),
      }))
      .query(async ({ ctx, input }) => {
        const connection = await getGithubConnectionByUserId(ctx.user.id);
        if (!connection) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "GitHub account not connected",
          });
        }

        const accessToken = decryptToken(connection.encryptedAccessToken);
        const contents = await getRepoContents(accessToken, input.owner, input.repo, input.path);
        
        return contents.map((item: any) => ({
          name: item.name,
          path: item.path,
          type: item.type, // 'file' or 'dir'
          size: item.size,
          sha: item.sha,
        }));
      }),

    // Get file content
    getFileContent: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const connection = await getGithubConnectionByUserId(ctx.user.id);
        if (!connection) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "GitHub account not connected",
          });
        }

        const accessToken = decryptToken(connection.encryptedAccessToken);
        const content = await getFileContent(accessToken, input.owner, input.repo, input.path);
        
        if (content === null) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "File not found",
          });
        }

        return { content };
      }),

    // Get repository branches
    getBranches: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const connection = await getGithubConnectionByUserId(ctx.user.id);
        if (!connection) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "GitHub account not connected",
          });
        }

        const accessToken = decryptToken(connection.encryptedAccessToken);
        const branches = await getRepoBranches(accessToken, input.owner, input.repo);
        
        return branches.map((branch: any) => ({
          name: branch.name,
          protected: branch.protected,
        }));
      }),

    // Get pull requests
    getPullRequests: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        state: z.enum(["open", "closed", "all"]).default("open"),
      }))
      .query(async ({ ctx, input }) => {
        const connection = await getGithubConnectionByUserId(ctx.user.id);
        if (!connection) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "GitHub account not connected",
          });
        }

        const accessToken = decryptToken(connection.encryptedAccessToken);
        const prs = await getRepoPullRequests(accessToken, input.owner, input.repo, input.state);
        
        return prs.map((pr: any) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          user: pr.user?.login,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          htmlUrl: pr.html_url,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
        }));
      }),

    // Get PR files for review
    getPRFiles: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        pullNumber: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const connection = await getGithubConnectionByUserId(ctx.user.id);
        if (!connection) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "GitHub account not connected",
          });
        }

        const accessToken = decryptToken(connection.encryptedAccessToken);
        const files = await getPullRequestFiles(accessToken, input.owner, input.repo, input.pullNumber);
        
        return files.map((file: any) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch,
          contentsUrl: file.contents_url,
        }));
      }),
  }),

  // Code Review Bot
  codeReview: router({
    analyze: protectedProcedure
      .input(z.object({
        code: z.string().min(1).max(50000),
        language: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        const systemPrompt = `You are an expert code reviewer. Analyze the provided code for:
1. Security vulnerabilities (SQL injection, XSS, CSRF, authentication issues, etc.)
2. Performance issues (inefficient algorithms, memory leaks, N+1 queries, etc.)
3. Code style and best practices
4. Potential bugs and logic errors

Respond with a JSON object in this exact format:
{
  "summary": "Brief overall assessment",
  "score": 0-100,
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "category": "security" | "performance" | "style" | "bug",
      "line": number or null,
      "title": "Short issue title",
      "description": "Detailed explanation",
      "suggestion": "How to fix it",
      "code": "Fixed code snippet if applicable"
    }
  ],
  "recommendations": ["General improvement suggestions"]
}

Be thorough but practical. Focus on real issues, not nitpicks.`;

        const userPrompt = `Review this ${input.language || 'code'}:\n\n\`\`\`${input.language || ''}\n${input.code}\n\`\`\``;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "code_review",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    score: { type: "integer" },
                    issues: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          severity: { type: "string", enum: ["critical", "warning", "info"] },
                          category: { type: "string", enum: ["security", "performance", "style", "bug"] },
                          line: { type: ["integer", "null"] },
                          title: { type: "string" },
                          description: { type: "string" },
                          suggestion: { type: "string" },
                          code: { type: ["string", "null"] },
                        },
                        required: ["severity", "category", "title", "description"],
                        additionalProperties: false,
                      },
                    },
                    recommendations: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["summary", "score", "issues", "recommendations"],
                  additionalProperties: false,
                },
              },
            },
          });

          if (!response?.choices?.length || !response.choices[0]?.message?.content) {
            console.error("Code review: Invalid LLM response", response);
            throw new Error("Invalid response from AI model");
          }
          
          const rawContent = response.choices[0].message.content;
          const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent) || "{}";
          
          let result;
          try {
            result = JSON.parse(content);
          } catch (parseError) {
            console.error("Code review: Failed to parse JSON", content);
            // Return a fallback response
            result = {
              summary: "Unable to parse AI response",
              score: 50,
              issues: [],
              recommendations: ["Please try again"]
            };
          }
          
          // Log usage
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "chat",
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
            model: "grok-3-fast",
          });

          return result;
        } catch (error) {
          console.error("Code review error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to analyze code",
          });
        }
       }),
  }),

  // Smart Tools Router
  tools: router({
    // YouTube Summarizer
    youtube: router({
      extractVideoId: publicProcedure
        .input(z.object({ url: z.string() }))
        .query(({ input }) => {
          const videoId = extractVideoId(input.url);
          return { videoId, isValid: !!videoId };
        }),

      getVideoInfo: protectedProcedure
        .input(z.object({ videoId: z.string() }))
        .query(async ({ input }) => {
          return await getVideoInfo(input.videoId);
        }),

      summarize: protectedProcedure
        .input(z.object({ url: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const videoId = extractVideoId(input.url);
          if (!videoId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid YouTube URL" });
          }
          const summary = await summarizeVideo(videoId);
          if (!summary) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Could not summarize video" });
          }
          // Log usage
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "youtube_summary",
            inputTokens: 500,
            outputTokens: 300,
            model: "gemini-2.5-flash",
          });
          return summary;
        }),
    }),

    // URL Scraper
    scraper: router({
      scrape: protectedProcedure
        .input(z.object({ url: z.string().url() }))
        .mutation(async ({ ctx, input }) => {
          const result = await scrapeUrl(input.url);
          if (!result) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to scrape URL" });
          }
          return result;
        }),

      analyze: protectedProcedure
        .input(z.object({ url: z.string().url() }))
        .mutation(async ({ ctx, input }) => {
          const result = await analyzeUrl(input.url);
          if (!result) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to analyze URL" });
          }
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "url_analysis",
            inputTokens: 400,
            outputTokens: 200,
            model: "gemini-2.5-flash",
          });
          return result;
        }),
    }),

    // Calculator / Math Solver
    math: router({
      evaluate: publicProcedure
        .input(z.object({ expression: z.string() }))
        .query(({ input }) => {
          return evaluateMath(input.expression);
        }),

      solve: protectedProcedure
        .input(z.object({ problem: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const result = await solveMathProblem(input.problem);
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "math_solve",
            inputTokens: 100,
            outputTokens: 200,
            model: "gemini-2.5-flash",
          });
          return result;
        }),
    }),

    // Unit Converter
    converter: router({
      units: publicProcedure
        .input(z.object({
          value: z.number(),
          fromUnit: z.string(),
          toUnit: z.string(),
        }))
        .query(({ input }) => {
          const result = convertUnits(input.value, input.fromUnit, input.toUnit);
          if (!result) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid unit conversion" });
          }
          return result;
        }),

      currency: publicProcedure
        .input(z.object({
          amount: z.number(),
          fromCurrency: z.string(),
          toCurrency: z.string(),
        }))
        .query(({ input }) => {
          const result = convertCurrency(input.amount, input.fromCurrency, input.toCurrency);
          if (!result) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid currency conversion" });
          }
          return result;
        }),

      timezone: publicProcedure
        .input(z.object({
          time: z.string(),
          fromTimezone: z.string(),
          toTimezone: z.string(),
        }))
        .query(({ input }) => {
          const result = convertTimezone(input.time, input.fromTimezone, input.toTimezone);
          if (!result) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid timezone conversion" });
          }
          return result;
        }),

      parse: protectedProcedure
        .input(z.object({ text: z.string() }))
        .mutation(async ({ input }) => {
          return await parseConversionRequest(input.text);
        }),
    }),

    // API Proxy for testing external APIs
    apiProxy: protectedProcedure
      .input(z.object({
        url: z.string().url(),
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const startTime = Date.now();
        try {
          const headerEntries = input.headers ? Object.entries(input.headers) : [];
          const options: RequestInit = {
            method: input.method,
            headers: headerEntries,
          };

          if (input.method !== "GET" && input.method !== "HEAD" && input.body) {
            options.body = input.body;
          }

          const res = await fetch(input.url, options);
          const endTime = Date.now();

          const contentType = res.headers.get("content-type") || "";
          let data;

          if (contentType.includes("application/json")) {
            try {
              data = await res.json();
            } catch {
              data = await res.text();
            }
          } else {
            data = await res.text();
          }

          // Convert headers to plain object
          const responseHeaders: Record<string, string> = {};
          res.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          return {
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
            data,
            responseTime: endTime - startTime,
          };
        } catch (error: any) {
          return {
            error: error.message || "Failed to fetch",
            responseTime: Date.now() - startTime,
          };
        }
      }),
  }),

  // Conversation folders router
  folders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getFoldersByUser(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const folders = await getFoldersByUser(ctx.user.id);
        const maxOrder = folders.reduce((max, f) => Math.max(max, f.sortOrder), 0);
        
        return await createFolder({
          userId: ctx.user.id,
          name: input.name,
          color: input.color || "#6366f1",
          icon: input.icon || "folder",
          sortOrder: maxOrder + 1,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        folderId: z.number(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { folderId, ...updates } = input;
        await updateFolder(folderId, ctx.user.id, updates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteFolder(input.folderId, ctx.user.id);
        return { success: true };
      }),
    
    addConversation: protectedProcedure
      .input(z.object({
        folderId: z.number(),
        conversationId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await addConversationToFolder({
          userId: ctx.user.id,
          folderId: input.folderId,
          conversationId: input.conversationId,
        });
        return { success: true };
      }),
    
    removeConversation: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await removeConversationFromFolder(ctx.user.id, input.conversationId);
        return { success: true };
      }),
    
    getConversationFolder: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ ctx, input }) => {
        return await getConversationFolder(ctx.user.id, input.conversationId);
      }),
    
    getConversationsInFolder: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getConversationsInFolder(ctx.user.id, input.folderId);
      }),
    
    getAllMappings: protectedProcedure.query(async ({ ctx }) => {
      return await getAllConversationFolderMappings(ctx.user.id);
    }),
  }),
  
  // Admin Audit Logs - Full content logging for admin review
  adminAudit: router({
    // Get API call logs with filtering
    getApiCallLogs: protectedProcedure
      .input(z.object({
        userId: z.number().optional(),
        userEmail: z.string().optional(),
        actionType: z.string().optional(),
        isUncensored: z.boolean().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(500).optional(),
        offset: z.number().min(0).optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Admin only
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        
        return await getApiCallLogs({
          userId: input.userId,
          userEmail: input.userEmail,
          actionType: input.actionType,
          isUncensored: input.isUncensored,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          limit: input.limit || 100,
          offset: input.offset || 0,
        });
      }),
    
    // Get API call logs for a specific user
    getApiCallLogsByUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().min(1).max(500).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getApiCallLogsByUser(input.userId, input.limit || 50);
      }),
    
    // Get API call statistics
    getApiCallStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await getApiCallStats();
    }),
    
    // Get image access logs with filtering
    getImageAccessLogs: protectedProcedure
      .input(z.object({
        userId: z.number().optional(),
        actionType: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(500).optional(),
        offset: z.number().min(0).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        
        return await getImageAccessLogs({
          userId: input.userId,
          actionType: input.actionType,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          limit: input.limit || 100,
          offset: input.offset || 0,
        });
      }),
    
    // Get image access logs for a specific user
    getImageAccessLogsByUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().min(1).max(500).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getImageAccessLogsByUser(input.userId, input.limit || 50);
      }),
    
    // Get/set audit retention settings
    getRetentionDays: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const days = await getAuditSetting("retention_days");
      return { days: days ? parseInt(days) : 90 }; // Default 90 days
    }),
    
    setRetentionDays: protectedProcedure
      .input(z.object({ days: z.number().min(7).max(365) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        await setAuditSetting("retention_days", input.days.toString());
        return { success: true };
      }),
    
    // Manual cleanup of old logs
    cleanupOldLogs: protectedProcedure
      .input(z.object({ olderThanDays: z.number().min(7) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        
        const apiDeleted = await deleteOldApiCallLogs(input.olderThanDays);
        const imageDeleted = await deleteOldImageAccessLogs(input.olderThanDays);
        
        return {
          apiCallLogsDeleted: apiDeleted,
          imageAccessLogsDeleted: imageDeleted,
        };
      }),
    
    // Delete all audit logs for a specific user
    deleteUserLogs: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await deleteUserAuditLogs(input.userId);
      }),
  }),

  
  // Customer Support
  support: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        subject: z.string().min(1),
        category: z.string().default("general"),
        priority: z.string().default("normal"),
        message: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        
        // Store support request in database
        if (db) {
          try {
            await db.insert(supportRequests).values({
              name: input.name,
              email: input.email,
              subject: input.subject,
              category: input.category,
              priority: input.priority,
              message: input.message,
              userId: ctx.user?.id || null,
              status: "open",
              createdAt: new Date(),
            });
          } catch (e) {
            console.error("Failed to store support request:", e);
          }
        }
        
        // Send email notification to owner
        try {
          const { sendEmail } = await import("./_core/resend");
          const ownerEmail = process.env.OWNER_EMAIL || "support@chofesh.ai";
          
          await sendEmail({
            to: ownerEmail,
            subject: `[Support] ${input.priority.toUpperCase()}: ${input.subject}`,
            html: `
              <h2>New Support Request</h2>
              <p><strong>From:</strong> ${input.name} (${input.email})</p>
              <p><strong>Category:</strong> ${input.category}</p>
              <p><strong>Priority:</strong> ${input.priority}</p>
              <p><strong>Subject:</strong> ${input.subject}</p>
              <hr/>
              <p><strong>Message:</strong></p>
              <p>${input.message.replace(/\n/g, "<br/>")}</p>
            `,
          });
        } catch (e) {
          console.error("Failed to send support email:", e);
        }
        
        return { success: true };
      }),

    // Admin: List all support tickets
    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        // Check if user is admin/owner
        const ownerOpenId = process.env.OWNER_OPEN_ID;
        if (ctx.user.openId !== ownerOpenId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        const db = await getDb();
        if (!db) {
          return [];
        }

        const tickets = await db
          .select()
          .from(supportRequests)
          .orderBy(desc(supportRequests.createdAt));

        return tickets;
      }),

    // Admin: Update ticket status and add notes
    updateTicket: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is admin/owner
        const ownerOpenId = process.env.OWNER_OPEN_ID;
        if (ctx.user.openId !== ownerOpenId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const updateData: Record<string, unknown> = {
          status: input.status,
          updatedAt: new Date(),
        };

        if (input.adminNotes !== undefined) {
          updateData.adminNotes = input.adminNotes;
        }

        if (input.status === "resolved" || input.status === "closed") {
          updateData.resolvedAt = new Date();
        }

        await db
          .update(supportRequests)
          .set(updateData)
          .where(eq(supportRequests.id, input.ticketId));

        // If resolved, send email to customer
        if (input.status === "resolved" && input.adminNotes) {
          try {
            const ticket = await db
              .select()
              .from(supportRequests)
              .where(eq(supportRequests.id, input.ticketId))
              .limit(1);

            if (ticket[0]) {
              const { sendEmail } = await import("./_core/resend");
              await sendEmail({
                to: ticket[0].email,
                subject: `Re: ${ticket[0].subject} - Support Ticket #${input.ticketId}`,
                html: `
                  <h2>Your Support Request Has Been Resolved</h2>
                  <p>Hello ${ticket[0].name},</p>
                  <p>Your support ticket has been resolved. Here's our response:</p>
                  <hr/>
                  <p>${input.adminNotes.replace(/\n/g, "<br/>")}</p>
                  <hr/>
                  <p>If you have any further questions, please don't hesitate to reach out.</p>
                  <p>Best regards,<br/>Chofesh.ai Support Team</p>
                `,
              });
            }
          } catch (e) {
            console.error("Failed to send resolution email:", e);
          }
        }

        return { success: true };
      }),

    // Get unread ticket count for admin badge
    getOpenCount: protectedProcedure
      .query(async ({ ctx }) => {
        const ownerOpenId = process.env.OWNER_OPEN_ID;
        if (ctx.user.openId !== ownerOpenId) {
          return { count: 0 };
        }

        const db = await getDb();
        if (!db) {
          return { count: 0 };
        }

        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(supportRequests)
          .where(eq(supportRequests.status, "open"));

        return { count: result[0]?.count || 0 };
      }),
  }),

  // Research with Groq Compound (Web Search + Code Execution)
  research: protectedProcedure
    .input(z.object({
      query: z.string(),
      model: z.enum(["groq/compound", "groq/compound-mini"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { callGroqCompound } = await import("./_core/groqCompound");
      
      // Get user's Groq API key if they have one
      const userApiKeys = await getUserApiKeys(ctx.user.id);
      const groqKey = userApiKeys.find(k => k.provider === "groq" && k.isActive);
      
      const response = await callGroqCompound({
        query: input.query,
        model: input.model,
        apiKey: groqKey?.apiKey,
      });
      
      // Record usage
      await createUsageRecord({
        userId: ctx.user.id,
        provider: "groq",
        model: input.model,
        promptTokens: Math.ceil(input.query.length / 4),
        completionTokens: Math.ceil(response.content.length / 4),
        totalTokens: Math.ceil((input.query.length + response.content.length) / 4),
        cost: 0, // Free for now
        timestamp: new Date(),
      });
      
      return response;
    }),
});
export type AppRouter = typeof appRouter;
