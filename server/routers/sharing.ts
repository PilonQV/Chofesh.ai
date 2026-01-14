/**
 * Conversation Sharing tRPC Router
 * 
 * Provides API endpoints for sharing and collaborating on conversations.
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { sharedConversations, conversationCollaborators, conversationComments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export const sharingRouter = router({
  /**
   * Share a conversation.
   */
  shareConversation: protectedProcedure
    .input(z.object({
      title: z.string(),
      encryptedData: z.string(),
      shareType: z.enum(["private", "link", "team"]).default("link"),
      allowComments: z.boolean().default(true),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const accessToken = input.shareType === "link" ? crypto.randomBytes(32).toString("hex") : undefined;
      return await db.createSharedConversation({
        ...input,
        ownerId: ctx.user.id,
        accessToken,
      });
    }),

  /**
   * Get a shared conversation by access token (for public links).
   */
  getSharedConversationByToken: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .query(async ({ input }) => {
      return await db.getSharedConversationByToken(input.accessToken);
    }),

  /**
   * Get a shared conversation by ID (for team members).
   */
  getSharedConversationById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const conversation = await db.getSharedConversationById(input.id);
      if (!conversation) throw new Error("Not found");
      
      // Check if user has access
      if (conversation.ownerId !== ctx.user.id) {
        const collaborator = await db.getCollaborator(input.id, ctx.user.id);
        if (!collaborator) throw new Error("Unauthorized");
      }
      
      return conversation;
    }),

  /**
   * Add a collaborator to a team conversation.
   */
  addCollaborator: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      userId: z.number(),
      permission: z.enum(["view", "comment", "edit"]).default("view"),
    }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await db.getSharedConversationById(input.conversationId);
      if (!conversation || conversation.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return await db.addCollaborator({
        ...input,
        invitedBy: ctx.user.id,
      });
    }),

  /**
   * Add a comment to a conversation.
   */
  addComment: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      content: z.string(),
      parentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has comment access
      const conversation = await db.getSharedConversationById(input.conversationId);
      if (!conversation || !conversation.allowComments) throw new Error("Comments disabled");
      
      if (conversation.ownerId !== ctx.user.id) {
        const collaborator = await db.getCollaborator(input.conversationId, ctx.user.id);
        if (!collaborator) throw new Error("Unauthorized");
      }
      
      return await db.addComment({
        ...input,
        userId: ctx.user.id,
      });
    }),
});
