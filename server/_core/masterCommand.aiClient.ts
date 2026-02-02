/**
 * Master Command AI Client
 * 
 * Standalone AI client for Master Command to avoid circular dependencies.
 */

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
}

/**
 * Call Kimi API directly without dependencies
 */
export async function callKimiAPI(
  messages: AIMessage[],
  temperature: number = 0.3
): Promise<AIResponse> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not configured');
  }

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
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
  });

  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
  };
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
