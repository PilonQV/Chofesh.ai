/**
 * Webhook Security Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isIPWhitelisted,
  checkRateLimitForWebhook,
  validateWebhookURL,
  sanitizeWebhookPayload,
  CHOFESH_SERVER_IPS,
} from './lib/webhookSecurity';

describe('Webhook Security', () => {
  describe('IP Whitelisting', () => {
    it('should allow whitelisted IPs', () => {
      CHOFESH_SERVER_IPS.forEach(ip => {
        expect(isIPWhitelisted(ip)).toBe(true);
      });
    });

    it('should block non-whitelisted IPs', () => {
      const blockedIPs = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '8.8.8.8',
      ];

      blockedIPs.forEach(ip => {
        expect(isIPWhitelisted(ip)).toBe(false);
      });
    });

    it('should handle IPv6 format', () => {
      expect(isIPWhitelisted('::ffff:127.0.0.1')).toBe(true);
    });

    it('should support custom whitelist', () => {
      const customWhitelist = ['1.2.3.4', '5.6.7.8'];
      expect(isIPWhitelisted('1.2.3.4', customWhitelist)).toBe(true);
      expect(isIPWhitelisted('9.9.9.9', customWhitelist)).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const webhookId = 'test-webhook-1';
      
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimitForWebhook(webhookId, {
          windowMs: 60000,
          maxRequests: 10,
        });
        
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const webhookId = 'test-webhook-2';
      const config = { windowMs: 60000, maxRequests: 5 };
      
      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        checkRateLimitForWebhook(webhookId, config);
      }
      
      // 6th request should be blocked
      const result = checkRateLimitForWebhook(webhookId, config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset counter after window expires', async () => {
      const webhookId = 'test-webhook-3';
      const config = { windowMs: 100, maxRequests: 2 }; // 100ms window
      
      // Use up the limit
      checkRateLimitForWebhook(webhookId, config);
      checkRateLimitForWebhook(webhookId, config);
      
      // Should be blocked
      let result = checkRateLimitForWebhook(webhookId, config);
      expect(result.allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      result = checkRateLimitForWebhook(webhookId, config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('URL Validation', () => {
    it('should accept valid HTTPS URLs', () => {
      const validURLs = [
        'https://example.com/webhook',
        'https://api.example.com/events',
        'https://webhook.site/unique-id',
      ];

      validURLs.forEach(url => {
        const result = validateWebhookURL(url);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept HTTP for localhost in development', () => {
      const result = validateWebhookURL('http://localhost:3000/webhook');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid protocols', () => {
      const invalidURLs = [
        'ftp://example.com/webhook',
        'file:///tmp/webhook',
        'javascript:alert(1)',
      ];

      invalidURLs.forEach(url => {
        const result = validateWebhookURL(url);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject malformed URLs', () => {
      const malformedURLs = [
        'not-a-url',
        'http://',
        '://example.com',
      ];

      malformedURLs.forEach(url => {
        const result = validateWebhookURL(url);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Payload Sanitization', () => {
    it('should remove dangerous properties', () => {
      const payload = {
        data: 'safe',
        __proto__: { polluted: true },
        constructor: { dangerous: true },
      };

      const sanitized = sanitizeWebhookPayload(payload);
      
      expect(sanitized.data).toBe('safe');
      expect(Object.prototype.hasOwnProperty.call(sanitized, '__proto__')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(sanitized, 'constructor')).toBe(false);
    });

    it('should recursively sanitize nested objects', () => {
      const payload = {
        level1: {
          level2: {
            __proto__: { polluted: true },
            data: 'safe',
          },
        },
      };

      const sanitized = sanitizeWebhookPayload(payload);
      
      expect(sanitized.level1.level2.data).toBe('safe');
      expect(Object.prototype.hasOwnProperty.call(sanitized.level1.level2, '__proto__')).toBe(false);
    });

    it('should preserve safe data', () => {
      const payload = {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
      };

      const sanitized = sanitizeWebhookPayload(payload);
      
      expect(sanitized).toEqual(payload);
    });
  });
});
