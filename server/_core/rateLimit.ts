import { getDb } from "../db";
import { rateLimits } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

// Rate limit configuration
export const RATE_LIMIT_CONFIG = {
  ip: {
    maxAttempts: 5,
    windowMinutes: 15,
    blockMinutes: 15,
  },
  email: {
    maxAttempts: 10,
    windowMinutes: 30,
    blockMinutes: 30,
  },
};

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil: Date | null;
  message: string;
}

/**
 * Check if an identifier (IP or email) is rate limited
 */
export async function checkRateLimit(
  identifier: string,
  identifierType: "ip" | "email"
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIG[identifierType];
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

  try {
    const db = await getDb();
    if (!db) {
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        blockedUntil: null,
        message: "OK",
      };
    }

    // Find existing rate limit record
    const [existing] = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.identifierType, identifierType)
        )
      )
      .limit(1);

    // If blocked, check if block has expired
    if (existing?.blockedUntil) {
      if (now < existing.blockedUntil) {
        return {
          allowed: false,
          remainingAttempts: 0,
          blockedUntil: existing.blockedUntil,
          message: `Too many failed attempts. Please try again in ${Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 60000)} minutes.`,
        };
      }
      // Block expired, reset the record
      await db
        .update(rateLimits)
        .set({
          attempts: 0,
          blockedUntil: null,
          firstAttemptAt: now,
          lastAttemptAt: now,
        })
        .where(eq(rateLimits.id, existing.id));
      
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        blockedUntil: null,
        message: "OK",
      };
    }

    // If no record or record is outside window, allow
    if (!existing || existing.firstAttemptAt < windowStart) {
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        blockedUntil: null,
        message: "OK",
      };
    }

    // Check if within limits
    const remainingAttempts = Math.max(0, config.maxAttempts - existing.attempts);
    
    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
      blockedUntil: null,
      message: remainingAttempts > 0 ? "OK" : `Too many failed attempts. Please try again later.`,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request but log it
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      blockedUntil: null,
      message: "OK",
    };
  }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  identifier: string,
  identifierType: "ip" | "email"
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIG[identifierType];
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

  try {
    const db = await getDb();
    if (!db) {
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        blockedUntil: null,
        message: "OK",
      };
    }

    // Find existing rate limit record
    const [existing] = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.identifierType, identifierType)
        )
      )
      .limit(1);

    if (!existing) {
      // Create new record
      await db.insert(rateLimits).values({
        identifier,
        identifierType,
        attempts: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
      
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        blockedUntil: null,
        message: `${config.maxAttempts - 1} attempts remaining`,
      };
    }

    // If record is outside window, reset it
    if (existing.firstAttemptAt < windowStart) {
      await db
        .update(rateLimits)
        .set({
          attempts: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
          blockedUntil: null,
        })
        .where(eq(rateLimits.id, existing.id));
      
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        blockedUntil: null,
        message: `${config.maxAttempts - 1} attempts remaining`,
      };
    }

    // Increment attempts
    const newAttempts = existing.attempts + 1;
    const shouldBlock = newAttempts >= config.maxAttempts;
    const blockedUntil = shouldBlock
      ? new Date(now.getTime() + config.blockMinutes * 60 * 1000)
      : null;

    await db
      .update(rateLimits)
      .set({
        attempts: newAttempts,
        lastAttemptAt: now,
        blockedUntil,
      })
      .where(eq(rateLimits.id, existing.id));

    const remainingAttempts = Math.max(0, config.maxAttempts - newAttempts);

    return {
      allowed: !shouldBlock,
      remainingAttempts,
      blockedUntil,
      message: shouldBlock
        ? `Too many failed attempts. Please try again in ${config.blockMinutes} minutes.`
        : `${remainingAttempts} attempts remaining`,
    };
  } catch (error) {
    console.error("Record failed attempt error:", error);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      blockedUntil: null,
      message: "OK",
    };
  }
}

/**
 * Clear rate limit on successful login
 */
export async function clearRateLimit(
  identifier: string,
  identifierType: "ip" | "email"
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db
      .delete(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.identifierType, identifierType)
        )
      );
  } catch (error) {
    console.error("Clear rate limit error:", error);
  }
}

/**
 * Clean up old rate limit records (call periodically)
 */
export async function cleanupOldRateLimits(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  try {
    const db = await getDb();
    if (!db) return 0;

    await db
      .delete(rateLimits)
      .where(sql`${rateLimits.lastAttemptAt} < ${cutoff}`);
    
    return 0; // MySQL doesn't return affected rows easily
  } catch (error) {
    console.error("Cleanup rate limits error:", error);
    return 0;
  }
}
