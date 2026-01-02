/**
 * Stripe Products Configuration for Chofesh.ai
 * 
 * Subscription tiers with daily query limits and pricing.
 */

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    dailyLimit: 20,
    description: "Try Chofesh.ai with basic features",
    features: [
      "20 queries per day",
      "Access to Free tier models (Llama 3.1)",
      "Basic chat features",
      "Slowdown after limit (1 query/min)",
    ],
  },
  starter: {
    name: "Starter",
    price: 500, // $5.00 in cents
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "", // Set in Stripe Dashboard
    dailyLimit: 100,
    description: "For casual users who need more",
    features: [
      "100 queries per day",
      "Access to Standard tier models (GPT-4o-mini)",
      "Web search integration",
      "Priority support",
      "Slowdown after limit (1 query/min)",
    ],
  },
  pro: {
    name: "Pro",
    price: 1500, // $15.00 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || "", // Set in Stripe Dashboard
    dailyLimit: 500,
    description: "For power users and professionals",
    features: [
      "500 queries per day",
      "Access to Premium tier models (GPT-4o, Claude)",
      "Image generation",
      "Document chat",
      "Web search integration",
      "Priority support",
      "Slowdown after limit (1 query/min)",
    ],
  },
  unlimited: {
    name: "Unlimited",
    price: 3000, // $30.00 in cents
    priceId: process.env.STRIPE_UNLIMITED_PRICE_ID || "", // Set in Stripe Dashboard
    dailyLimit: Infinity,
    description: "No limits, full access",
    features: [
      "Unlimited queries",
      "Access to all models",
      "Image generation",
      "Document chat",
      "Web search integration",
      "Priority support",
      "No slowdown ever",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Get the daily query limit for a subscription tier
 */
export function getDailyLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier].dailyLimit;
}

/**
 * Check if a user is over their daily limit
 */
export function isOverLimit(tier: SubscriptionTier, currentQueries: number): boolean {
  const limit = getDailyLimit(tier);
  return limit !== Infinity && currentQueries >= limit;
}

/**
 * Get the slowdown delay in milliseconds (1 minute for over-limit users)
 */
export function getSlowdownDelay(tier: SubscriptionTier, currentQueries: number): number {
  if (tier === "unlimited") return 0;
  if (isOverLimit(tier, currentQueries)) {
    return 60000; // 1 minute in milliseconds
  }
  return 0;
}

/**
 * Map Stripe price ID to subscription tier
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if ("priceId" in config && config.priceId === priceId) {
      return tier as SubscriptionTier;
    }
  }
  return null;
}
