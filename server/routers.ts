import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createAuditLog, getAuditLogs, getAuditLogStats, getAllUsers, updateUserRole, getUserSettings, upsertUserSettings } from "./db";
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

  // Chat endpoint with audit logging
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
        
        try {
          // Call LLM
          const response = await invokeLLM({
            messages: input.messages,
          });

          const assistantContent = response.choices[0]?.message?.content || "";
          
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
