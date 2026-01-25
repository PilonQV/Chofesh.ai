/**
 * Agent Marketplace tRPC Router
 * 
 * Provides API endpoints for browsing, installing, and managing marketplace items.
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { marketplaceItems, marketplaceRatings, userInstallations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const marketplaceRouter = router({
  /**
   * Get a single marketplace item by slug.
   */
  getItem: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await db.getMarketplaceItemBySlug(input.slug);
    }),

  /**
   * List all public marketplace items.
   */
  listItems: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      itemType: z.string().optional(),
      sortBy: z.enum(["rating", "installCount", "createdAt"]).default("rating"),
    }))
    .query(async ({ input }) => {
      return await db.getMarketplaceItems(input);
    }),

  /**
   * Create a new marketplace item.
   */
  createItem: protectedProcedure
    .input(z.object({
      name: z.string(),
      shortDescription: z.string(),
      description: z.string(),
      itemType: z.enum(["agent", "workflow", "template", "integration"]),
      category: z.enum(["productivity", "development", "marketing", "sales", "support", "analytics", "automation", "content", "research", "other"]).default("other"),
      configuration: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.name.toLowerCase().replace(/\s+/g, "-");
      return await db.createMarketplaceItem({
        ...input,
        authorId: ctx.user.id,
        slug,
      });
    }),

  /**
   * Install a marketplace item for the current user.
   */
  installItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getMarketplaceItemById(input.itemId);
      if (!item) throw new Error("Item not found");
      
      return await db.installUserItem({
        userId: ctx.user.id,
        itemId: input.itemId,
        installedVersion: item.version,
      });
    }),
});
