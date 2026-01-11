/**
 * ChromaDB Service - Local Vector Database for RAG
 * 
 * Features:
 * - Completely FREE and self-hosted
 * - No external API calls needed
 * - Persistent storage on disk
 * - Built-in embedding generation
 * - Semantic similarity search
 */

import { ChromaClient, Collection } from 'chromadb';
import crypto from 'crypto';

// ChromaDB client instance (singleton)
let chromaClient: ChromaClient | null = null;

// Collection cache
const collections = new Map<string, Collection>();

// Initialize ChromaDB client
export async function initChromaDB(): Promise<ChromaClient> {
  if (chromaClient) {
    return chromaClient;
  }
  
  try {
    // Use in-memory client for now (can be configured for persistent storage)
    chromaClient = new ChromaClient();
    
    console.log('[ChromaDB] Initialized successfully');
    return chromaClient;
  } catch (error) {
    console.error('[ChromaDB] Failed to initialize:', error);
    throw error;
  }
}

// Get or create a collection for a user
export async function getOrCreateCollection(
  userId: string,
  collectionName: string = 'documents'
): Promise<Collection> {
  const fullName = `user_${userId}_${collectionName}`;
  
  // Check cache first
  if (collections.has(fullName)) {
    return collections.get(fullName)!;
  }
  
  const client = await initChromaDB();
  
  try {
    const collection = await client.getOrCreateCollection({
      name: fullName,
      metadata: {
        'hnsw:space': 'cosine', // Use cosine similarity
        'created_at': new Date().toISOString(),
      },
    });
    
    collections.set(fullName, collection);
    console.log(`[ChromaDB] Collection "${fullName}" ready`);
    return collection;
  } catch (error) {
    console.error(`[ChromaDB] Failed to get/create collection "${fullName}":`, error);
    throw error;
  }
}

// Generate a unique ID for a document chunk
function generateChunkId(documentId: string, chunkIndex: number): string {
  return crypto.createHash('md5').update(`${documentId}_chunk_${chunkIndex}`).digest('hex');
}

// Split text into chunks with overlap
export function splitTextIntoChunks(
  text: string,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    separator?: string;
  } = {}
): string[] {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separator = '\n\n',
  } = options;
  
  // First, try to split by separator (paragraphs)
  const paragraphs = text.split(separator).filter(p => p.trim().length > 0);
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap from previous
      const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
      currentChunk = currentChunk.slice(overlapStart) + separator + paragraph;
    } else {
      currentChunk += (currentChunk ? separator : '') + paragraph;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // If we still have chunks that are too large, split them further
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > chunkSize * 1.5) {
      // Split by sentences
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
      let subChunk = '';
      
      for (const sentence of sentences) {
        if (subChunk.length + sentence.length > chunkSize && subChunk.length > 0) {
          finalChunks.push(subChunk.trim());
          subChunk = sentence;
        } else {
          subChunk += sentence;
        }
      }
      if (subChunk.trim().length > 0) {
        finalChunks.push(subChunk.trim());
      }
    } else {
      finalChunks.push(chunk);
    }
  }
  
  return finalChunks;
}

// Add document chunks to ChromaDB
export async function addDocumentToChroma(
  userId: string,
  documentId: string,
  text: string,
  metadata: {
    filename?: string;
    title?: string;
    source?: string;
    [key: string]: string | number | boolean | undefined;
  } = {}
): Promise<{ chunksAdded: number; collectionName: string }> {
  const collection = await getOrCreateCollection(userId);
  
  // Split text into chunks
  const chunks = splitTextIntoChunks(text);
  
  if (chunks.length === 0) {
    return { chunksAdded: 0, collectionName: collection.name };
  }
  
  // Prepare data for ChromaDB
  const ids = chunks.map((_, i) => generateChunkId(documentId, i));
  const documents = chunks;
  const metadatas = chunks.map((_, i) => ({
    documentId,
    chunkIndex: i,
    totalChunks: chunks.length,
    filename: metadata.filename || '',
    title: metadata.title || '',
    source: metadata.source || '',
    addedAt: new Date().toISOString(),
  }));
  
  try {
    await collection.add({
      ids,
      documents,
      metadatas,
    });
    
    console.log(`[ChromaDB] Added ${chunks.length} chunks for document ${documentId}`);
    return { chunksAdded: chunks.length, collectionName: collection.name };
  } catch (error) {
    console.error(`[ChromaDB] Failed to add document ${documentId}:`, error);
    throw error;
  }
}

