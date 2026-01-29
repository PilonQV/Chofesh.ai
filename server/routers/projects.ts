/**
 * Projects tRPC Router
 * 
 * API endpoints for managing user projects
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as projectsLib from "../lib/projects";
import { PROJECT_TYPES, PROJECT_STATUS } from "../../drizzle/schema";

export const projectsRouter = router({
  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(z.object({
      type: z.enum(['KIDS_BOOK', 'WEBSITE', 'APP', 'MARKETING', 'BUSINESS_PLAN', 'OTHER']),
      title: z.string(),
      description: z.string().optional(),
      inputs: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const project = await projectsLib.createProject({
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        description: input.description,
        inputs: input.inputs,
      });
      
      return project;
    }),

  /**
   * Update a project
   */
  update: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      status: z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'FAILED']).optional(),
      outputs: z.object({
        text: z.string().optional(),
        images: z.array(z.object({
          url: z.string(),
          prompt: z.string(),
          type: z.string(),
        })).optional(),
        files: z.array(z.object({
          url: z.string(),
          name: z.string(),
          type: z.string(),
        })).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      }).optional(),
      thumbnailUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const project = await projectsLib.updateProject(input.projectId, {
        status: input.status,
        outputs: input.outputs,
        thumbnailUrl: input.thumbnailUrl,
        completedAt: input.status === 'COMPLETED' ? new Date() : undefined,
      });
      
      return project;
    }),

  /**
   * Get a project by ID
   */
  get: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const project = await projectsLib.getProject(input.projectId, ctx.user.id);
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      return project;
    }),

  /**
   * Get all projects for current user
   */
  list: protectedProcedure
    .input(z.object({
      type: z.enum(['KIDS_BOOK', 'WEBSITE', 'APP', 'MARKETING', 'BUSINESS_PLAN', 'OTHER']).optional(),
      status: z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'FAILED']).optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const projects = await projectsLib.getUserProjects(ctx.user.id, {
        type: input.type,
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      });
      
      return projects;
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      await projectsLib.deleteProject(input.projectId, ctx.user.id);
      
      return { success: true };
    }),

  /**
   * Get project images
   */
  getImages: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify user owns project
      const project = await projectsLib.getProject(input.projectId, ctx.user.id);
      if (!project) {
        throw new Error('Project not found');
      }
      
      const images = await projectsLib.getProjectImages(input.projectId);
      return images;
    }),

  /**
   * Get project files
   */
  getFiles: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify user owns project
      const project = await projectsLib.getProject(input.projectId, ctx.user.id);
      if (!project) {
        throw new Error('Project not found');
      }
      
      const files = await projectsLib.getProjectFiles(input.projectId);
      return files;
    }),

  /**
   * Generate share link for project
   */
  share: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const shareToken = await projectsLib.generateShareToken(input.projectId, ctx.user.id);
      
      return {
        shareUrl: `${process.env.VITE_APP_URL || 'https://chofesh.ai'}/shared/${shareToken}`,
        shareToken,
      };
    }),

  /**
   * Get shared project (public)
   */
  getShared: publicProcedure
    .input(z.object({
      shareToken: z.string(),
    }))
    .query(async ({ input }) => {
      const project = await projectsLib.getProjectByShareToken(input.shareToken);
      
      if (!project) {
        throw new Error('Project not found or not shared');
      }
      
      return project;
    }),
});
