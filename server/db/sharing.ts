/**
 * Database functions for Conversation Sharing.
 */

import { getDb } from "../db";
import { sharedConversations, conversationCollaborators, conversationComments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import type { InsertSharedConversation, InsertConversationCollaborator, InsertConversationComment } from "../../drizzle/schema";

export async function createSharedConversation(data: Omit<InsertSharedConversation, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sharedConversations).values(data as any);
  return { id: result[0].insertId, ...data };
}

export async function getSharedConversationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(sharedConversations).where(eq(sharedConversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getSharedConversationByToken(accessToken: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(sharedConversations).where(eq(sharedConversations.accessToken, accessToken)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function addCollaborator(data: Omit<InsertConversationCollaborator, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversationCollaborators).values(data as any);
  return { id: result[0].insertId, ...data };
}

export async function getCollaborator(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(conversationCollaborators)
    .where(and(eq(conversationCollaborators.conversationId, conversationId), eq(conversationCollaborators.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function addComment(data: Omit<InsertConversationComment, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversationComments).values(data as any);
  return { id: result[0].insertId, ...data };
}

export async function getComments(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(conversationComments).where(eq(conversationComments.conversationId, conversationId));
}
