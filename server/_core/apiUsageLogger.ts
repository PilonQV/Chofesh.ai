/**
 * API Usage Logger
 * 
 * Tracks API usage and costs for production monitoring and billing analysis.
 * Logs to console in structured format for easy parsing by log aggregation tools.
 */

export interface APIUsageLog {
  timestamp: string;
  provider: string;
  model: string;
  userId?: string;
  requestId?: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    input: number;
    output: number;
    total: number;
  };
  latencyMs?: number;
  success: boolean;
  error?: string;
}

/**
 * In-memory usage aggregation for analytics
 * (In production, this should be stored in a database or Redis)
 */
const usageAggregation: Map<string, APIUsageLog[]> = new Map();

/**
 * Log API usage with structured format
 */
export function logAPIUsage(log: APIUsageLog) {
  // Log to console in JSON format for production log aggregation
  console.log('[API_USAGE]', JSON.stringify(log));
  
  // Store in memory for analytics (last 1000 requests per provider)
  const providerKey = `${log.provider}:${log.model}`;
  if (!usageAggregation.has(providerKey)) {
    usageAggregation.set(providerKey, []);
  }
  
  const logs = usageAggregation.get(providerKey)!;
  logs.push(log);
  
  // Keep only last 1000 requests to prevent memory bloat
  if (logs.length > 1000) {
    logs.shift();
  }
}

/**
 * Get usage statistics for a specific provider/model
 */
export function getUsageStats(provider: string, model?: string) {
  const providerKey = model ? `${provider}:${model}` : provider;
  const logs = usageAggregation.get(providerKey) || [];
  
  if (logs.length === 0) {
    return {
      provider,
      model,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      lastHourCost: 0,
      last24HourCost: 0,
    };
  }
  
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const successfulRequests = logs.filter(l => l.success).length;
  const failedRequests = logs.filter(l => !l.success).length;
  const totalTokens = logs.reduce((sum, l) => sum + l.tokens.total, 0);
  const totalCost = logs.reduce((sum, l) => sum + l.cost.total, 0);
  const averageLatency = logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / logs.length;
  
  const lastHourLogs = logs.filter(l => new Date(l.timestamp) > oneHourAgo);
  const lastHourCost = lastHourLogs.reduce((sum, l) => sum + l.cost.total, 0);
  
  const last24HourLogs = logs.filter(l => new Date(l.timestamp) > oneDayAgo);
  const last24HourCost = last24HourLogs.reduce((sum, l) => sum + l.cost.total, 0);
  
  return {
    provider,
    model,
    totalRequests: logs.length,
    successfulRequests,
    failedRequests,
    totalTokens,
    totalCost,
    averageLatency,
    lastHourCost,
    last24HourCost,
    estimatedMonthlyCost: last24HourCost * 30,
  };
}

/**
 * Get all usage statistics
 */
export function getAllUsageStats() {
  const stats: any[] = [];
  
  for (const [providerKey, logs] of usageAggregation.entries()) {
    const [provider, model] = providerKey.split(':');
    stats.push(getUsageStats(provider, model));
  }
  
  return stats;
}

/**
 * Clear usage logs (for testing or manual reset)
 */
export function clearUsageLogs() {
  usageAggregation.clear();
}

/**
 * Get recent usage logs for debugging
 */
export function getRecentLogs(provider?: string, limit: number = 100): APIUsageLog[] {
  if (provider) {
    const allLogs: APIUsageLog[] = [];
    for (const [key, logs] of usageAggregation.entries()) {
      if (key.startsWith(provider)) {
        allLogs.push(...logs);
      }
    }
    return allLogs.slice(-limit);
  }
  
  // Get all logs across all providers
  const allLogs: APIUsageLog[] = [];
  for (const logs of usageAggregation.values()) {
    allLogs.push(...logs);
  }
  
  // Sort by timestamp descending and return last N
  return allLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
