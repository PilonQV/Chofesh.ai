/**
 * Webhook Security Module
 * 
 * IP whitelisting, rate limiting, and security features for webhooks
 */

import { getDb } from "../db";
import { webhooks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * IP Whitelist Configuration
 * 
 * Chofesh.ai server IPs that are allowed to send webhooks
 */
export const CHOFESH_SERVER_IPS = [
  "52.89.214.238",
  "34.212.75.30",
  "54.218.53.128",
  "127.0.0.1", // localhost for testing
  "::1", // localhost IPv6
];

/**
 * Rate Limiting Configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
};

/**
 * In-memory rate limit tracking
 * In production, use Redis for distributed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if IP is whitelisted
 */
export function isIPWhitelisted(ip: string, customWhitelist?: string[]): boolean {
  const whitelist = customWhitelist || CHOFESH_SERVER_IPS;
  
  // Normalize IP (remove IPv6 prefix if present)
  const normalizedIP = ip.replace(/^::ffff:/, '');
  
  return whitelist.some(whitelistedIP => {
    // Exact match
    if (normalizedIP === whitelistedIP) return true;
    
    // CIDR range match (basic implementation)
    if (whitelistedIP.includes('/')) {
      return isIPInCIDR(normalizedIP, whitelistedIP);
    }
    
    return false;
  });
}

/**
 * Check if IP is in CIDR range
 * Basic implementation - for production use a library like 'ip-range-check'
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Convert IP string to number
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
}

/**
 * Check rate limit for webhook
 */
export function checkRateLimitForWebhook(
  webhookId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `webhook:${webhookId}`;
  
  let record = rateLimitStore.get(key);
  
  // Reset if window expired
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, record);
  }
  
  // Increment counter
  record.count++;
  
  // Check if limit exceeded
  if (record.count > config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  return { allowed: true };
}

/**
 * Validate webhook URL
 */
export function validateWebhookURL(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Must be HTTP or HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Recommend HTTPS for security
    if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) {
      console.warn('Warning: HTTP webhooks are not recommended. Use HTTPS for security.');
    }
    
    // Block localhost in production (except for testing)
    if (process.env.NODE_ENV === 'production') {
      const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      if (localhostPatterns.some(pattern => parsed.hostname.includes(pattern))) {
        return { valid: false, error: 'Localhost URLs are not allowed in production' };
      }
    }
    
    // Block private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    if (process.env.NODE_ENV === 'production') {
      const privateIPPatterns = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
      ];
      
      if (privateIPPatterns.some(pattern => pattern.test(parsed.hostname))) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize webhook payload to prevent injection attacks
 */
export function sanitizeWebhookPayload(payload: any): any {
  // Handle null and non-objects
  if (payload === null || typeof payload !== 'object') {
    return payload;
  }
  
  // Handle arrays
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizeWebhookPayload(item));
  }
  
  // Handle objects
  const sanitized = { ...payload };
  
  // Remove __proto__ and constructor to prevent prototype pollution
  delete sanitized.__proto__;
  delete sanitized.constructor;
  
  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeWebhookPayload(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Get webhook security settings
 */
export async function getWebhookSecuritySettings(webhookId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, webhookId))
    .limit(1);
  
  if (!webhook) {
    throw new Error("Webhook not found");
  }
  
  // Return security configuration
  // In a real implementation, this would be stored in the database
  return {
    ipWhitelist: CHOFESH_SERVER_IPS,
    rateLimit: DEFAULT_RATE_LIMIT,
    requireHTTPS: process.env.NODE_ENV === 'production',
    signatureRequired: true,
  };
}

/**
 * Log security event
 */
export function logSecurityEvent(event: {
  type: 'ip_blocked' | 'rate_limited' | 'invalid_signature' | 'invalid_url';
  webhookId: string;
  ip?: string;
  details?: string;
}) {
  console.warn('[Webhook Security]', {
    timestamp: new Date().toISOString(),
    ...event,
  });
  
  // In production, send to security monitoring service
  // e.g., Sentry, DataDog, CloudWatch
}

/**
 * Middleware for webhook security
 */
export function webhookSecurityMiddleware(options: {
  checkIP?: boolean;
  checkRateLimit?: boolean;
  requireHTTPS?: boolean;
} = {}) {
  const {
    checkIP = true,
    checkRateLimit = true,
    requireHTTPS = process.env.NODE_ENV === 'production',
  } = options;
  
  return async (req: any, res: any, next: any) => {
    const webhookId = req.params.webhookId || req.body.webhookId;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check HTTPS requirement
    if (requireHTTPS && req.protocol !== 'https') {
      logSecurityEvent({
        type: 'invalid_url',
        webhookId,
        details: 'HTTPS required',
      });
      return res.status(403).json({ error: 'HTTPS required' });
    }
    
    // Check IP whitelist
    if (checkIP && !isIPWhitelisted(clientIP)) {
      logSecurityEvent({
        type: 'ip_blocked',
        webhookId,
        ip: clientIP,
      });
      return res.status(403).json({ error: 'IP not whitelisted' });
    }
    
    // Check rate limit
    if (checkRateLimit && webhookId) {
      const rateLimitResult = checkRateLimitForWebhook(webhookId);
      const { allowed, retryAfter } = rateLimitResult;
      
      if (!allowed) {
        logSecurityEvent({
          type: 'rate_limited',
          webhookId,
          ip: clientIP,
        });
        
        res.setHeader('Retry-After', retryAfter!);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter,
        });
      }
    }
    
    next();
  };
}
