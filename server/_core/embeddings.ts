import { ENV } from './env';

/**
 * Generate embeddings for text using the Forge API.
 * Returns a vector of floats representing the semantic meaning of the text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/embeddings`
    : "https://forge.manus.im/v1/embeddings";

  if (!ENV.forgeApiKey) {
    throw new Error("FORGE_API_KEY is not configured");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embeddings API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const apiUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/embeddings`
    : "https://forge.manus.im/v1/embeddings";

  if (!ENV.forgeApiKey) {
    throw new Error("FORGE_API_KEY is not configured");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: "text-embedding-3-small",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embeddings API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

/**
 * Calculate cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
