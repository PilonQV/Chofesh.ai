/**
 * API Rate Limiter
 * 
 * Controls API spending by limiting requests per time window.
 * Prevents runaway costs from abuse or bugs.
 */

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  maxCostPerHour: number;  // in USD
  maxCostPerDay: number;   // in USD
}

export interface RateLimitState {
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsThisDay: number;
  costThisHour: number;
  costThisDay: number;
  lastMinuteReset: Date;
  lastHourReset: Date;
  lastDayReset: Date;
}

/**
 * Default rate limits for Kimi API
 * COST OPTIMIZED: Kimi reserved for complex queries only (5% of traffic)
 * 95% of queries use free APIs (Groq, Cerebras, Gemini)
 */
export const DEFAULT_KIMI_RATE_LIMITS: RateLimitConfig = {
  maxRequestsPerMinute: 10,      // 10 requests/minute (reduced from 60)
  maxRequestsPerHour: 150,       // 150 requests/hour (reduced from 1000)
  maxRequestsPerDay: 1000,       // 1,000 requests/day (reduced from 10,000)
  maxCostPerHour: 0.50,          // $0.50/hour max (reduced from $5)
  maxCostPerDay: 5.00,           // $5/day max (~$150/month, reduced from $1500)
};

/**
 * Rate limit state per provider
 */
const rateLimitStates: Map<string, RateLimitState> = new Map();

/**
 * Get or create rate limit state for a provider
 */
function getRateLimitState(provider: string): RateLimitState {
  if (!rateLimitStates.has(provider)) {
    const now = new Date();
    rateLimitStates.set(provider, {
      requestsThisMinute: 0,
      requestsThisHour: 0,
      requestsThisDay: 0,
      costThisHour: 0,
      costThisDay: 0,
      lastMinuteReset: now,
      lastHourReset: now,
      lastDayReset: now,
    });
  }
  return rateLimitStates.get(provider)!;
}

/**
 * Reset counters if time windows have elapsed
 */
function resetExpiredWindows(state: RateLimitState) {
  const now = new Date();
  
  // Reset minute counter if 1 minute has passed
  if (now.getTime() - state.lastMinuteReset.getTime() >= 60 * 1000) {
    state.requestsThisMinute = 0;
    state.lastMinuteReset = now;
  }
  
  // Reset hour counter if 1 hour has passed
  if (now.getTime() - state.lastHourReset.getTime() >= 60 * 60 * 1000) {
    state.requestsThisHour = 0;
    state.costThisHour = 0;
    state.lastHourReset = now;
  }
  
  // Reset day counter if 1 day has passed
  if (now.getTime() - state.lastDayReset.getTime() >= 24 * 60 * 60 * 1000) {
    state.requestsThisDay = 0;
    state.costThisDay = 0;
    state.lastDayReset = now;
  }
}

/**
 * Check if a request is allowed under rate limits
 */
export function checkRateLimit(
  provider: string,
  estimatedCost: number = 0,
  config: RateLimitConfig = DEFAULT_KIMI_RATE_LIMITS
): { allowed: boolean; reason?: string; retryAfter?: number } {
  const state = getRateLimitState(provider);
  resetExpiredWindows(state);
  
  // Check requests per minute
  if (state.requestsThisMinute >= config.maxRequestsPerMinute) {
    const retryAfter = 60 - Math.floor((new Date().getTime() - state.lastMinuteReset.getTime()) / 1000);
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${config.maxRequestsPerMinute} requests/minute`,
      retryAfter,
    };
  }
  
  // Check requests per hour
  if (state.requestsThisHour >= config.maxRequestsPerHour) {
    const retryAfter = 3600 - Math.floor((new Date().getTime() - state.lastHourReset.getTime()) / 1000);
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${config.maxRequestsPerHour} requests/hour`,
      retryAfter,
    };
  }
  
  // Check requests per day
  if (state.requestsThisDay >= config.maxRequestsPerDay) {
    const retryAfter = 86400 - Math.floor((new Date().getTime() - state.lastDayReset.getTime()) / 1000);
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${config.maxRequestsPerDay} requests/day`,
      retryAfter,
    };
  }
  
  // Check cost per hour
  if (state.costThisHour + estimatedCost > config.maxCostPerHour) {
    const retryAfter = 3600 - Math.floor((new Date().getTime() - state.lastHourReset.getTime()) / 1000);
    return {
      allowed: false,
      reason: `Cost limit exceeded: $${config.maxCostPerHour}/hour (current: $${state.costThisHour.toFixed(4)})`,
      retryAfter,
    };
  }
  
  // Check cost per day
  if (state.costThisDay + estimatedCost > config.maxCostPerDay) {
    const retryAfter = 86400 - Math.floor((new Date().getTime() - state.lastDayReset.getTime()) / 1000);
    return {
      allowed: false,
      reason: `Cost limit exceeded: $${config.maxCostPerDay}/day (current: $${state.costThisDay.toFixed(4)})`,
      retryAfter,
    };
  }
  
  return { allowed: true };
}

/**
 * Record a successful request
 */
export function recordRequest(provider: string, cost: number) {
  const state = getRateLimitState(provider);
  resetExpiredWindows(state);
  
  state.requestsThisMinute++;
  state.requestsThisHour++;
  state.requestsThisDay++;
  state.costThisHour += cost;
  state.costThisDay += cost;
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(provider: string, config: RateLimitConfig = DEFAULT_KIMI_RATE_LIMITS) {
  const state = getRateLimitState(provider);
  resetExpiredWindows(state);
  
  return {
    provider,
    limits: config,
    current: {
      requestsThisMinute: state.requestsThisMinute,
      requestsThisHour: state.requestsThisHour,
      requestsThisDay: state.requestsThisDay,
      costThisHour: state.costThisHour,
      costThisDay: state.costThisDay,
    },
    remaining: {
      requestsThisMinute: Math.max(0, config.maxRequestsPerMinute - state.requestsThisMinute),
      requestsThisHour: Math.max(0, config.maxRequestsPerHour - state.requestsThisHour),
      requestsThisDay: Math.max(0, config.maxRequestsPerDay - state.requestsThisDay),
      costThisHour: Math.max(0, config.maxCostPerHour - state.costThisHour),
      costThisDay: Math.max(0, config.maxCostPerDay - state.costThisDay),
    },
    percentUsed: {
      requestsPerMinute: (state.requestsThisMinute / config.maxRequestsPerMinute) * 100,
      requestsPerHour: (state.requestsThisHour / config.maxRequestsPerHour) * 100,
      requestsPerDay: (state.requestsThisDay / config.maxRequestsPerDay) * 100,
      costPerHour: (state.costThisHour / config.maxCostPerHour) * 100,
      costPerDay: (state.costThisDay / config.maxCostPerDay) * 100,
    },
  };
}

/**
 * Reset rate limits (for testing or manual override)
 */
export function resetRateLimits(provider?: string) {
  if (provider) {
    rateLimitStates.delete(provider);
  } else {
    rateLimitStates.clear();
  }
}
