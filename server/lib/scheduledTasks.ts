/**
 * Scheduled Tasks Management System
 * 
 * CRUD operations and utilities for managing user scheduled tasks
 */

import { getDb } from "../db";
import { scheduledTasks, taskExecutions, TASK_TYPES, type TaskType } from "../../drizzle/schema";
import { eq, and, desc, lte } from "drizzle-orm";
import * as cronParser from "cron-parser";

/**
 * Create a new scheduled task
 */
export async function createScheduledTask(params: {
  userId: number;
  name: string;
  description?: string;
  scheduleCron: string;
  timezone?: string;
  taskType: TaskType;
  taskConfig: Record<string, any>;
  timeoutMinutes?: number;
  notifyOnComplete?: boolean;
  notifyOnError?: boolean;
}) {
  const {
    userId,
    name,
    description,
    scheduleCron,
    timezone = "UTC",
    taskType,
    taskConfig,
    timeoutMinutes = 5,
    notifyOnComplete = true,
    notifyOnError = true,
  } = params;
  
  // Validate cron expression
  try {
    cronParser.CronExpressionParser.parse(scheduleCron, { tz: timezone });
  } catch (error: any) {
    throw new Error(`Invalid cron expression: ${error.message}`);
  }
  
  // Calculate next run time
  const nextRunAt = getNextRunTime(scheduleCron, timezone);
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(scheduledTasks).values({
    userId,
    name,
    description: description || null,
    scheduleCron,
    timezone,
    taskType,
    taskConfig: taskConfig as any,
    active: true,
    timeoutMinutes,
    notifyOnComplete,
    notifyOnError,
    nextRunAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // Get the created task by querying with unique fields
  const [created] = await db
    .select()
    .from(scheduledTasks)
    .where(and(
      eq(scheduledTasks.userId, userId),
      eq(scheduledTasks.name, name),
      eq(scheduledTasks.scheduleCron, scheduleCron)
    ))
    .orderBy(desc(scheduledTasks.createdAt))
    .limit(1);
  
  if (!created) {
    throw new Error("Failed to create scheduled task");
  }
  
  return created;
}

/**
 * Get all scheduled tasks for a user
 */
export async function getUserScheduledTasks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(scheduledTasks)
    .where(eq(scheduledTasks.userId, userId))
    .orderBy(desc(scheduledTasks.createdAt));
}

/**
 * Get a single scheduled task by ID
 */
export async function getScheduledTaskById(taskId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [task] = await db
    .select()
    .from(scheduledTasks)
    .where(and(
      eq(scheduledTasks.id, taskId),
      eq(scheduledTasks.userId, userId)
    ))
    .limit(1);
  
  return task;
}

/**
 * Update a scheduled task
 */
export async function updateScheduledTask(params: {
  taskId: string;
  userId: number;
  name?: string;
  description?: string;
  scheduleCron?: string;
  timezone?: string;
  taskType?: TaskType;
  taskConfig?: Record<string, any>;
  active?: boolean;
  timeoutMinutes?: number;
  notifyOnComplete?: boolean;
  notifyOnError?: boolean;
}) {
  const { taskId, userId, scheduleCron, timezone, ...updates } = params;
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If cron or timezone changed, validate and recalculate next run
  let nextRunAt: Date | undefined;
  if (scheduleCron || timezone) {
    const task = await getScheduledTaskById(taskId, userId);
    if (!task) throw new Error("Task not found");
    
    const newCron = scheduleCron || task.scheduleCron;
    const newTimezone = timezone || task.timezone;
    
    try {
      cronParser.CronExpressionParser.parse(newCron, { tz: newTimezone });
    } catch (error: any) {
      throw new Error(`Invalid cron expression: ${error.message}`);
    }
    
    nextRunAt = getNextRunTime(newCron, newTimezone);
  }
  
  await db
    .update(scheduledTasks)
    .set({
      ...updates,
      scheduleCron,
      timezone,
      taskConfig: updates.taskConfig as any,
      nextRunAt,
      updatedAt: new Date(),
    })
    .where(and(
      eq(scheduledTasks.id, taskId),
      eq(scheduledTasks.userId, userId)
    ));
  
  return await getScheduledTaskById(taskId, userId);
}

/**
 * Delete a scheduled task
 */
export async function deleteScheduledTask(taskId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(scheduledTasks)
    .where(and(
      eq(scheduledTasks.id, taskId),
      eq(scheduledTasks.userId, userId)
    ));
}

/**
 * Get task executions for a task
 */
export async function getTaskExecutions(taskId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(taskExecutions)
    .where(eq(taskExecutions.taskId, taskId))
    .orderBy(desc(taskExecutions.startedAt))
    .limit(limit);
}

/**
 * Get next run time for a cron expression
 */
export function getNextRunTime(cronExpression: string, timezone: string = "UTC"): Date {
  const interval = cronParser.CronExpressionParser.parse(cronExpression, {
    tz: timezone,
    currentDate: new Date(),
  });
  return interval.next().toDate();
}

/**
 * Get next N run times for a cron expression
 */
export function getNextRunTimes(
  cronExpression: string,
  count: number = 5,
  timezone: string = "UTC"
): Date[] {
  const times: Date[] = [];
  const interval = cronParser.CronExpressionParser.parse(cronExpression, {
    tz: timezone,
    currentDate: new Date(),
  });
  
  for (let i = 0; i < count; i++) {
    times.push(interval.next().toDate());
  }
  
  return times;
}

/**
 * Validate cron expression
 */
export function validateCronExpression(
  cronExpression: string,
  timezone: string = "UTC"
): { valid: boolean; error?: string; nextRuns?: Date[] } {
  try {
    const nextRuns = getNextRunTimes(cronExpression, 5, timezone);
    return { valid: true, nextRuns };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get tasks that are due to run
 */
export async function getDueTasks() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return await db
    .select()
    .from(scheduledTasks)
    .where(and(
      eq(scheduledTasks.active, true),
      lte(scheduledTasks.nextRunAt, now)
    ))
    .limit(100); // Process up to 100 at a time
}

/**
 * Mark task as executed and calculate next run time
 */
export async function markTaskExecuted(taskId: string, status: "success" | "error" | "timeout") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [task] = await db
    .select()
    .from(scheduledTasks)
    .where(eq(scheduledTasks.id, taskId))
    .limit(1);
  
  if (!task) return;
  
  const nextRunAt = getNextRunTime(task.scheduleCron, task.timezone);
  
  await db
    .update(scheduledTasks)
    .set({
      lastRunAt: new Date(),
      nextRunAt,
      lastStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(scheduledTasks.id, taskId));
}

/**
 * Create task execution record
 */
export async function createTaskExecution(params: {
  taskId: string;
  triggeredBy?: "scheduler" | "manual" | "api";
}) {
  const { taskId, triggeredBy = "scheduler" } = params;
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [execution] = await db.insert(taskExecutions).values({
    taskId,
    status: "pending",
    startedAt: new Date(),
    triggeredBy,
  });
  
  return execution;
}

/**
 * Update task execution status
 */
export async function updateTaskExecution(params: {
  executionId: string;
  status: "running" | "completed" | "failed" | "timeout" | "cancelled";
  result?: any;
  errorMessage?: string;
  errorStack?: string;
}) {
  const { executionId, status, result, errorMessage, errorStack } = params;
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [execution] = await db
    .select()
    .from(taskExecutions)
    .where(eq(taskExecutions.id, executionId))
    .limit(1);
  
  if (!execution) return;
  
  const completedAt = ["completed", "failed", "timeout", "cancelled"].includes(status)
    ? new Date()
    : undefined;
  
  const durationMs = completedAt && execution.startedAt
    ? completedAt.getTime() - new Date(execution.startedAt).getTime()
    : undefined;
  
  await db
    .update(taskExecutions)
    .set({
      status,
      result: result as any,
      errorMessage,
      errorStack,
      completedAt,
      durationMs,
    })
    .where(eq(taskExecutions.id, executionId));
}

/**
 * Available task types
 */
export { TASK_TYPES };
export type { TaskType };
