/**
 * Orchestrator Cache System
 * 
 * Caches Kimi orchestrator routing decisions to reduce overhead and improve response times.
 * Uses in-memory LRU cache with TTL and similarity matching for intelligent cache hits.
 */

import crypto from 'crypto';

// Cache entry structure
interface CacheEntry {
  queryHash: string;
  normalizedQuery: string;
  routingDecision: {
    shouldDelegate: boolean;
    targetModel?: string;
    reasoning: string;
  };
  timestamp: number;
  hits: number;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  totalQueries: number;
  hitRate: number;
  avgLatencySaved: number; // milliseconds
  totalCostSaved: number; // estimated USD
}

// Configuration
const CONFIG = {
  MAX_CACHE_SIZE: 1000,
  TTL_MS: 60 * 60 * 1000, // 1 hour
  SIMILARITY_THRESHOLD: 0.85, // 85% match required
  ORCHESTRATION_COST: 0.0001, // ~$0.0001 per orchestration call
  AVG_ORCHESTRATION_LATENCY: 500, // ~500ms average
};

// In-memory LRU cache
class LRUCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > CONFIG.TTL_MS) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry;
  }

  set(key: string, value: CacheEntry): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Remove existing entry to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  entries(): IterableIterator<[string, CacheEntry]> {
    return this.cache.entries();
  }
}

// Global cache instance
let cache = new LRUCache(CONFIG.MAX_CACHE_SIZE);

// Global statistics
const stats: CacheStats = {
  hits: 0,
  misses: 0,
  totalQueries: 0,
  hitRate: 0,
  avgLatencySaved: 0,
  totalCostSaved: 0,
};

/**
 * Normalize query for consistent cache keys
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[^\w\s]/g, ''); // Remove punctuation
}

/**
 * Generate hash for cache key
 */
function hashQuery(normalizedQuery: string): string {
  return crypto
    .createHash('sha256')
    .update(normalizedQuery)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for shorter keys
}

/**
 * Calculate Levenshtein distance between two strings
 * (for similarity matching)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

/**
 * Find similar cached entry using fuzzy matching
 */
function findSimilarEntry(normalizedQuery: string): CacheEntry | undefined {
  let bestMatch: CacheEntry | undefined;
  let bestSimilarity = 0;

  for (const [_, entry] of cache.entries()) {
    // Check TTL
    if (Date.now() - entry.timestamp > CONFIG.TTL_MS) {
      continue;
    }

    const similarity = similarityRatio(normalizedQuery, entry.normalizedQuery);
    
    if (similarity >= CONFIG.SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
      bestMatch = entry;
      bestSimilarity = similarity;
    }
  }

  return bestMatch;
}

/**
 * Get cached routing decision for a query
 * Returns cached decision if found (exact or similar match)
 */
export function getCachedDecision(query: string): {
  decision: CacheEntry['routingDecision'] | null;
  cacheHit: boolean;
  similarity?: number;
} {
  stats.totalQueries++;

  const normalized = normalizeQuery(query);
  const hash = hashQuery(normalized);

  // Try exact match first
  let entry = cache.get(hash);
  let similarity = 1.0;

  // Try fuzzy match if no exact match
  if (!entry) {
    entry = findSimilarEntry(normalized);
    if (entry) {
      similarity = similarityRatio(normalized, entry.normalizedQuery);
    }
  }

  if (entry) {
    // Cache hit
    stats.hits++;
    entry.hits++;
    stats.hitRate = stats.hits / stats.totalQueries;
    stats.avgLatencySaved = 
      ((stats.avgLatencySaved * (stats.hits - 1)) + CONFIG.AVG_ORCHESTRATION_LATENCY) / stats.hits;
    stats.totalCostSaved += CONFIG.ORCHESTRATION_COST;

    console.log(`[Orchestrator Cache] HIT (${(similarity * 100).toFixed(1)}% match) - Query: "${query.substring(0, 50)}..."`);
    
    return {
      decision: entry.routingDecision,
      cacheHit: true,
      similarity,
    };
  }

  // Cache miss
  stats.misses++;
  stats.hitRate = stats.hits / stats.totalQueries;

  console.log(`[Orchestrator Cache] MISS - Query: "${query.substring(0, 50)}..."`);

  return {
    decision: null,
    cacheHit: false,
  };
}

/**
 * Cache a routing decision for future use
 */
export function cacheDecision(
  query: string,
  decision: CacheEntry['routingDecision']
): void {
  const normalized = normalizeQuery(query);
  const hash = hashQuery(normalized);

  const entry: CacheEntry = {
    queryHash: hash,
    normalizedQuery: normalized,
    routingDecision: decision,
    timestamp: Date.now(),
    hits: 0,
  };

  cache.set(hash, entry);

  console.log(`[Orchestrator Cache] STORED - Query: "${query.substring(0, 50)}..." → ${decision.shouldDelegate ? `Delegate to ${decision.targetModel}` : 'Kimi direct'}`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return {
    ...stats,
    hitRate: stats.totalQueries > 0 ? stats.hits / stats.totalQueries : 0,
  };
}

/**
 * Clear all cached entries
 */
export function clearCache(): void {
  cache.clear();
  console.log('[Orchestrator Cache] Cache cleared');
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return cache.size();
}

/**
 * Update cache configuration
 */
export function updateConfig(config: Partial<typeof CONFIG>): void {
  Object.assign(CONFIG, config);
  
  // Recreate cache if max size changed
  if (config.MAX_CACHE_SIZE !== undefined) {
    cache = new LRUCache(config.MAX_CACHE_SIZE);
  }
  
  console.log('[Orchestrator Cache] Configuration updated:', config);
}

/**
 * Get current configuration
 */
export function getConfig(): typeof CONFIG {
  return { ...CONFIG };
}
