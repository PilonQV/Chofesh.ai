import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import crypto from "crypto";

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

// Available AI models for text generation
const TEXT_MODELS = [
  { id: "default", name: "Default (GPT-4)", description: "Balanced performance and quality" },
  { id: "gpt-4o", name: "GPT-4o", description: "Latest multimodal model" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and efficient" },
] as const;

// Available AI models for image generation
const IMAGE_MODELS = [
  { id: "flux", name: "FLUX", description: "High-quality image generation" },
] as const;

// Token cost estimates (per 1K tokens)
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "default": { input: 0.03, output: 0.06 },
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
};

// Rough token estimation (4 chars ≈ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export const appRouter = router({
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
  }),

  // Models endpoint
  models: router({
    listText: publicProcedure.query(() => TEXT_MODELS),
    listImage: publicProcedure.query(() => IMAGE_MODELS),
  }),

  // API Keys management (BYOK)
  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserApiKeys(ctx.user.id);
    }),
    
    add: protectedProcedure
      .input(z.object({
        provider: z.enum(["openai", "anthropic", "google"]),
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

  // Chat endpoint with audit logging and usage tracking
  chat: router({
    send: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        model: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        // Get the last user message for audit logging
        const lastUserMessage = input.messages.filter(m => m.role === "user").pop();
        const promptContent = lastUserMessage?.content || "";
        
        // Estimate input tokens
        const inputTokens = input.messages.reduce((acc, m) => acc + estimateTokens(typeof m.content === 'string' ? m.content : ''), 0);
        
        try {
          // Call LLM
          const response = await invokeLLM({
            messages: input.messages,
          });

          const rawContent = response.choices[0]?.message?.content;
          const assistantContent = typeof rawContent === 'string' ? rawContent : '';
          const outputTokens = estimateTokens(assistantContent);
          const totalTokens = inputTokens + outputTokens;
          
          // Calculate estimated cost
          const modelCosts = TOKEN_COSTS[input.model || "default"] || TOKEN_COSTS["default"];
          const estimatedCost = (inputTokens * modelCosts.input + outputTokens * modelCosts.output) / 1000;
          
          // Create usage record
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "chat",
            model: input.model || "default",
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCost: estimatedCost.toFixed(6),
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
            modelUsed: input.model || "default",
            promptLength: promptContent.length,
            responseLength: assistantContent.length,
            metadata: JSON.stringify({
              duration: Date.now() - startTime,
              messageCount: input.messages.length,
              tokens: totalTokens,
            }),
            timestamp: new Date(),
          });

          return {
            content: assistantContent,
            model: input.model || "default",
          };
        } catch (error) {
          // Log failed attempts too
          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "chat",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(promptContent),
            modelUsed: input.model || "default",
            promptLength: promptContent.length,
            metadata: JSON.stringify({
              error: true,
              duration: Date.now() - startTime,
            }),
            timestamp: new Date(),
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate response",
          });
        }
      }),
  }),

  // Image generation endpoint with audit logging
  image: router({
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(2000),
        model: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        try {
          const result = await generateImage({
            prompt: input.prompt,
          });

          // Create usage record for image generation
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "image_generation",
            model: input.model || "flux",
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCost: "0.02", // Rough estimate per image
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
              success: true,
            }),
            timestamp: new Date(),
          });

          return {
            url: result.url,
            prompt: input.prompt,
          };
        } catch (error) {
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
            }),
            timestamp: new Date(),
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate image",
          });
        }
      }),
  }),

  // Documents (RAG)
  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDocuments(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getDocumentById(ctx.user.id, input.id);
      }),
    
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        textContent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create document record
        const docId = await createUserDocument({
          userId: ctx.user.id,
          filename: input.fileName,
          originalName: input.fileName,
          mimeType: input.fileType,
          fileSize: input.fileSize,
          storageUrl: "", // Not using S3 for text content
          status: "processing",
        });

        // Process text into chunks
        const chunkSize = 1000;
        const overlap = 200;
        const chunks: string[] = [];
        
        for (let i = 0; i < input.textContent.length; i += chunkSize - overlap) {
          chunks.push(input.textContent.slice(i, i + chunkSize));
        }

        // Save chunks
        await createDocumentChunks(chunks.map((content, index) => ({
          documentId: docId,
          userId: ctx.user.id,
          content,
          chunkIndex: index,
        })));

        // Update document status
        await updateDocumentStatus(docId, "ready", input.textContent, chunks.length);

        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "document_upload",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          metadata: JSON.stringify({
            fileName: input.fileName,
            fileSize: input.fileSize,
            chunkCount: chunks.length,
          }),
          timestamp: new Date(),
        });

        return { id: docId, chunkCount: chunks.length };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteUserDocument(ctx.user.id, input.id);
        
        await createAuditLog({
          userId: ctx.user.id,
          userOpenId: ctx.user.openId,
          actionType: "document_upload", // Using document_upload for delete audit
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] || null,
          timestamp: new Date(),
        });
        
        return { success: true };
      }),
    
    chat: protectedProcedure
      .input(z.object({
        documentId: z.number(),
        question: z.string(),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        // Get document
        const doc = await getDocumentById(ctx.user.id, input.documentId);
        if (!doc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
        }

        // Search for relevant chunks
        const relevantChunks = await searchDocumentChunks(ctx.user.id, input.question, 3);
        const context = relevantChunks.map(c => c.content).join("\n\n---\n\n");

        // Build messages
        const messages = [
          {
            role: "system" as const,
            content: `You are a helpful assistant that answers questions based on the provided document context. Use the context to answer questions accurately. If the answer is not in the context, say so.

Document: ${doc.originalName}

Context:
${context}`,
          },
          ...(input.history || []),
          { role: "user" as const, content: input.question },
        ];

        try {
          const response = await invokeLLM({ messages });
          const rawContent = response.choices[0]?.message?.content;
          const assistantContent = typeof rawContent === 'string' ? rawContent : '';

          // Track usage
          const inputTokens = messages.reduce((acc, m) => acc + estimateTokens(typeof m.content === 'string' ? m.content : ''), 0);
          const outputTokens = estimateTokens(assistantContent);
          
          await createUsageRecord({
            userId: ctx.user.id,
            actionType: "document_chat",
            model: "default",
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            estimatedCost: ((inputTokens * 0.03 + outputTokens * 0.06) / 1000).toFixed(6),
            timestamp: new Date(),
          });

          await createAuditLog({
            userId: ctx.user.id,
            userOpenId: ctx.user.openId,
            actionType: "document_chat",
            ipAddress: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] || null,
            contentHash: hashContent(input.question + assistantContent),
            modelUsed: "default",
            promptLength: input.question.length,
            responseLength: assistantContent.length,
            metadata: JSON.stringify({
              documentId: input.documentId,
              duration: Date.now() - startTime,
            }),
            timestamp: new Date(),
          });

          return { content: assistantContent };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process question",
          });
        }
      }),
  }),

  // User settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getUserSettings(ctx.user.id);
      return settings || {
        preferredModel: "default",
        preferredImageModel: "flux",
        theme: "dark",
      };
    }),
    update: protectedProcedure
      .input(z.object({
        preferredModel: z.string().optional(),
        preferredImageModel: z.string().optional(),
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
          metadata: JSON.stringify({ changedFields: Object.keys(input) }),
          timestamp: new Date(),
        });
        
        return { success: true };
      }),
  }),

  // Admin endpoints
  admin: router({
    // Get all users
    users: adminProcedure.query(async () => {
      return await getAllUsers();
    }),
    
    // Update user role
    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    // Get audit logs
    auditLogs: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        userId: z.number().optional(),
        actionType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getAuditLogs(input || {});
      }),

    // Get audit log statistics
    auditStats: adminProcedure.query(async () => {
      return await getAuditLogStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
