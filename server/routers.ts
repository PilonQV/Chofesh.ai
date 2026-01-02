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
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { transcribeAudio } from "./_core/voiceTranscription";
import { callDataApi } from "./_core/dataApi";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import crypto from "crypto";
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
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        const routingMode = (input.routingMode || "auto") as RoutingMode;
        
        // Analyze complexity and select model
        const complexity = analyzeQueryComplexity(input.messages);
        const selectedModel = input.model 
          ? AVAILABLE_MODELS.find(m => m.id === input.model) || selectModel(complexity, routingMode)
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
        
        // Get the last user message for audit logging
        const lastUserMessage = input.messages.filter(m => m.role === "user").pop();
        const promptContent = lastUserMessage?.content || "";
        
        // Web search integration
        let webSearchResults: { title: string; url: string; description: string }[] = [];
        let messagesWithSearch = [...input.messages];
        
        if (input.webSearch && promptContent) {
          try {
            // Perform web search using Data API
            const searchResults = await callDataApi("BraveSearch/web_search", {
              query: {
                q: promptContent,
                count: 5,
              },
            }) as any;
            
            webSearchResults = (searchResults?.web?.results || []).slice(0, 5).map((r: any) => ({
              title: r.title || '',
              url: r.url || '',
              description: r.description || '',
            }));
            
            // If we got search results, inject them into the system prompt
            if (webSearchResults.length > 0) {
              const searchContext = webSearchResults.map((r, i) => 
                `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.url}`
              ).join('\n\n');
              
              const searchSystemPrompt = `You have access to recent web search results. Use them to provide accurate, up-to-date information when relevant.\n\nWeb Search Results:\n${searchContext}\n\nWhen citing information from search results, mention the source.`;
              
              // Add or prepend to existing system prompt
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
          } catch (searchError) {
            console.error("Web search failed:", searchError);
            // Continue without search results
          }
        }
        
        // Estimate input tokens
        const inputTokens = messagesWithSearch.reduce((acc, m) => acc + estimateTokens(m.content), 0);
        
        try {
          // Call LLM with potentially search-augmented messages
          const response = await invokeLLM({
            messages: messagesWithSearch,
          });

          const rawContent = response.choices[0]?.message?.content;
          const assistantContent = typeof rawContent === 'string' ? rawContent : '';
          const outputTokens = estimateTokens(assistantContent);
          const totalTokens = inputTokens + outputTokens;
          
          // Calculate estimated cost based on selected model
          const cost = estimateCost(selectedModel, inputTokens, outputTokens);
          
          // Cache the response
          if (input.useCache !== false) {
            setCachedResponse(cacheKey, assistantContent, selectedModel.id);
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

          return {
            content: assistantContent,
            model: selectedModel.id,
            modelName: selectedModel.name,
            tier: selectedModel.tier,
            cached: false,
            complexity,
            cost,
            webSearchUsed: webSearchResults.length > 0,
            webSearchResultsCount: webSearchResults.length,
            tokens: {
              input: inputTokens,
              output: outputTokens,
              total: totalTokens,
            },
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
            modelUsed: selectedModel.id,
            promptLength: promptContent.length,
            metadata: JSON.stringify({
              error: true,
              duration: Date.now() - startTime,
              complexity,
              routingMode,
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
        negativePrompt: z.string().max(1000).optional(),
        model: z.string().optional(),
        aspectRatio: z.string().optional(),
        seed: z.number().optional(),
        steps: z.number().min(10).max(50).optional(),
        cfgScale: z.number().min(1).max(20).optional(),
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

          return {
            url: result.url,
            model: input.model || "flux",
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
        
        // Store chunks
        const chunksToInsert = chunkTexts.map((content, index) => ({
          documentId: docId,
          userId: ctx.user.id,
          chunkIndex: index,
          content,
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
        const doc = await getDocumentById(input.documentId, ctx.user.id);
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
          // Use Brave Search API through Data API
          const results = await callDataApi("BraveSearch/web_search", {
            query: {
              q: input.query,
              count: input.limit || 5,
            },
          }) as any;
          
          // Extract relevant search results
          const webResults = results?.web?.results || [];
          const formattedResults = webResults.slice(0, input.limit || 5).map((r: any) => ({
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
  }),

  // Voice Transcription using Whisper API
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string().url(),
        language: z.string().optional(),
        prompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
          prompt: input.prompt,
        });
        
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
          
          return {
            url: result.url,
            model: "flux-edit",
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to edit image",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
