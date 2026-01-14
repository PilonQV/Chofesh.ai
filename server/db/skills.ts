/**
 * Database functions for Skills Registry.
 */

import { getDb } from "../db";
import { skills, skillRatings } from "../../drizzle/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import type { InsertSkill, InsertSkillRating } from "../../drizzle/schema";

export async function getSkillById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getSkillBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPublicSkills(options: {
  category?: string;
  sortBy?: "rating" | "usageCount" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const db = await getDb();
  if (!db) return [];
  
  const { category, sortBy = "rating", sortOrder = "desc" } = options;
  
  const conditions = [eq(skills.isPublic, true)];
  if (category) {
    conditions.push(eq(skills.category, category as any));
  }
  
  const orderFn = sortOrder === "asc" ? asc : desc;
  
  return await db.select().from(skills)
    .where(and(...conditions))
    .orderBy(orderFn(skills[sortBy]))
    .limit(50);
}

export async function createSkill(data: Omit<InsertSkill, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(skills).values(data as any);
  return { id: result[0].insertId, ...data };
}

export async function updateSkill(id: number, data: Partial<InsertSkill>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(skills).set(data as any).where(eq(skills.id, id));
  return await getSkillById(id);
}

export async function rateSkill(data: { skillId: number; userId: number; rating: number; review?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user has already rated this skill
  const existing = await db.select().from(skillRatings)
    .where(and(eq(skillRatings.skillId, data.skillId), eq(skillRatings.userId, data.userId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing rating
    await db.update(skillRatings)
      .set({ rating: data.rating, review: data.review })
      .where(eq(skillRatings.id, existing[0].id));
  } else {
    // Insert new rating
    await db.insert(skillRatings).values(data as any);
  }

  // Recalculate average rating for the skill
  const result = await db.select({ 
    avgRating: sql<number>`AVG(${skillRatings.rating})`,
    count: sql<number>`COUNT(${skillRatings.id})`,
  }).from(skillRatings).where(eq(skillRatings.skillId, data.skillId));

  const avgRating = result[0]?.avgRating || 0;
  const ratingCount = result[0]?.count || 0;

  await updateSkill(data.skillId, { 
    rating: Math.round(avgRating * 100),
    ratingCount,
  });

  return { success: true };
}
