/**
 * Tests for Orchestrator Cache System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCachedDecision,
  cacheDecision,
  getCacheStats,
  clearCache,
  getCacheSize,
  updateConfig,
  getConfig,
} from './orchestratorCache';

describe('Orchestrator Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
    
    // Reset stats by clearing and doing a dummy operation
    getCachedDecision('__reset__');
  });

  describe('Basic Caching', () => {
    it('should return cache miss for new query', () => {
      const result = getCachedDecision('What is the capital of France?');
      
      expect(result.cacheHit).toBe(false);
      expect(result.decision).toBeNull();
    });

    it('should cache and retrieve exact match', () => {
      const query = 'What is the capital of France?';
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      // Cache the decision
      cacheDecision(query, decision);

      // Retrieve from cache
      const result = getCachedDecision(query);

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
      expect(result.similarity).toBe(1.0);
    });

    it('should handle case-insensitive matching', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      cacheDecision('What is the capital of France?', decision);

      const result = getCachedDecision('WHAT IS THE CAPITAL OF FRANCE?');

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
    });

    it('should handle extra whitespace', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      cacheDecision('What is the capital of France?', decision);

      const result = getCachedDecision('What   is    the   capital   of   France?');

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
    });
  });

  describe('Similarity Matching', () => {
    it('should match similar queries with typos', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      cacheDecision('What is the capital of France?', decision);

      // Query with typo
      const result = getCachedDecision('What is the capitol of France?');

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
      expect(result.similarity).toBeGreaterThan(0.85);
    });

    it('should not match dissimilar queries', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      cacheDecision('What is the capital of France?', decision);

      // Completely different query
      const result = getCachedDecision('How do I write Python code?');

      expect(result.cacheHit).toBe(false);
      expect(result.decision).toBeNull();
    });

    it('should match queries with minor variations', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      cacheDecision('What is the capital of France?', decision);

      // Minor variation
      const result = getCachedDecision('Whats the capital of France');

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', () => {
      // Clear and get baseline
      clearCache();
      const baselineStats = getCacheStats();
      const baselineQueries = baselineStats.totalQueries;
      
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      // Miss
      getCachedDecision('StatsQuery1');
      
      // Cache and hit
      cacheDecision('StatsQuery1', decision);
      getCachedDecision('StatsQuery1');
      
      // Another hit
      getCachedDecision('StatsQuery1');
      
      // Another miss
      getCachedDecision('StatsQuery2');

      const stats = getCacheStats();

      // Check relative to baseline
      expect(stats.totalQueries - baselineQueries).toBe(4);
      expect(stats.hits).toBeGreaterThanOrEqual(2);
      expect(stats.misses).toBeGreaterThanOrEqual(2);
    });

    it('should track cost savings', () => {
      // Clear cache and get fresh stats
      clearCache();
      
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      cacheDecision('CostTest1', decision);
      getCachedDecision('CostTest1');
      getCachedDecision('CostTest1');
      getCachedDecision('CostTest1');

      const stats = getCacheStats();

      // Should have at least 3 hits from this test
      expect(stats.hits).toBeGreaterThanOrEqual(3);
      expect(stats.totalCostSaved).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      cacheDecision('Query 1', decision);
      cacheDecision('Query 2', decision);

      expect(getCacheSize()).toBe(2);

      clearCache();

      expect(getCacheSize()).toBe(0);
    });

    it('should respect max cache size', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      // Update config to small cache size
      updateConfig({ MAX_CACHE_SIZE: 3 });
      
      // Clear cache after config update
      clearCache();

      // Add 5 entries
      for (let i = 0; i < 5; i++) {
        cacheDecision(`Query ${i}`, decision);
      }

      // Should only keep 3 (LRU eviction)
      const cacheSize = getCacheSize();
      expect(cacheSize).toBeLessThanOrEqual(3);
      expect(cacheSize).toBeGreaterThan(0);

      // Most recent entries should be kept
      const result4 = getCachedDecision('Query 4');
      const result3 = getCachedDecision('Query 3');
      
      expect(result4.cacheHit).toBe(true);  // Most recent
      expect(result3.cacheHit).toBe(true);  // Recent
      
      // Restore original config
      updateConfig({ MAX_CACHE_SIZE: 1000 });
    });

    it('should update configuration', () => {
      const originalConfig = getConfig();

      updateConfig({
        MAX_CACHE_SIZE: 500,
        TTL_MS: 30 * 60 * 1000, // 30 minutes
        SIMILARITY_THRESHOLD: 0.90,
      });

      const newConfig = getConfig();

      expect(newConfig.MAX_CACHE_SIZE).toBe(500);
      expect(newConfig.TTL_MS).toBe(30 * 60 * 1000);
      expect(newConfig.SIMILARITY_THRESHOLD).toBe(0.90);

      // Restore original config
      updateConfig(originalConfig);
    });
  });

  describe('TTL Expiration', () => {
    it('should expire entries after TTL', async () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Simple factual query',
      };

      // Set very short TTL for testing
      updateConfig({ TTL_MS: 100 }); // 100ms

      cacheDecision('Query 1', decision);

      // Should hit immediately
      const result1 = getCachedDecision('Query 1');
      expect(result1.cacheHit).toBe(true);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should miss after expiration
      const result2 = getCachedDecision('Query 1');
      expect(result2.cacheHit).toBe(false);

      // Restore normal TTL
      updateConfig({ TTL_MS: 60 * 60 * 1000 });
    });
  });

  describe('Complex Queries', () => {
    it('should handle JSON content in queries', () => {
      const decision = {
        shouldDelegate: false,
        targetModel: 'kimi-k2.5',
        reasoning: 'Complex query with structured data',
      };

      const jsonQuery = JSON.stringify({
        type: 'code_generation',
        language: 'python',
        task: 'Create a REST API',
      });

      cacheDecision(jsonQuery, decision);

      const result = getCachedDecision(jsonQuery);

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
    });

    it('should handle long queries', () => {
      const decision = {
        shouldDelegate: false,
        targetModel: 'kimi-k2.5',
        reasoning: 'Long complex query',
      };

      const longQuery = 'A'.repeat(10000); // 10K characters

      cacheDecision(longQuery, decision);

      const result = getCachedDecision(longQuery);

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queries', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Empty query',
      };

      cacheDecision('', decision);

      const result = getCachedDecision('');

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
    });

    it('should handle special characters', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Query with special chars',
      };

      const query = 'What is 2+2? How about $100 & €50?';

      cacheDecision(query, decision);

      const result = getCachedDecision(query);

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
    });

    it('should handle unicode characters', () => {
      const decision = {
        shouldDelegate: true,
        targetModel: 'gpt-4o-mini',
        reasoning: 'Unicode query',
      };

      const query = '什么是人工智能？🤖';

      cacheDecision(query, decision);

      const result = getCachedDecision(query);

      expect(result.cacheHit).toBe(true);
      expect(result.decision).toEqual(decision);
    });
  });
});
