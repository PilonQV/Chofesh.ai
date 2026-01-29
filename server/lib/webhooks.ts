/**
 * Webhooks Management System
 * 
 * CRUD operations and utilities for managing user webhooks
 */

import { getDb } from "../db";
import { webhooks, webhookDeliveries, WEBHOOK_EVENTS, type WebhookEvent } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

/**
 * Create a new webhook
 */
export async function createWebhook(params: {
  userId: number;
  name: string;
  url: string;
  events: WebhookEvent[];
}) {
  const { userId, name, url, events } = params;
  
  // Generate a random secret for HMAC signature
  const secret = crypto.randomBytes(32).toString("hex");
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(webhooks).values({
    userId,
    name,
    url,
    secret,
    events: events as any, // Cast to any for JSON type
    active: true,
    retryConfig: {
      maxAttempts: 5,
      backoffMultiplier: 2
    } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // Get the created webhook by querying with unique fields
  const [created] = await db
    .select()
    .from(webhooks)
    .where(and(
      eq(webhooks.userId, userId),
      eq(webhooks.url, url),
      eq(webhooks.secret, secret)
    ))
    .limit(1);
  
  if (!created) {
    throw new Error("Failed to create webhook");
  }
  
  return created;
}

/**
 * Get all webhooks for a user
 */
export async function getUserWebhooks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.userId, userId))
    .orderBy(desc(webhooks.createdAt));
}

/**
 * Get a single webhook by ID
 */
export async function getWebhookById(webhookId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(and(
      eq(webhooks.id, webhookId),
      eq(webhooks.userId, userId)
    ))
    .limit(1);
  
  return webhook;
}

/**
 * Update a webhook
 */
export async function updateWebhook(params: {
  webhookId: string;
  userId: number;
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  active?: boolean;
}) {
  const { webhookId, userId, ...updates } = params;
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(webhooks)
    .set({
      ...updates,
      events: updates.events as any,
      updatedAt: new Date(),
    })
    .where(and(
      eq(webhooks.id, webhookId),
      eq(webhooks.userId, userId)
    ));
  
  return await getWebhookById(webhookId, userId);
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(webhooks)
    .where(and(
      eq(webhooks.id, webhookId),
      eq(webhooks.userId, userId)
    ));
}

/**
 * Regenerate webhook secret
 */
export async function regenerateWebhookSecret(webhookId: string, userId: number) {
  const secret = crypto.randomBytes(32).toString("hex");
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(webhooks)
    .set({
      secret,
      updatedAt: new Date(),
    })
    .where(and(
      eq(webhooks.id, webhookId),
      eq(webhooks.userId, userId)
    ));
  
  return secret;
}

/**
 * Get webhook deliveries for a webhook
 */
export async function getWebhookDeliveries(options: {
  webhookId?: string;
  status?: string;
  limit?: number;
}) {
  const { webhookId, status, limit = 50 } = options;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (webhookId) {
    conditions.push(eq(webhookDeliveries.webhookId, webhookId));
  }
  if (status) {
    conditions.push(eq(webhookDeliveries.status, status as any));
  }
  
  const query = db
    .select()
    .from(webhookDeliveries)
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(limit);
  
  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }
  
  return await query;
}

/**
 * Get all active webhooks subscribed to a specific event
 */
export async function getWebhooksForEvent(eventType: WebhookEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allWebhooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.active, true));
  
  // Filter webhooks that are subscribed to this event
  return allWebhooks.filter((webhook: any) => {
    const events = webhook.events as string[];
    return events.includes(eventType);
  });
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Test a webhook by sending a test payload
 */
export async function testWebhook(webhookId: string, userId: number) {
  const webhook = await getWebhookById(webhookId, userId);
  
  if (!webhook) {
    throw new Error("Webhook not found");
  }
  
  const testPayload = {
    event: "webhook.test",
    timestamp: new Date().toISOString(),
    data: {
      message: "This is a test webhook from Chofesh.ai",
      webhookId: webhook.id,
      webhookName: webhook.name,
    }
  };
  
  // Trigger webhook delivery
  await triggerWebhook(webhook.id, "webhook.test" as WebhookEvent, testPayload);
  
  return { success: true, message: "Test webhook queued for delivery" };
}

/**
 * Trigger a webhook event
 * This queues the webhook for delivery
 */
export async function triggerWebhook(
  webhookId: string,
  eventType: WebhookEvent,
  payload: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [delivery] = await db.insert(webhookDeliveries).values({
    webhookId,
    eventType,
    payload: payload as any,
    status: "pending",
    attempts: 0,
    maxAttempts: 5,
    createdAt: new Date(),
    nextRetryAt: new Date(), // Deliver immediately
  });
  
  return delivery;
}

/**
 * Trigger webhooks for all subscribers of an event
 */
export async function triggerWebhooksForEvent(eventType: WebhookEvent, payload: any) {
  const webhooksToTrigger = await getWebhooksForEvent(eventType);
  
  const deliveries = await Promise.all(
    webhooksToTrigger.map((webhook: any) => 
      triggerWebhook(webhook.id, eventType, payload)
    )
  );
  
  console.log(`[Webhooks] Triggered ${deliveries.length} webhooks for event: ${eventType}`);
  
  return deliveries;
}

/**
 * Available webhook events
 */
export { WEBHOOK_EVENTS };
export type { WebhookEvent };
