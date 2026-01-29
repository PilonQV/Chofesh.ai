/**
 * Database Schema for Webhooks & Scheduled Tasks
 * 
 * Enables automation and integrations with external platforms
 */

import { mysqlTable, text, timestamp, int, boolean, json, varchar, index } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Webhooks Table
 * 
 * Stores user-configured webhooks for receiving real-time notifications
 */
export const webhooks = mysqlTable("webhooks", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Webhook configuration
  name: text("name").notNull(), // User-friendly name
  url: text("url").notNull(), // Endpoint URL to call
  secret: text("secret").notNull(), // HMAC secret for signature verification
  
  // Event subscriptions (array of event types)
  events: json("events").notNull().$type<string[]>(), // ["task.completed", "project.created", etc.]
  
  // Status and configuration
  active: boolean("active").notNull().default(true),
  retryConfig: json("retry_config").$type<{
    maxAttempts: number;
    backoffMultiplier: number;
  }>(),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastDeliveryAt: timestamp("last_delivery_at"),
}, (table) => ({
  userIdIdx: index("webhooks_user_id_idx").on(table.userId),
  activeIdx: index("webhooks_active_idx").on(table.active),
}));

/**
 * Webhook Deliveries Table
 * 
 * Tracks all webhook delivery attempts and their results
 */
export const webhookDeliveries = mysqlTable("webhook_deliveries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  webhookId: varchar("webhook_id", { length: 36 }).notNull().references(() => webhooks.id, { onDelete: "cascade" }),
  
  // Event details
  eventType: text("event_type").notNull(), // "task.completed", "project.created", etc.
  payload: json("payload").notNull(), // Full event payload
  
  // Delivery status
  status: text("status").notNull().default("pending"), // "pending", "delivered", "failed", "retrying"
  attempts: int("attempts").notNull().default(0),
  maxAttempts: int("max_attempts").notNull().default(5),
  
  // Response tracking
  responseStatus: int("response_status"), // HTTP status code
  responseBody: text("response_body"), // Response body (truncated to 10KB)
  errorMessage: text("error_message"),
  
  // Timing
  createdAt: timestamp("created_at").notNull().defaultNow(),
  nextRetryAt: timestamp("next_retry_at"),
  deliveredAt: timestamp("delivered_at"),
}, (table) => ({
  webhookIdIdx: index("webhook_deliveries_webhook_id_idx").on(table.webhookId),
  statusIdx: index("webhook_deliveries_status_idx").on(table.status),
  nextRetryIdx: index("webhook_deliveries_next_retry_idx").on(table.nextRetryAt),
}));

/**
 * Scheduled Tasks Table
 * 
 * Stores user-configured recurring tasks
 */
export const scheduledTasks = mysqlTable("scheduled_tasks", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Task configuration
  name: text("name").notNull(), // User-friendly name
  description: text("description"),
  scheduleCron: text("schedule_cron").notNull(), // Cron expression (e.g., "0 9 * * 1-5")
  timezone: text("timezone").notNull().default("UTC"), // User's timezone
  
  // Task type and configuration
  taskType: text("task_type").notNull(), // "chat_completion", "project_builder", "data_analysis"
  taskConfig: json("task_config").notNull().$type<{
    prompt?: string;
    model?: string;
    projectType?: string;
    [key: string]: any;
  }>(),
  
  // Execution settings
  active: boolean("active").notNull().default(true),
  timeoutMinutes: int("timeout_minutes").notNull().default(5),
  notifyOnComplete: boolean("notify_on_complete").notNull().default(true),
  notifyOnError: boolean("notify_on_error").notNull().default(true),
  
  // Scheduling state
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at").notNull(),
  lastStatus: text("last_status"), // "success", "error", "timeout"
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("scheduled_tasks_user_id_idx").on(table.userId),
  activeIdx: index("scheduled_tasks_active_idx").on(table.active),
  nextRunIdx: index("scheduled_tasks_next_run_idx").on(table.nextRunAt),
}));

/**
 * Task Executions Table
 * 
 * Tracks all scheduled task execution attempts and their results
 */
export const taskExecutions = mysqlTable("task_executions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: varchar("task_id", { length: 36 }).notNull().references(() => scheduledTasks.id, { onDelete: "cascade" }),
  
  // Execution status
  status: text("status").notNull().default("pending"), // "pending", "running", "completed", "failed", "timeout", "cancelled"
  
  // Result data
  result: json("result"), // Task output/result
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  
  // Timing
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  durationMs: int("duration_ms"),
  
  // Metadata
  triggeredBy: text("triggered_by").notNull().default("scheduler"), // "scheduler", "manual", "api"
}, (table) => ({
  taskIdIdx: index("task_executions_task_id_idx").on(table.taskId),
  statusIdx: index("task_executions_status_idx").on(table.status),
  startedAtIdx: index("task_executions_started_at_idx").on(table.startedAt),
}));

/**
 * Webhook Events Enum
 * 
 * Available webhook event types
 */
export const WEBHOOK_EVENTS = {
  // Task events
  TASK_COMPLETED: "task.completed",
  TASK_FAILED: "task.failed",
  TASK_STARTED: "task.started",
  
  // Project events
  PROJECT_CREATED: "project.created",
  PROJECT_COMPLETED: "project.completed",
  PROJECT_FAILED: "project.failed",
  
  // Chat events
  CHAT_MESSAGE: "chat.message",
  CHAT_COMPLETED: "chat.completed",
  
  // Credit events
  CREDITS_LOW: "credits.low",
  CREDITS_DEPLETED: "credits.depleted",
  CREDITS_PURCHASED: "credits.purchased",
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

/**
 * Task Types Enum
 * 
 * Available scheduled task types
 */
export const TASK_TYPES = {
  CHAT_COMPLETION: "chat_completion",
  PROJECT_BUILDER: "project_builder",
  DATA_ANALYSIS: "data_analysis",
  DOCUMENT_SUMMARY: "document_summary",
  WEB_SCRAPING: "web_scraping",
  CUSTOM_SCRIPT: "custom_script",
} as const;

export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES];
