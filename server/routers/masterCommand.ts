/**
 * Master Command Router
 * 
 * API endpoint for Master Command system.
 * Admin-only access for self-modifying commands.
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { MasterCommandSystem } from '../_core/masterCommand';
import path from 'path';

// Owner authentication
const OWNER_OPEN_ID = process.env.OWNER_OPEN_ID || '';

// Project path
const PROJECT_PATH = path.join(process.cwd());

// Master Command System instance
const masterCommand = new MasterCommandSystem(PROJECT_PATH);

export const masterCommandRouter = router({
  /**
   * Execute a master command
   */
  execute: protectedProcedure
    .input(z.object({
      command: z.string().min(5, 'Command must be at least 5 characters'),
      context: z.string().optional(),
      dryRun: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify user is the owner
      console.log('[Master Command] Auth check:', {
        userOpenId: ctx.user.openId,
        ownerOpenId: OWNER_OPEN_ID,
        isOwner: ctx.user.openId === OWNER_OPEN_ID,
      });
      
      if (!OWNER_OPEN_ID || ctx.user.openId !== OWNER_OPEN_ID) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the owner can execute master commands',
        });
      }

      try {
        const result = await masterCommand.execute({
          command: input.command,
          context: input.context,
          dryRun: input.dryRun,
        });

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Master Command failed: ${error.message}`,
        });
      }
    }),

  /**
   * Get command history (future feature)
   */
  history: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify user is the owner
      if (!OWNER_OPEN_ID || ctx.user.openId !== OWNER_OPEN_ID) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the owner can view command history',
        });
      }

      // TODO: Implement command history from database
      return {
        commands: [],
        total: 0,
      };
    }),
});
