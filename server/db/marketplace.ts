/**
 * Database functions for Agent Marketplace.
 */

import { getDb } from "../db";
import { marketplaceItems, marketplaceRatings, userInstallations } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InsertMarketplaceItem, InsertUserInstallation } from "../../drizzle/schema";

export async function createMarketplaceItem(data: Omit<InsertMarketplaceItem, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(marketplaceItems).values(data as any);
  return { id: result[0].insertId, ...data };
}

export async function getMarketplaceItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getMarketplaceItemBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(marketplaceItems).where(eq(marketplaceItems.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getMarketplaceItems(options: {
  category?: string;
  itemType?: string;
  sortBy?: "rating" | "installCount" | "createdAt";
}) {
  const db = await getDb();
  if (!db) return [];
  
  const { category, itemType, sortBy = "rating" } = options;
  
  const conditions = [eq(marketplaceItems.status, "published")];
  if (category) {
    conditions.push(eq(marketplaceItems.category, category as any));
  }
  if (itemType) {
    conditions.push(eq(marketplaceItems.itemType, itemType as any));
  }
  
  return await db.select().from(marketplaceItems)
    .where(and(...conditions))
    .orderBy(desc(marketplaceItems[sortBy]))
    .limit(50);
}

export async function installUserItem(data: InsertUserInstallation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(userInstallations).values(data as any);
  
  // Increment install count
  const item = await getMarketplaceItemById(data.itemId);
  if (item) {
    await db.update(marketplaceItems)
      .set({ installCount: (item.installCount || 0) + 1 })
      .where(eq(marketplaceItems.id, data.itemId));
  }
  
  return { id: result[0].insertId, ...data };
}

export async function getUserInstallations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(userInstallations).where(eq(userInstallations.userId, userId));
}
