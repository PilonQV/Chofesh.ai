/**
 * Audit Logger - Logs API calls and image access for admin review.
 * Stores full prompts and responses in plain text for readability.
 */

import { logApiCall, logImageAccess } from "../db";
import type { InsertApiCallLog, InsertImageAccessLog } from "../../drizzle/schema";

export type ApiCallLogInput = {
  userId: number;
  userEmail?: string;
  userName?: string;
  actionType: "chat" | "image_generation" | "image_edit" | "document_chat" | "code_review" | "web_search" | "voice_transcription" | "embedding";
  modelUsed?: string;
  prompt?: string;
  systemPrompt?: string;
  response?: string;
  tokensInput?: number;
  tokensOutput?: number;
  durationMs?: number;
  conversationId?: string;
  personaUsed?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: "success" | "error" | "rate_limited";
  errorMessage?: string;
  usedFallback?: boolean; // True if auto-fallback to uncensored model was used
  isUncensored?: boolean; // True if using uncensored model or NSFW content
};

export type ImageAccessLogInput = {
  userId: number;
  userEmail?: string;
  imageUrl: string;
  imageKey?: string;
  prompt?: string;
  actionType: "generate" | "view" | "download" | "delete";
  ipAddress?: string;
};

/**
 * Log an API call for audit purposes.
 * Call this after each LLM/AI API call completes.
 */
export async function auditLogApiCall(input: ApiCallLogInput): Promise<void> {
  const log: InsertApiCallLog = {
    userId: input.userId,
    userEmail: input.userEmail || null,
    userName: input.userName || null,
    actionType: input.actionType,
    modelUsed: input.modelUsed || null,
    prompt: input.prompt || null,
    systemPrompt: input.systemPrompt || null,
    response: input.response || null,
    tokensInput: input.tokensInput || null,
    tokensOutput: input.tokensOutput || null,
    durationMs: input.durationMs || null,
    conversationId: input.conversationId || null,
    personaUsed: input.personaUsed || null,
    ipAddress: input.ipAddress || null,
    userAgent: input.userAgent || null,
    status: input.status || "success",
    errorMessage: input.errorMessage || null,
    isUncensored: input.isUncensored || false,
  };
  
  // Log asynchronously to not block the response
  logApiCall(log).catch(err => {
    console.error("[AuditLogger] Failed to log API call:", err);
  });
}

/**
 * Log image access for audit purposes.
 * Call this when images are generated, viewed, downloaded, or deleted.
 */
export async function auditLogImageAccess(input: ImageAccessLogInput): Promise<void> {
  const log: InsertImageAccessLog = {
    userId: input.userId,
    userEmail: input.userEmail || null,
    imageUrl: input.imageUrl,
    imageKey: input.imageKey || null,
    prompt: input.prompt || null,
    actionType: input.actionType,
    ipAddress: input.ipAddress || null,
  };
  
  // Log asynchronously to not block the response
  logImageAccess(log).catch(err => {
    console.error("[AuditLogger] Failed to log image access:", err);
  });
}

/**
 * Helper to truncate long text for logging while preserving readability.
 * Use this if you want to limit storage but still keep logs readable.
 */
export function truncateForLog(text: string | undefined | null, maxLength: number = 10000): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + `... [truncated, ${text.length - maxLength} chars omitted]`;
}

/**
 * Extract IP address from request headers.
 */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ip.trim();
  }
  return req.headers["x-real-ip"] as string || "unknown";
}

/**
 * Extract user agent from request headers.
 */
export function getUserAgent(req: { headers: Record<string, string | string[] | undefined> }): string {
  const ua = req.headers["user-agent"];
  return (Array.isArray(ua) ? ua[0] : ua) || "unknown";
}
