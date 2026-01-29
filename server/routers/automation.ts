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
  webhooks: router({
    // List all webhooks
    list: protectedProcedure.query(async (opts) => {
      const { ctx } = opts;
      return await getUserWebhooks(ctx.user.id);
    }),

    // Get single webhook
    get: protectedProcedure
      .input(z.object({ webhookId: z.string() }))
      .query(async (opts) => {
        const { input, ctx } = opts;
        return await getWebhookById(input.webhookId, ctx.user.id);
      }),

    // Create webhook
    create: protectedProcedure
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

    // Update webhook
    update: protectedProcedure
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

    // Delete webhook
    delete: protectedProcedure
      .input(z.object({ webhookId: z.string() }))
      .mutation(async (opts) => {
        const { input, ctx } = opts;
        await deleteWebhook(input.webhookId, ctx.user.id);
        return { success: true };
      }),

    // Regenerate secret
    regenerateSecret: protectedProcedure
      .input(z.object({ webhookId: z.string() }))
      .mutation(async (opts) => {
        const { input, ctx } = opts;
        const secret = await regenerateWebhookSecret(input.webhookId, ctx.user.id);
        return { secret };
      }),

    // Get deliveries
    deliveries: protectedProcedure
      .input(
        z.object({
          webhookId: z.string(),
          limit: z.number().min(1).max(100).default(50),
        })
      )
      .query(async (opts) => {
        const { input } = opts;
        return await getWebhookDeliveries(input.webhookId, input.limit);
      }),

    // Test webhook
    test: protectedProcedure
      .input(z.object({ webhookId: z.string() }))
      .mutation(async (opts) => {
        const { input, ctx } = opts;
        return await testWebhook(input.webhookId, ctx.user.id);
      }),

    // Get available events
    events: protectedProcedure.query(() => {
      return Object.entries(WEBHOOK_EVENTS).map(([key, value]) => ({
        key,
        value,
        description: getEventDescription(value),
      }));
    }),
  }),

  /**
   * Scheduled tasks endpoints
   */
  tasks: router({
    // List all tasks
    list: protectedProcedure.query(async (opts) => {
      const { ctx } = opts;
      return await getUserScheduledTasks(ctx.user.id);
    }),

    // Get single task
    get: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async (opts) => {
        const { input, ctx } = opts;
        return await getScheduledTaskById(input.taskId, ctx.user.id);
      }),

    // Create task
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          description: z.string().max(500).optional(),
          scheduleCron: z.string(),
          timezone: z.string().default("UTC"),
          taskType: z.enum(Object.values(TASK_TYPES) as [string, ...string[]]),
          taskConfig: z.record(z.any()),
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

    // Update task
    update: protectedProcedure
      .input(
        z.object({
          taskId: z.string(),
          name: z.string().min(1).max(100).optional(),
          description: z.string().max(500).optional(),
          scheduleCron: z.string().optional(),
          timezone: z.string().optional(),
          taskType: z.enum(Object.values(TASK_TYPES) as [string, ...string[]]).optional(),
          taskConfig: z.record(z.any()).optional(),
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

    // Delete task
    delete: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .mutation(async (opts) => {
        const { input, ctx } = opts;
        await deleteScheduledTask(input.taskId, ctx.user.id);
        return { success: true };
      }),

    // Get executions
    executions: protectedProcedure
      .input(
        z.object({
          taskId: z.string(),
          limit: z.number().min(1).max(100).default(50),
        })
      )
      .query(async (opts) => {
        const { input } = opts;
        return await getTaskExecutions(input.taskId, input.limit);
      }),

    // Validate cron expression
    validateCron: protectedProcedure
      .input(
        z.object({
          cronExpression: z.string(),
          timezone: z.string().default("UTC"),
        })
      )
      .query(async (opts) => {
        const { input } = opts;
        return validateCronExpression(input.cronExpression, input.timezone);
      }),

    // Get next run times
    nextRuns: protectedProcedure
      .input(
        z.object({
          cronExpression: z.string(),
          count: z.number().min(1).max(10).default(5),
          timezone: z.string().default("UTC"),
        })
      )
      .query(async (opts) => {
        const { input } = opts;
        return getNextRunTimes(input.cronExpression, input.count, input.timezone);
      }),

    // Get available task types
    types: protectedProcedure.query(() => {
      return Object.entries(TASK_TYPES).map(([key, value]) => ({
        key,
        value,
        description: getTaskTypeDescription(value),
      }));
    }),
  }),
});

/**
 * Get human-readable description for webhook events
 */
function getEventDescription(event: string): string {
  const descriptions: Record<string, string> = {
    "task.completed": "Triggered when a scheduled task completes successfully",
    "task.failed": "Triggered when a scheduled task fails",
    "task.started": "Triggered when a scheduled task starts execution",
    "project.created": "Triggered when a new project is created",
    "project.completed": "Triggered when a project generation completes",
    "project.failed": "Triggered when a project generation fails",
    "chat.message": "Triggered when a chat message is sent",
    "chat.completed": "Triggered when a chat response is completed",
    "credits.low": "Triggered when user credits are running low",
    "credits.depleted": "Triggered when user credits are depleted",
    "credits.purchased": "Triggered when user purchases credits",
  };
  
  return descriptions[event] || "No description available";
}

/**
 * Get human-readable description for task types
 */
function getTaskTypeDescription(taskType: string): string {
  const descriptions: Record<string, string> = {
    chat_completion: "Generate AI chat responses from prompts",
    project_builder: "Automatically create complete projects (books, websites, apps, etc.)",
    data_analysis: "Analyze data and generate insights",
    document_summary: "Summarize documents and long text",
    web_scraping: "Extract data from websites",
    custom_script: "Execute custom scripts",
  };
  
  return descriptions[taskType] || "No description available";
}
