/**
 * Webhook Delivery Worker
 * 
 * Handles webhook delivery with retry logic and exponential backoff
 */

import { getDb } from "../db";
import { webhooks, webhookDeliveries } from "../../drizzle/schema";
import { eq, and, lte, or, isNull, sql } from "drizzle-orm";
import { generateWebhookSignature } from "./webhooks";

/**
 * Deliver a single webhook
 */
export async function deliverWebhook(deliveryId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get delivery record
  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId))
    .limit(1);
  
  if (!delivery) {
    console.error(`[Webhook Delivery] Delivery ${deliveryId} not found`);
    return;
  }
  
  // Get webhook configuration
  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, delivery.webhookId))
    .limit(1);
  
  if (!webhook) {
    console.error(`[Webhook Delivery] Webhook ${delivery.webhookId} not found`);
    await db
      .update(webhookDeliveries)
      .set({
        status: "failed",
        errorMessage: "Webhook configuration not found",
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    return;
  }
  
  // Check if webhook is active
  if (!webhook.active) {
    console.log(`[Webhook Delivery] Webhook ${webhook.id} is inactive, skipping`);
    await db
      .update(webhookDeliveries)
      .set({
        status: "failed",
        errorMessage: "Webhook is inactive",
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    return;
  }
  
  // Prepare payload
  const payloadString = JSON.stringify(delivery.payload);
  const signature = generateWebhookSignature(payloadString, webhook.secret);
  
  // Attempt delivery
  try {
    console.log(`[Webhook Delivery] Delivering to ${webhook.url} (attempt ${delivery.attempts + 1}/${delivery.maxAttempts})`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Chofesh-Signature": signature,
        "X-Chofesh-Event": delivery.eventType,
        "X-Chofesh-Delivery-Id": delivery.id,
        "User-Agent": "Chofesh-Webhooks/1.0",
      },
      body: payloadString,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    const responseBody = await response.text();
    const truncatedBody = responseBody.substring(0, 10000); // Limit to 10KB
    
    if (response.ok) {
      // Success
      await db
        .update(webhookDeliveries)
        .set({
          status: "delivered",
          attempts: delivery.attempts + 1,
          responseStatus: response.status,
          responseBody: truncatedBody,
          deliveredAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, deliveryId));
      
      // Update webhook last delivery time
      await db
        .update(webhooks)
        .set({
          lastDeliveryAt: new Date(),
        })
        .where(eq(webhooks.id, webhook.id));
      
      console.log(`[Webhook Delivery] ✓ Successfully delivered to ${webhook.url}`);
    } else {
      // HTTP error
      throw new Error(`HTTP ${response.status}: ${truncatedBody}`);
    }
  } catch (error: any) {
    console.error(`[Webhook Delivery] ✗ Failed to deliver to ${webhook.url}:`, error.message);
    
    const newAttempts = delivery.attempts + 1;
    const shouldRetry = newAttempts < delivery.maxAttempts;
    
    if (shouldRetry) {
      // Calculate next retry time with exponential backoff
      const retryConfig = webhook.retryConfig as any || { backoffMultiplier: 2 };
      const backoffMinutes = Math.pow(retryConfig.backoffMultiplier, newAttempts); // 2, 4, 8, 16, 32 minutes
      const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
      
      await db
        .update(webhookDeliveries)
        .set({
          status: "retrying",
          attempts: newAttempts,
          errorMessage: error.message,
          nextRetryAt,
        })
        .where(eq(webhookDeliveries.id, deliveryId));
      
      console.log(`[Webhook Delivery] Will retry in ${backoffMinutes} minutes`);
    } else {
      // Max retries reached
      await db
        .update(webhookDeliveries)
        .set({
          status: "failed",
          attempts: newAttempts,
          errorMessage: error.message,
        })
        .where(eq(webhookDeliveries.id, deliveryId));
      
      console.log(`[Webhook Delivery] Max retries reached, marking as failed`);
    }
  }
}

/**
 * Process pending webhook deliveries
 * This should be called periodically (e.g., every minute)
 */
export async function processPendingWebhooks() {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  
  // Get all pending or retrying deliveries that are ready to be sent
  const pendingDeliveries = await db
    .select()
    .from(webhookDeliveries)
    .where(
      and(
        or(
          eq(webhookDeliveries.status, "pending"),
          eq(webhookDeliveries.status, "retrying")
        ),
        or(
          isNull(webhookDeliveries.nextRetryAt),
          lte(webhookDeliveries.nextRetryAt, now)
        )
      )
    )
    .limit(100); // Process up to 100 at a time
  
  if (pendingDeliveries.length === 0) {
    return;
  }
  
  console.log(`[Webhook Delivery] Processing ${pendingDeliveries.length} pending deliveries`);
  
  // Deliver webhooks in parallel (with concurrency limit)
  const CONCURRENCY = 10;
  for (let i = 0; i < pendingDeliveries.length; i += CONCURRENCY) {
    const batch = pendingDeliveries.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(delivery => deliverWebhook(delivery.id))
    );
  }
}

/**
 * Start webhook delivery worker
 * Processes pending webhooks every minute
 */
export function startWebhookDeliveryWorker() {
  console.log("[Webhook Delivery] Starting webhook delivery worker");
  
  // Process immediately on start
  processPendingWebhooks().catch(error => {
    console.error("[Webhook Delivery] Error processing webhooks:", error);
  });
  
  // Then process every minute
  const interval = setInterval(() => {
    processPendingWebhooks().catch(error => {
      console.error("[Webhook Delivery] Error processing webhooks:", error);
    });
  }, 60 * 1000); // Every minute
  
  // Return cleanup function
  return () => {
    console.log("[Webhook Delivery] Stopping webhook delivery worker");
    clearInterval(interval);
  };
}
