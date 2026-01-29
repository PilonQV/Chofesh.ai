/**
 * Projects Management Library
 * 
 * Handles CRUD operations for user projects
 */

import { getDb } from "../db";
import { projects, projectImages, projectFiles, PROJECT_TYPES, PROJECT_STATUS } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface CreateProjectInput {
  userId: number;
  type: keyof typeof PROJECT_TYPES;
  title: string;
  description?: string;
  inputs?: Record<string, any>;
}

export interface UpdateProjectInput {
  status?: keyof typeof PROJECT_STATUS;
  outputs?: {
    text?: string;
    images?: Array<{
      url: string;
      prompt: string;
      type: string;
    }>;
    files?: Array<{
      url: string;
      name: string;
      type: string;
    }>;
    metadata?: Record<string, any>;
  };
  thumbnailUrl?: string;
  completedAt?: Date;
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const projectId = crypto.randomUUID();
  
  await db.insert(projects).values({
    id: projectId,
    userId: input.userId,
    type: PROJECT_TYPES[input.type],
    title: input.title,
    description: input.description,
    inputs: input.inputs,
    status: PROJECT_STATUS.PENDING,
  });
  
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  return project;
}

/**
 * Update project
 */
export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(projects)
    .set({
      ...input,
      status: input.status ? PROJECT_STATUS[input.status] : undefined,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
  
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  return project;
}

/**
 * Get project by ID
 */
export async function getProject(projectId: string, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const conditions = userId
    ? and(eq(projects.id, projectId), eq(projects.userId, userId))
    : eq(projects.id, projectId);
  
  const [project] = await db
    .select()
    .from(projects)
    .where(conditions)
    .limit(1);
  
  return project;
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(userId: number, filters?: {
  type?: keyof typeof PROJECT_TYPES;
  status?: keyof typeof PROJECT_STATUS;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const conditions = [eq(projects.userId, userId)];
  
  if (filters?.type) {
    conditions.push(eq(projects.type, PROJECT_TYPES[filters.type]));
  }
  
  if (filters?.status) {
    conditions.push(eq(projects.status, PROJECT_STATUS[filters.status]));
  }
  
  let query = db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.createdAt));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Delete project images
  await db
    .delete(projectImages)
    .where(eq(projectImages.projectId, projectId));
  
  // Delete project files
  await db
    .delete(projectFiles)
    .where(eq(projectFiles.projectId, projectId));
  
  // Delete project
  await db
    .delete(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.userId, userId)
    ));
  
  return { success: true };
}

/**
 * Add image to project
 */
export async function addProjectImage(projectId: string, image: {
  url: string;
  prompt?: string;
  type?: string;
  order?: number;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const imageId = crypto.randomUUID();
  
  await db.insert(projectImages).values({
    id: imageId,
    projectId,
    url: image.url,
    prompt: image.prompt,
    type: image.type,
    order: image.order || 0,
    metadata: image.metadata,
  });
  
  const [projectImage] = await db
    .select()
    .from(projectImages)
    .where(eq(projectImages.id, imageId))
    .limit(1);
  
  return projectImage;
}

/**
 * Get project images
 */
export async function getProjectImages(projectId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return await db
    .select()
    .from(projectImages)
    .where(eq(projectImages.projectId, projectId))
    .orderBy(projectImages.order);
}

/**
 * Add file to project
 */
export async function addProjectFile(projectId: string, file: {
  url: string;
  name: string;
  type: string;
  size?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const fileId = crypto.randomUUID();
  
  await db.insert(projectFiles).values({
    id: fileId,
    projectId,
    url: file.url,
    name: file.name,
    type: file.type,
    size: file.size,
  });
  
  const [projectFile] = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.id, fileId))
    .limit(1);
  
  return projectFile;
}

/**
 * Get project files
 */
export async function getProjectFiles(projectId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.projectId, projectId));
}

/**
 * Generate share token for project
 */
export async function generateShareToken(projectId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const shareToken = randomBytes(32).toString('hex');
  
  await db
    .update(projects)
    .set({
      isPublic: 1,
      shareToken,
    })
    .where(and(
      eq(projects.id, projectId),
      eq(projects.userId, userId)
    ));
  
  return shareToken;
}

/**
 * Get project by share token
 */
export async function getProjectByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const [project] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.shareToken, shareToken),
      eq(projects.isPublic, 1)
    ))
    .limit(1);
  
  return project;
}
