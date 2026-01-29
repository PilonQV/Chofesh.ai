/**
 * Projects Database Schema
 * 
 * Stores all user-generated projects (kids books, websites, apps, marketing campaigns)
 */

import { mysqlTable, varchar, text, timestamp, int, json, mysqlEnum } from 'drizzle-orm/mysql-core';

export const PROJECT_TYPES = {
  KIDS_BOOK: 'kids_book',
  WEBSITE: 'website',
  APP: 'app',
  MARKETING: 'marketing',
  BUSINESS_PLAN: 'business_plan',
  OTHER: 'other',
} as const;

export const PROJECT_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/**
 * Projects table - stores all generated projects
 */
export const projects = mysqlTable('projects', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: int('user_id').notNull(),
  type: mysqlEnum('type', [
    PROJECT_TYPES.KIDS_BOOK,
    PROJECT_TYPES.WEBSITE,
    PROJECT_TYPES.APP,
    PROJECT_TYPES.MARKETING,
    PROJECT_TYPES.BUSINESS_PLAN,
    PROJECT_TYPES.OTHER,
  ]).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: mysqlEnum('status', [
    PROJECT_STATUS.PENDING,
    PROJECT_STATUS.GENERATING,
    PROJECT_STATUS.COMPLETED,
    PROJECT_STATUS.FAILED,
  ]).notNull().default(PROJECT_STATUS.PENDING),
  
  // Project inputs (what user requested)
  inputs: json('inputs').$type<Record<string, any>>(),
  
  // Project outputs (generated content)
  outputs: json('outputs').$type<{
    text?: string;
    images?: Array<{
      url: string;
      prompt: string;
      type: string; // cover, page, illustration, etc.
    }>;
    files?: Array<{
      url: string;
      name: string;
      type: string; // pdf, zip, html, etc.
    }>;
    metadata?: Record<string, any>;
  }>(),
  
  // Thumbnail for project preview
  thumbnailUrl: varchar('thumbnail_url', { length: 512 }),
  
  // Sharing
  isPublic: int('is_public').notNull().default(0), // 0 = private, 1 = public
  shareToken: varchar('share_token', { length: 64 }),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  completedAt: timestamp('completed_at'),
});

/**
 * Project images table - stores all images generated for projects
 */
export const projectImages = mysqlTable('project_images', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  url: varchar('url', { length: 512 }).notNull(),
  prompt: text('prompt'),
  type: varchar('type', { length: 50 }), // cover, page, illustration, logo, hero, etc.
  order: int('order').default(0), // for ordering images in sequence
  metadata: json('metadata').$type<{
    model?: string;
    width?: number;
    height?: number;
    seed?: number;
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Project files table - stores all files generated for projects
 */
export const projectFiles = mysqlTable('project_files', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  url: varchar('url', { length: 512 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // pdf, zip, html, docx, etc.
  size: int('size'), // file size in bytes
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
