/**
 * Project Builder tRPC Router
 * 
 * Endpoints for autonomous project creation
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createProject,
  isProjectRequest,
  getProjectInfo,
  type ProjectResult
} from "../lib/projectBuilders";

export const projectBuilderRouter = router({
  /**
   * Detect if a message is a project creation request
   */
  detectProject: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .query(async (opts) => {
      const { input } = opts;
      const isProject = isProjectRequest(input.message);
      
      if (!isProject) {
        return {
          isProject: false,
          projectInfo: null
        };
      }
      
      const projectInfo = getProjectInfo(input.message);
      
      return {
        isProject: true,
        projectInfo
      };
    }),

  /**
   * Create a complete project from a message
   */
  createProject: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      const progressUpdates: Array<{ step: string; progress: number }> = [];
      
      const result = await createProject({
        message: input.message,
        onProgress: (step, progress) => {
          progressUpdates.push({ step, progress });
          console.log(`[Project Builder] ${progress}%: ${step}`);
        },
        onDetection: (type, confidence) => {
          console.log(`[Project Builder] Detected ${type} with ${(confidence * 100).toFixed(0)}% confidence`);
        }
      });
      
      if (!result) {
        throw new Error('Could not detect project type from message');
      }
      
      // Log project creation
      console.log(`[Project Builder] Created ${result.type} project for user ${ctx.user.id}`);
      
      return {
        success: true,
        projectType: result.type,
        result: result.result,
        progressUpdates
      };
    }),

  /**
   * Stream project creation with real-time progress updates
   * (Future enhancement - requires streaming support)
   */
  createProjectStream: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      // TODO: Implement streaming version with Server-Sent Events
      // For now, use regular mutation
      return { message: 'Streaming not yet implemented. Use createProject instead.' };
    }),
});