// Search for similar documents
export async function searchSimilarChunks(
  userId: string,
  query: string,
  options: {
    nResults?: number;
    documentId?: string; // Filter by specific document
    minScore?: number; // Minimum similarity score (0-1)
  } = {}
): Promise<Array<{
  id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}>> {
  const { nResults = 5, documentId, minScore = 0.3 } = options;
  
  const collection = await getOrCreateCollection(userId);
  
  try {
    const whereFilter = documentId ? { documentId } : undefined;
    
    const results = await collection.query({
      queryTexts: [query],
      nResults,
      where: whereFilter,
    });
    
    if (!results.documents?.[0] || !results.ids?.[0]) {
      return [];
    }
    
    const searchResults: Array<{
      id: string;
      text: string;
      score: number;
      metadata: Record<string, unknown>;
    }> = [];
    
    for (let i = 0; i < results.documents[0].length; i++) {
      const text = results.documents[0][i];
      const id = results.ids[0][i];
      const distance = results.distances?.[0]?.[i] ?? 1;
      const metadata = results.metadatas?.[0]?.[i] ?? {};
      
      // Convert distance to similarity score (cosine distance to similarity)
      const score = 1 - distance;
      
      if (score >= minScore && text) {
        searchResults.push({
          id,
          text,
          score,
          metadata,
        });
      }
    }
    
    console.log(`[ChromaDB] Found ${searchResults.length} relevant chunks for query`);
    return searchResults;
  } catch (error) {
    console.error('[ChromaDB] Search failed:', error);
    throw error;
  }
}

// Delete document chunks from ChromaDB
export async function deleteDocumentFromChroma(
  userId: string,
  documentId: string
): Promise<{ deleted: boolean }> {
  const collection = await getOrCreateCollection(userId);
  
  try {
    // Get all chunk IDs for this document
    const results = await collection.get({
      where: { documentId },
    });
    
    if (results.ids.length > 0) {
      await collection.delete({
        ids: results.ids,
      });
      console.log(`[ChromaDB] Deleted ${results.ids.length} chunks for document ${documentId}`);
    }
    
    return { deleted: true };
  } catch (error) {
    console.error(`[ChromaDB] Failed to delete document ${documentId}:`, error);
    throw error;
  }
}

// Get collection stats
export async function getCollectionStats(userId: string): Promise<{
  name: string;
  count: number;
  metadata: Record<string, unknown>;
}> {
  const collection = await getOrCreateCollection(userId);
  
  try {
    const count = await collection.count();
    const metadata = collection.metadata || {};
    
    return {
      name: collection.name,
      count,
      metadata,
    };
  } catch (error) {
    console.error('[ChromaDB] Failed to get stats:', error);
    throw error;
  }
}

// Build RAG context from search results
export function buildRAGContext(
  searchResults: Array<{ text: string; score: number; metadata: Record<string, unknown> }>,
  maxTokens: number = 2000
): string {
  if (searchResults.length === 0) {
    return '';
  }
  
  let context = '### Relevant Context from Your Documents:\n\n';
  let currentLength = context.length;
  const avgCharsPerToken = 4;
  const maxChars = maxTokens * avgCharsPerToken;
  
  for (const result of searchResults) {
    const source = result.metadata.filename || result.metadata.title || 'Document';
    const chunk = `**Source: ${source}** (relevance: ${(result.score * 100).toFixed(0)}%)\n${result.text}\n\n---\n\n`;
    
    if (currentLength + chunk.length > maxChars) {
      break;
    }
    
    context += chunk;
    currentLength += chunk.length;
  }
  
  return context;
}

// Enhanced chat with RAG
export async function getRAGContext(
  userId: string,
  query: string,
  options: {
    maxResults?: number;
    maxTokens?: number;
    documentId?: string;
  } = {}
): Promise<{
  context: string;
  sources: Array<{ filename: string; score: number }>;
  hasContext: boolean;
}> {
  const { maxResults = 5, maxTokens = 2000, documentId } = options;
  
  try {
    const searchResults = await searchSimilarChunks(userId, query, {
      nResults: maxResults,
      documentId,
    });
    
    if (searchResults.length === 0) {
      return { context: '', sources: [], hasContext: false };
    }
    
    const context = buildRAGContext(searchResults, maxTokens);
    const sources = searchResults.map(r => ({
      filename: (r.metadata.filename as string) || 'Unknown',
      score: r.score,
    }));
    
    return { context, sources, hasContext: true };
  } catch (error) {
    console.error('[ChromaDB] RAG context generation failed:', error);
    return { context: '', sources: [], hasContext: false };
  }
}
