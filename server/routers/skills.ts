/**
 * Skills Registry tRPC Router
 * 
 * Provides API endpoints for creating, reading, updating, and deleting skills.
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { skills, skillRatings } from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export const skillsRouter = router({
  /**
   * Get a single skill by slug.
   */
  getSkill: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const skill = await db.getSkillBySlug(input.slug);
      if (!skill) {
        throw new Error("Skill not found");
      }
      return skill;
    }),

  /**
   * List all public skills.
   */
  listPublicSkills: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      sortBy: z.enum(["rating", "usageCount", "createdAt"]).default("rating"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }))
    .query(async ({ input }) => {
      return await db.getPublicSkills(input);
    }),

  /**
   * Create a new skill.
   */
  createSkill: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string(),
      prompt: z.string(),
      systemPrompt: z.string().optional(),
      parameters: z.string().optional(),
      category: z.string(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.name.toLowerCase().replace(/\s+/g, "-");
      const newSkill = await db.createSkill({
        ...input,
        authorId: ctx.user.id,
        slug,
      });
      return newSkill;
    }),

  /**
   * Update an existing skill.
   */
  updateSkill: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      prompt: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const skill = await db.getSkillById(input.id);
      if (!skill || skill.authorId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return await db.updateSkill(input.id, input);
    }),

  /**
   * Rate a skill.
   */
  rateSkill: protectedProcedure
    .input(z.object({
      skillId: z.number(),
      rating: z.number().min(1).max(5),
      review: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.rateSkill({
        ...input,
        userId: ctx.user.id,
      });
    }),
});
