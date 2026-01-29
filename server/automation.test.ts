/**
 * Automation System Tests
 * 
 * Tests for webhooks and scheduled tasks functionality
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  createWebhook,
  getUserWebhooks,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  WEBHOOK_EVENTS,
} from "./lib/webhooks";
import {
  createScheduledTask,
  getUserScheduledTasks,
  updateScheduledTask,
  deleteScheduledTask,
  validateCronExpression,
  getNextRunTimes,
  TASK_TYPES,
} from "./lib/scheduledTasks";

describe("Webhooks System", () => {
  const testUserId = 1;
  let webhookId: string;

  it("should create a webhook", async () => {
    const webhook = await createWebhook({
      userId: testUserId,
      name: "Test Webhook",
      url: "https://webhook.site/test",
      events: [WEBHOOK_EVENTS.TASK_COMPLETED, WEBHOOK_EVENTS.TASK_FAILED],
    });

    expect(webhook).toBeDefined();
    expect(webhook.name).toBe("Test Webhook");
    expect(webhook.url).toBe("https://webhook.site/test");
    expect(webhook.secret).toBeDefined();
    expect(webhook.secret.length).toBe(64);
    
    webhookId = webhook.id;
  });

  it("should list user webhooks", async () => {
    const webhooks = await getUserWebhooks(testUserId);
    
    expect(webhooks).toBeDefined();
    expect(Array.isArray(webhooks)).toBe(true);
    expect(webhooks.length).toBeGreaterThan(0);
  });

  it("should update a webhook", async () => {
    const updated = await updateWebhook({
      webhookId,
      userId: testUserId,
      name: "Updated Webhook",
      active: false,
    });

    expect(updated).toBeDefined();
    expect(updated.name).toBe("Updated Webhook");
    expect(updated.active).toBe(false);
  });

  it("should test a webhook", async () => {
    const result = await testWebhook(webhookId, testUserId);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should delete a webhook", async () => {
    await deleteWebhook(webhookId, testUserId);
    
    const webhooks = await getUserWebhooks(testUserId);
    const found = webhooks.find((w: any) => w.id === webhookId);
    
    expect(found).toBeUndefined();
  });
});

describe("Scheduled Tasks System", () => {
  const testUserId = 1;
  let taskId: string;

  it("should validate cron expressions", () => {
    // Valid expressions
    const valid1 = validateCronExpression("0 9 * * 1-5"); // Every weekday at 9am
    expect(valid1.valid).toBe(true);
    expect(valid1.nextRuns).toBeDefined();
    expect(valid1.nextRuns?.length).toBe(5);

    const valid2 = validateCronExpression("*/15 * * * *"); // Every 15 minutes
    expect(valid2.valid).toBe(true);

    // Invalid expression
    const invalid = validateCronExpression("invalid cron");
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toBeDefined();
  });

  it("should calculate next run times", () => {
    const nextRuns = getNextRunTimes("0 9 * * 1-5", 3); // Next 3 weekdays at 9am
    
    expect(nextRuns).toBeDefined();
    expect(nextRuns.length).toBe(3);
    expect(nextRuns[0]).toBeInstanceOf(Date);
  });

  it("should create a scheduled task", async () => {
    const task = await createScheduledTask({
      userId: testUserId,
      name: "Daily Summary",
      description: "Generate daily summary report",
      scheduleCron: "0 9 * * *", // Every day at 9am
      timezone: "UTC",
      taskType: TASK_TYPES.CHAT_COMPLETION,
      taskConfig: {
        prompt: "Generate a daily summary of key events",
        model: "gpt-4o-mini",
      },
      timeoutMinutes: 5,
      notifyOnComplete: true,
      notifyOnError: true,
    });

    expect(task).toBeDefined();
    expect(task.name).toBe("Daily Summary");
    expect(task.scheduleCron).toBe("0 9 * * *");
    expect(task.nextRunAt).toBeInstanceOf(Date);
    
    taskId = task.id;
  });

  it("should list user scheduled tasks", async () => {
    const tasks = await getUserScheduledTasks(testUserId);
    
    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("should update a scheduled task", async () => {
    const updated = await updateScheduledTask({
      taskId,
      userId: testUserId,
      name: "Updated Daily Summary",
      scheduleCron: "0 10 * * *", // Changed to 10am
      active: false,
    });

    expect(updated).toBeDefined();
    expect(updated.name).toBe("Updated Daily Summary");
    expect(updated.scheduleCron).toBe("0 10 * * *");
    expect(updated.active).toBe(false);
  });

  it("should delete a scheduled task", async () => {
    await deleteScheduledTask(taskId, testUserId);
    
    const tasks = await getUserScheduledTasks(testUserId);
    const found = tasks.find((t: any) => t.id === taskId);
    
    expect(found).toBeUndefined();
  });
});

describe("Task Types", () => {
  it("should have all required task types", () => {
    expect(TASK_TYPES.CHAT_COMPLETION).toBe("chat_completion");
    expect(TASK_TYPES.PROJECT_BUILDER).toBe("project_builder");
    expect(TASK_TYPES.DATA_ANALYSIS).toBe("data_analysis");
    expect(TASK_TYPES.DOCUMENT_SUMMARY).toBe("document_summary");
    expect(TASK_TYPES.WEB_SCRAPING).toBe("web_scraping");
    expect(TASK_TYPES.CUSTOM_SCRIPT).toBe("custom_script");
  });
});

describe("Webhook Events", () => {
  it("should have all required webhook events", () => {
    expect(WEBHOOK_EVENTS.TASK_COMPLETED).toBe("task.completed");
    expect(WEBHOOK_EVENTS.TASK_FAILED).toBe("task.failed");
    expect(WEBHOOK_EVENTS.TASK_STARTED).toBe("task.started");
    expect(WEBHOOK_EVENTS.PROJECT_CREATED).toBe("project.created");
    expect(WEBHOOK_EVENTS.PROJECT_COMPLETED).toBe("project.completed");
    expect(WEBHOOK_EVENTS.PROJECT_FAILED).toBe("project.failed");
  });
});

console.log("✅ All automation tests configured");
