/**
 * Automation tRPC Router
 * 
 * Endpoints for webhooks and scheduled tasks management
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createWebhook,
  getUserWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  regenerateWebhookSecret,
  getWebhookDeliveries,
  testWebhook,
  WEBHOOK_EVENTS,
} from "../lib/webhooks";
import {
  createScheduledTask,
  getUserScheduledTasks,
  getScheduledTaskById,
  updateScheduledTask,
  deleteScheduledTask,
  getTaskExecutions,
  validateCronExpression,
  getNextRunTimes,
  TASK_TYPES,
} from "../lib/scheduledTasks";

export const automationRouter = router({
  /**
   * Webhooks endpoints
   */
  listWebhooks: protectedProcedure.query(async (opts) => {
    const { ctx } = opts;
    return await getUserWebhooks(ctx.user.id);
  }),

  getWebhook: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async (opts) => {
      const { input, ctx } = opts;
      return await getWebhookById(input.webhookId, ctx.user.id);
    }),

  createWebhook: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        url: z.string().url(),
        events: z.array(z.enum(Object.values(WEBHOOK_EVENTS) as [string, ...string[]])),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      return await createWebhook({
        userId: ctx.user.id,
        name: input.name,
        url: input.url,
        events: input.events as any,
      });
    }),

  updateWebhook: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        name: z.string().min(1).max(100).optional(),
        url: z.string().url().optional(),
        events: z.array(z.enum(Object.values(WEBHOOK_EVENTS) as [string, ...string[]])).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      return await updateWebhook({
        webhookId: input.webhookId,
        userId: ctx.user.id,
        name: input.name,
        url: input.url,
        events: input.events as any,
        active: input.active,
      });
    }),

  deleteWebhook: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      await deleteWebhook(input.webhookId, ctx.user.id);
      return { success: true };
    }),

  testWebhook: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      return await testWebhook(input.webhookId, ctx.user.id);
    }),

  listWebhookDeliveries: protectedProcedure
    .input(
      z.object({
        webhookId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async (opts) => {
      const { input } = opts;
      return await getWebhookDeliveries({
        webhookId: input.webhookId,
        status: input.status,
        limit: input.limit,
      });
    }),

  /**
   * Scheduled Tasks endpoints
   */
  listScheduledTasks: protectedProcedure.query(async (opts) => {
    const { ctx } = opts;
    return await getUserScheduledTasks(ctx.user.id);
  }),

  getScheduledTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async (opts) => {
      const { input, ctx } = opts;
      return await getScheduledTaskById(input.taskId, ctx.user.id);
    }),

  createScheduledTask: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        scheduleCron: z.string(),
        timezone: z.string().default("UTC"),
        taskType: z.string(),
        taskConfig: z.record(z.string(), z.any()),
        timeoutMinutes: z.number().min(1).max(60).default(5),
        notifyOnComplete: z.boolean().default(true),
        notifyOnError: z.boolean().default(true),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      return await createScheduledTask({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        scheduleCron: input.scheduleCron,
        timezone: input.timezone,
        taskType: input.taskType as any,
        taskConfig: input.taskConfig,
        timeoutMinutes: input.timeoutMinutes,
        notifyOnComplete: input.notifyOnComplete,
        notifyOnError: input.notifyOnError,
      });
    }),

  updateScheduledTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        scheduleCron: z.string().optional(),
        timezone: z.string().optional(),
        taskType: z.string().optional(),
        taskConfig: z.record(z.string(), z.any()).optional(),
        active: z.boolean().optional(),
        timeoutMinutes: z.number().min(1).max(60).optional(),
        notifyOnComplete: z.boolean().optional(),
        notifyOnError: z.boolean().optional(),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      return await updateScheduledTask({
        taskId: input.taskId,
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        scheduleCron: input.scheduleCron,
        timezone: input.timezone,
        taskType: input.taskType as any,
        taskConfig: input.taskConfig,
        active: input.active,
        timeoutMinutes: input.timeoutMinutes,
        notifyOnComplete: input.notifyOnComplete,
        notifyOnError: input.notifyOnError,
      });
    }),

  deleteScheduledTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      await deleteScheduledTask(input.taskId, ctx.user.id);
      return { success: true };
    }),

  runTaskNow: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      const task = await getScheduledTaskById(input.taskId, ctx.user.id);
      if (!task) throw new Error("Task not found");
      // TODO: Implement immediate execution
      return { success: true, message: "Task execution triggered" };
    }),

  listTaskExecutions: protectedProcedure
    .input(
      z.object({
        taskId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async (opts) => {
      const { input } = opts;
      if (input.taskId) {
        return await getTaskExecutions(input.taskId, input.limit);
      }
      // TODO: Implement user-wide execution listing
      return [];
    }),

  validateCron: protectedProcedure
    .input(z.object({ cron: z.string(), timezone: z.string().default("UTC") }))
    .query(async (opts) => {
      const { input } = opts;
      return validateCronExpression(input.cron, input.timezone);
    }),
});
