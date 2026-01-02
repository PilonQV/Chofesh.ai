/**
 * Stripe Products Configuration for Chofesh.ai
 * 
 * Competitive pricing: 8%+ more affordable than Venice.ai and other competitors
 * 
 * Market Reference:
 * - Venice.ai Pro: $18/mo
 * - ChatGPT Plus: $20/mo
 * - Claude Pro: $20/mo
 * - Perplexity Pro: $20/mo
 * 
 * Our Pricing (8%+ cheaper):
 * - Starter: $4.99/mo (fills market gap)
 * - Pro: $14.99/mo (17% cheaper than Venice, 25% cheaper than ChatGPT)
 * - Unlimited: $27.99/mo (truly unlimited)
 */

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    dailyLimit: 25,
    imageLimit: 5,
    description: "Get started with powerful free AI models",
    features: [
      "25 queries per day",
      "Access to Llama 3.1 & DeepSeek R1 (FREE)",
      "5 image generations per day",
      "Basic chat features",
      "Slowdown after limit (1 query/min)",
    ],
  },
  starter: {
    name: "Starter",
    price: 499, // $4.99 in cents
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "", // Set in Stripe Dashboard
    dailyLimit: 100,
    imageLimit: 20,
    description: "Perfect for casual users who need more",
    features: [
      "100 queries per day",
      "All Free models + Grok 3 Fast (most up-to-date)",
      "20 image generations per day",
      "Web search integration",
      "Voice input & output",
      "Slowdown after limit (1 query/min)",
    ],
  },
  pro: {
    name: "Pro",
    price: 1499, // $14.99 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || "", // Set in Stripe Dashboard
    dailyLimit: 500,
    imageLimit: 100,
    description: "For power users and professionals",
    features: [
      "500 queries per day",
      "All models including GPT-4o & Claude",
      "100 image generations per day",
      "Document chat (PDF support)",
      "AI Characters & Personas",
      "Web search integration",
      "Priority support",
      "Slowdown after limit (1 query/min)",
    ],
  },
  unlimited: {
    name: "Unlimited",
    price: 2799, // $27.99 in cents
    priceId: process.env.STRIPE_UNLIMITED_PRICE_ID || "", // Set in Stripe Dashboard
    dailyLimit: Infinity,
    imageLimit: Infinity,
    description: "No limits, full creative freedom",
    features: [
      "Unlimited queries",
      "Access to all models",
      "Unlimited image generations",
      "Document chat (PDF support)",
      "AI Characters & Personas",
      "Image editing",
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
 * Get the daily image limit for a subscription tier
 */
export function getImageLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier].imageLimit;
}

/**
 * Check if a user is over their daily limit
 */
export function isOverLimit(tier: SubscriptionTier, currentQueries: number): boolean {
  const limit = getDailyLimit(tier);
  return limit !== Infinity && currentQueries >= limit;
}

/**
 * Check if a user is over their daily image limit
 */
export function isOverImageLimit(tier: SubscriptionTier, currentImages: number): boolean {
  const limit = getImageLimit(tier);
  return limit !== Infinity && currentImages >= limit;
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

/**
 * Annual pricing (20% discount)
 */
export const ANNUAL_DISCOUNT = 0.20; // 20% off

export function getAnnualPrice(tier: SubscriptionTier): number {
  const monthlyPrice = SUBSCRIPTION_TIERS[tier].price;
  if (monthlyPrice === 0) return 0;
  return Math.round(monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT));
}
