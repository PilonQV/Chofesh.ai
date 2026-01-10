/**
 * Provider Usage Analytics Service
 * 
 * Tracks AI provider usage and provides analytics for the admin dashboard
 */

import { getDb } from "../db";
import { providerUsage, providerUsageDaily } from "../../drizzle/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";

export interface TrackUsageParams {
  userId?: number;
  provider: string;
  model: string;
  modelTier?: "free" | "standard" | "premium";
  actionType?: "chat" | "image" | "search" | "code" | "document";
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
  costSaved?: string;
}

/**
 * Track a single provider usage event
 */
export async function trackProviderUsage(params: TrackUsageParams): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return; // Silently fail if DB not available
    
    await db.insert(providerUsage).values({
      userId: params.userId || null,
      provider: params.provider,
      model: params.model,
      modelTier: params.modelTier || "free",
      actionType: params.actionType || "chat",
      inputTokens: params.inputTokens || 0,
      outputTokens: params.outputTokens || 0,
      totalTokens: params.totalTokens || 0,
      latencyMs: params.latencyMs,
      success: params.success !== false,
      errorMessage: params.errorMessage,
      costSaved: params.costSaved,
    });
  } catch (error) {
    // Don't throw - analytics should not break the main flow
    console.error("Failed to track provider usage:", error);
  }
}

/**
 * Get provider usage statistics for a time range
 */
export async function getProviderStats(
  startDate: Date,
  endDate: Date
): Promise<{
  byProvider: { provider: string; count: number; tokens: number }[];
  byModel: { model: string; provider: string; count: number }[];
  totalRequests: number;
  totalTokens: number;
  freeVsPaid: { free: number; paid: number };
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get stats by provider
  const byProvider = await db
    .select({
      provider: providerUsage.provider,
      count: sql<number>`COUNT(*)`,
      tokens: sql<number>`SUM(${providerUsage.totalTokens})`,
    })
    .from(providerUsage)
    .where(
      and(
        gte(providerUsage.timestamp, startDate),
        lte(providerUsage.timestamp, endDate)
      )
    )
    .groupBy(providerUsage.provider)
    .orderBy(desc(sql`COUNT(*)`));

  // Get stats by model
  const byModel = await db
    .select({
      model: providerUsage.model,
      provider: providerUsage.provider,
      count: sql<number>`COUNT(*)`,
    })
    .from(providerUsage)
    .where(
      and(
        gte(providerUsage.timestamp, startDate),
        lte(providerUsage.timestamp, endDate)
      )
    )
    .groupBy(providerUsage.model, providerUsage.provider)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(20);

  // Get free vs paid breakdown
  const tierStats = await db
    .select({
      tier: providerUsage.modelTier,
      count: sql<number>`COUNT(*)`,
    })
    .from(providerUsage)
    .where(
      and(
        gte(providerUsage.timestamp, startDate),
        lte(providerUsage.timestamp, endDate)
      )
    )
    .groupBy(providerUsage.modelTier);

  const freeCount = tierStats.find(t => t.tier === "free")?.count || 0;
  const paidCount = tierStats.filter(t => t.tier !== "free").reduce((sum, t) => sum + t.count, 0);

  // Calculate totals
  const totalRequests = byProvider.reduce((sum, p) => sum + p.count, 0);
  const totalTokens = byProvider.reduce((sum, p) => sum + (p.tokens || 0), 0);

  return {
    byProvider,
    byModel,
    totalRequests,
    totalTokens,
    freeVsPaid: { free: freeCount, paid: paidCount },
  };
}

/**
 * Get popular models for the last N days
 */
export async function getPopularModels(days: number = 7): Promise<{
  model: string;
  provider: string;
  count: number;
  tier: string;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db
    .select({
      model: providerUsage.model,
      provider: providerUsage.provider,
      tier: providerUsage.modelTier,
      count: sql<number>`COUNT(*)`,
    })
    .from(providerUsage)
    .where(gte(providerUsage.timestamp, startDate))
    .groupBy(providerUsage.model, providerUsage.provider, providerUsage.modelTier)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return results;
}

/**
 * Get cost savings from free tier usage
 */
export async function getCostSavings(
  startDate: Date,
  endDate: Date
): Promise<{
  totalSaved: number;
  byProvider: { provider: string; saved: number }[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select({
      provider: providerUsage.provider,
      saved: sql<string>`SUM(CAST(${providerUsage.costSaved} AS DECIMAL(10,6)))`,
    })
    .from(providerUsage)
    .where(
      and(
        gte(providerUsage.timestamp, startDate),
        lte(providerUsage.timestamp, endDate),
        eq(providerUsage.modelTier, "free")
      )
    )
    .groupBy(providerUsage.provider);

  const byProvider = results.map(r => ({
    provider: r.provider,
    saved: parseFloat(r.saved || "0"),
  }));

  const totalSaved = byProvider.reduce((sum, p) => sum + p.saved, 0);

  return { totalSaved, byProvider };
}

/**
 * Get usage trend data for charts
 */
export async function getUsageTrend(
  days: number = 30
): Promise<{
  date: string;
  requests: number;
  tokens: number;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db
    .select({
      date: sql<string>`DATE(${providerUsage.timestamp})`,
      requests: sql<number>`COUNT(*)`,
      tokens: sql<number>`SUM(${providerUsage.totalTokens})`,
    })
    .from(providerUsage)
    .where(gte(providerUsage.timestamp, startDate))
    .groupBy(sql`DATE(${providerUsage.timestamp})`)
    .orderBy(sql`DATE(${providerUsage.timestamp})`);

  return results.map(r => ({
    date: r.date,
    requests: r.requests,
    tokens: r.tokens || 0,
  }));
}

/**
 * Estimate cost saved based on model pricing
 */
export function estimateCostSaved(
  model: string,
  inputTokens: number,
  outputTokens: number
): string {
  // Approximate pricing per 1K tokens (in USD)
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 0.005, output: 0.015 },
    "gpt-4": { input: 0.03, output: 0.06 },
    "claude-3-opus": { input: 0.015, output: 0.075 },
    "claude-3-sonnet": { input: 0.003, output: 0.015 },
    "llama-3.1-405b": { input: 0.003, output: 0.003 },
    "llama-3.3-70b": { input: 0.0008, output: 0.0008 },
    "deepseek-r1": { input: 0.0014, output: 0.0028 },
    default: { input: 0.001, output: 0.002 },
  };

  // Find matching pricing or use default
  const modelKey = Object.keys(pricing).find(k => model.toLowerCase().includes(k)) || "default";
  const price = pricing[modelKey];

  const inputCost = (inputTokens / 1000) * price.input;
  const outputCost = (outputTokens / 1000) * price.output;
  const totalSaved = inputCost + outputCost;

  return totalSaved.toFixed(6);
}
