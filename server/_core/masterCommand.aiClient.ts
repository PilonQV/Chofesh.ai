/**
 * Master Command AI Client
 * 
 * Standalone AI client for Master Command to avoid circular dependencies.
 * Includes retry logic, timeout handling, and proper error logging.
 */

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
}

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, options: RetryOptions): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Call Kimi API directly without dependencies
 * Includes retry logic with exponential backoff for transient failures
 */
export async function callKimiAPI(
  messages: AIMessage[],
  temperature: number = 0.3,
  retryOptions: Partial<RetryOptions> = {}
): Promise<AIResponse> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not configured');
  }

  const options: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      console.log(`[Kimi API] Attempt ${attempt + 1}/${options.maxRetries + 1}`);

      // FIXED: Use correct API endpoint (.ai instead of .cn)
      const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'moonshot-v1-32k',
          messages,
          temperature,
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unable to read error body');
        
        // Log 401 errors specifically
        if (response.status === 401) {
          console.error('[Kimi API] 401 UNAUTHORIZED ERROR');
          console.error('[Kimi API] API key present:', !!apiKey);
          console.error('[Kimi API] API key length:', apiKey?.length || 0);
          console.error('[Kimi API] API key prefix:', apiKey?.substring(0, 8) + '...');
          console.error('[Kimi API] Error body:', errorBody);
        }

        // Determine if error is retryable
        const isRetryable = response.status === 429 || // Rate limit
                           response.status === 500 || // Server error
                           response.status === 502 || // Bad gateway
                           response.status === 503 || // Service unavailable
                           response.status === 504;   // Gateway timeout

        if (isRetryable && attempt < options.maxRetries) {
          const delay = getBackoffDelay(attempt, options);
          console.warn(`[Kimi API] ${response.status} ${response.statusText} - Retrying in ${delay}ms...`);
          lastError = new Error(`Kimi API error: ${response.status} ${response.statusText}`);
          await sleep(delay);
          continue;
        }

        // Non-retryable error or max retries reached
        throw new Error(`Kimi API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      // Success - parse and return response
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      if (!content) {
        console.warn('[Kimi API] Empty response content');
      }

      console.log(`[Kimi API] Success on attempt ${attempt + 1}`);
      return { content };

    } catch (error: any) {
      lastError = error;

      // Handle timeout errors
      if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        console.error('[Kimi API] Request timeout after 30s');
        if (attempt < options.maxRetries) {
          const delay = getBackoffDelay(attempt, options);
          console.warn(`[Kimi API] Timeout - Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
      }

      // Handle network errors
      if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        console.error('[Kimi API] Network error:', error.message);
        if (attempt < options.maxRetries) {
          const delay = getBackoffDelay(attempt, options);
          console.warn(`[Kimi API] Network error - Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
      }

      // Non-retryable error
      console.error('[Kimi API] Non-retryable error:', error);
      throw error;
    }
  }

  // Max retries exhausted
  console.error(`[Kimi API] Max retries (${options.maxRetries}) exhausted`);
  throw lastError || new Error('Kimi API request failed after max retries');
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
