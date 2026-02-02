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

// Admin token from environment
const ADMIN_TOKEN = process.env.MASTER_COMMAND_ADMIN_TOKEN || 'dev_admin_token_change_me';

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
      adminToken: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Debug logging
      console.log('[Master Command] Token validation:');
      console.log('  Received token:', input.adminToken);
      console.log('  Expected token:', ADMIN_TOKEN);
      console.log('  Match:', input.adminToken === ADMIN_TOKEN);
      
      // Verify admin token
      if (input.adminToken !== ADMIN_TOKEN) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid admin token',
        });
      }

      // Additional check: Only allow specific admin users
      // TODO: Add admin user IDs to environment
      const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);
      if (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(ctx.user.id.toString())) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User is not authorized to execute master commands',
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
      adminToken: z.string(),
      limit: z.number().min(1).max(100).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify admin token
      if (input.adminToken !== ADMIN_TOKEN) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid admin token',
        });
      }

      // TODO: Implement command history from database
      return {
        commands: [],
        total: 0,
      };
    }),
});
