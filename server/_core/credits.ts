import { getDb } from "../db";
import { userCredits, creditTransactions, creditCosts, creditPacks } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

// Credit costs by action and tier (fallback if not in DB)
const DEFAULT_CREDIT_COSTS: Record<string, Record<string, number>> = {
  chat: {
    free: 1,
    standard: 2,
    premium: 8,
    uncensored: 3,
  },
  image_generation: {
    standard: 8,
    premium: 20,
    uncensored: 10,
  },
  document_chat: { default: 3 },
  image_upscale: { default: 4 },
  voice_transcription: { default: 2 },
  voice_synthesis: { default: 2 },
};

// Model tier mapping
const MODEL_TIERS: Record<string, string> = {
  // Free tier (Groq)
  "llama-3.1-8b": "free",
  "llama-3.1-70b": "free",
  "llama-3.3-70b": "free",
  "mixtral-8x7b": "free",
  "deepseek-r1-distill-llama-70b": "free",
  // Standard tier
  "gpt-4o-mini": "standard",
  "grok-3-fast": "standard",
  // Premium tier
  "gpt-4o": "premium",
  "claude-3-5-sonnet": "premium",
  "claude-3-opus": "premium",
  "o1-mini": "premium",
  "o1-preview": "premium",
  // Uncensored tier
  "venice-uncensored": "uncensored",
  "dolphin-mixtral": "uncensored",
};

// Image model tier mapping
const IMAGE_MODEL_TIERS: Record<string, string> = {
  "flux": "standard",
  "flux-pro": "premium",
  "dall-e-3": "premium",
  "lustify-sdxl": "uncensored",
  "lustify-v7": "uncensored",
};

/**
 * Get or create user credits record
 */
export async function getUserCredits(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [existing] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId));

  if (existing) {
    // Check if free credits need refresh (daily)
    const lastRefresh = new Date(existing.freeCreditsLastRefresh);
    const now = new Date();
    const hoursSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceRefresh >= 24) {
      // Refresh free credits
      const dbRef = await getDb();
      if (!dbRef) throw new Error("Database not available");
      await dbRef
        .update(userCredits)
        .set({
          freeCredits: 30,
          freeCreditsLastRefresh: now,
        })
        .where(eq(userCredits.userId, userId));
      
      // Log the refresh
      await dbRef.insert(creditTransactions).values({
        userId,
        type: "daily_refresh",
        amount: 30,
        balanceAfter: 30 + existing.purchasedCredits,
        creditSource: "free",
        description: "Daily free credits refresh",
      });
      
      return {
        ...existing,
        freeCredits: 30,
        freeCreditsLastRefresh: now,
        totalCredits: 30 + existing.purchasedCredits,
      };
    }
    
    return {
      ...existing,
      totalCredits: existing.freeCredits + existing.purchasedCredits,
    };
  }

  // Create new credits record with 30 free credits
  const [newCredits] = await db
    .insert(userCredits)
    .values({
      userId,
      freeCredits: 30,
      purchasedCredits: 0,
    })
    .$returningId();

  return {
    id: newCredits.id,
    userId,
    freeCredits: 30,
    purchasedCredits: 0,
    totalCredits: 30,
    totalCreditsUsed: 0,
    totalCreditsPurchased: 0,
    freeCreditsLastRefresh: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get credit cost for an action
 */
export async function getCreditCost(
  actionType: string,
  model?: string
): Promise<number> {
  // Determine tier from model
  let tier = "default";
  if (model) {
    if (actionType === "image_generation") {
      tier = IMAGE_MODEL_TIERS[model] || "standard";
    } else {
      tier = MODEL_TIERS[model] || "standard";
    }
  }

  // Try to get from database first
  const db = await getDb();
  if (!db) return DEFAULT_CREDIT_COSTS[actionType]?.[tier] || 1;
  
  const [dbCost] = await db
    .select()
    .from(creditCosts)
    .where(
      and(
        eq(creditCosts.actionType, actionType),
        eq(creditCosts.isActive, true),
        model ? eq(creditCosts.modelTier, tier) : sql`${creditCosts.modelTier} IS NULL`
      )
    );

  if (dbCost) {
    return dbCost.credits;
  }

  // Fallback to default costs
  const actionCosts = DEFAULT_CREDIT_COSTS[actionType];
  if (actionCosts) {
    return actionCosts[tier] || actionCosts.default || 1;
  }

  return 1; // Default to 1 credit
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(
  userId: number,
  requiredCredits: number
): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits.totalCredits >= requiredCredits;
}

/**
 * Deduct credits from user account
 * Uses free credits first, then purchased credits
 */
export async function deductCredits(
  userId: number,
  amount: number,
  actionType: string,
  model?: string,
  description?: string
): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
  const credits = await getUserCredits(userId);
  
  if (credits.totalCredits < amount) {
    return {
      success: false,
      remainingCredits: credits.totalCredits,
      error: `Insufficient credits. Need ${amount}, have ${credits.totalCredits}`,
    };
  }

  // Calculate how much to deduct from each source
  let freeDeduction = 0;
  let purchasedDeduction = 0;

  if (credits.freeCredits >= amount) {
    // All from free credits
    freeDeduction = amount;
  } else {
    // Use all free credits, rest from purchased
    freeDeduction = credits.freeCredits;
    purchasedDeduction = amount - freeDeduction;
  }

  // Update credits
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(userCredits)
    .set({
      freeCredits: credits.freeCredits - freeDeduction,
      purchasedCredits: credits.purchasedCredits - purchasedDeduction,
      totalCreditsUsed: credits.totalCreditsUsed + amount,
    })
    .where(eq(userCredits.userId, userId));

  const newBalance = credits.totalCredits - amount;

  // Log transaction
  await db.insert(creditTransactions).values({
    userId,
    type: "usage",
    amount: -amount,
    balanceAfter: newBalance,
    creditSource: freeDeduction > 0 ? "free" : "purchased",
    description: description || `${actionType} using ${model || "default"}`,
    actionType,
    model,
  });

  return {
    success: true,
    remainingCredits: newBalance,
  };
}

