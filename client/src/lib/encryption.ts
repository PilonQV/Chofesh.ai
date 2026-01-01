/**
 * Client-side encryption utilities for storing conversations locally.
 * Uses Web Crypto API for secure AES-GCM encryption.
 */

const ENCRYPTION_KEY_NAME = "libre-ai-encryption-key";

// Generate a random encryption key
async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export key to storable format
async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(Array.from(new Uint8Array(exported), (b) => String.fromCharCode(b)).join(""));
}

// Import key from stored format
async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Get or create encryption key
async function getEncryptionKey(): Promise<CryptoKey> {
  const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME);
  
  if (storedKey) {
    try {
      return await importKey(storedKey);
    } catch {
      // Key corrupted, generate new one
      localStorage.removeItem(ENCRYPTION_KEY_NAME);
    }
  }
  
  const newKey = await generateKey();
  const exportedKey = await exportKey(newKey);
  localStorage.setItem(ENCRYPTION_KEY_NAME, exportedKey);
  return newKey;
}

// Encrypt data
export async function encrypt(data: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data)
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(""));
}

// Decrypt data
export async function decrypt(encryptedData: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Storage interface for encrypted conversations
export interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
  }>;
  model: string;
  createdAt: number;
  updatedAt: number;
}

const CONVERSATIONS_KEY = "libre-ai-conversations";

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  const encrypted = await encrypt(JSON.stringify(conversations));
  localStorage.setItem(CONVERSATIONS_KEY, encrypted);
}

export async function loadConversations(): Promise<Conversation[]> {
  const encrypted = localStorage.getItem(CONVERSATIONS_KEY);
  if (!encrypted) return [];
  
  try {
    const decrypted = await decrypt(encrypted);
    return JSON.parse(decrypted);
  } catch {
    // Data corrupted or key changed
    return [];
  }
}

export async function addConversation(conversation: Conversation): Promise<void> {
  const conversations = await loadConversations();
  conversations.unshift(conversation);
  await saveConversations(conversations);
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
  const conversations = await loadConversations();
  const index = conversations.findIndex((c) => c.id === id);
  if (index !== -1) {
    conversations[index] = { ...conversations[index], ...updates, updatedAt: Date.now() };
    await saveConversations(conversations);
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const conversations = await loadConversations();
  const filtered = conversations.filter((c) => c.id !== id);
  await saveConversations(filtered);
}

export async function clearAllConversations(): Promise<void> {
  localStorage.removeItem(CONVERSATIONS_KEY);
}

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID();
}