/**
 * Add purchased credits to user account
 */
export async function addPurchasedCredits(
  userId: number,
  amount: number,
  packName: string,
  stripePaymentId?: string
): Promise<{ success: boolean; newBalance: number }> {
  const credits = await getUserCredits(userId);
  
  const newPurchasedCredits = credits.purchasedCredits + amount;
  const newBalance = credits.freeCredits + newPurchasedCredits;

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(userCredits)
    .set({
      purchasedCredits: newPurchasedCredits,
      totalCreditsPurchased: credits.totalCreditsPurchased + amount,
    })
    .where(eq(userCredits.userId, userId));

  // Log transaction
  await db.insert(creditTransactions).values({
    userId,
    type: "purchase",
    amount,
    balanceAfter: newBalance,
    creditSource: "purchased",
    description: `Purchased ${packName} pack`,
    packName,
    stripePaymentId,
  });

  return {
    success: true,
    newBalance,
  };
}

/**
 * Get all available credit packs
 */
export async function getCreditPacks() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(creditPacks)
    .where(eq(creditPacks.isActive, true))
    .orderBy(creditPacks.sortOrder);
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(
  userId: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(sql`${creditTransactions.createdAt} DESC`)
    .limit(limit);
}

/**
 * Get model tier for smart routing
 */
export function getModelTier(model: string): string {
  return MODEL_TIERS[model] || "standard";
}

/**
 * Get cheapest model for a given task complexity
 */
export function getCheapestModel(complexity: "simple" | "medium" | "complex"): string {
  switch (complexity) {
    case "simple":
      return "llama-3.1-8b"; // Free, fast
    case "medium":
      return "llama-3.3-70b"; // Free, powerful
    case "complex":
      return "gpt-4o-mini"; // Cheap, capable
    default:
      return "llama-3.1-8b";
  }
}
