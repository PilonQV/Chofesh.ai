/**
 * Database-Backed Agent Memory System
 * 
 * This replaces the in-memory storage with persistent database storage.
 * All memory (short-term, long-term, episodic) is now stored in MySQL.
 */

import { eq, desc, and, gte } from "drizzle-orm";
import { getDb } from "../db";
import {
  agentShortTermMemory,
  agentLongTermMemory,
  agentEpisodicMemory,
  agentToolPreferences,
  type InsertAgentShortTermMemory,
  type InsertAgentLongTermMemory,
  type InsertAgentEpisodicMemory,
  type InsertAgentToolPreference,
} from "../../drizzle/schema";

// ============================================================================
// TYPES
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Interaction {
  userQuery: string;
  assistantResponse: string;
  toolsUsed: string[];
  wasSuccessful: boolean;
  duration: number;
  timestamp: Date;
}

export interface Episode {
  type: string;
  context: string;
  action: string;
  result: string;
  outcome: 'success' | 'partial' | 'failure';
  timestamp: Date;
}

export interface ToolStats {
  toolName: string;
  usageCount: number;
  successRate: number;
  averageDuration: number;
}

export interface UserPreferences {
  preferredResponseStyle?: string;
  preferredLanguage?: string;
  commonTopics: string[];
}

// ============================================================================
// SHORT-TERM MEMORY (Conversation Context)
// ============================================================================

export class ShortTermMemoryDB {
  /**
   * Add a message to short-term memory
   */
  static async addMessage(
    conversationId: string,
    userId: number,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      console.warn("[AgentMemoryDB] Database not available");
      return;
    }

    try {
      await db.insert(agentShortTermMemory).values({
        conversationId,
        userId,
        role,
        content,
        timestamp: new Date(),
      });

      // Clean up old messages (keep last 20 per conversation)
      await this.cleanup(conversationId);
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to add message:", error);
    }
  }

  /**
   * Get recent messages for a conversation
   */
  static async getMessages(
    conversationId: string,
    limit: number = 20
  ): Promise<Message[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const results = await db
        .select()
        .from(agentShortTermMemory)
        .where(eq(agentShortTermMemory.conversationId, conversationId))
        .orderBy(desc(agentShortTermMemory.timestamp))
        .limit(limit);

      return results.reverse().map(r => ({
        role: r.role,
        content: r.content,
        timestamp: r.timestamp,
      }));
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to get messages:", error);
      return [];
    }
  }

  /**
   * Clean up old messages (keep last 20)
   */
  private static async cleanup(conversationId: string): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Get all message IDs for this conversation
      const allMessages = await db
        .select({ id: agentShortTermMemory.id })
        .from(agentShortTermMemory)
        .where(eq(agentShortTermMemory.conversationId, conversationId))
        .orderBy(desc(agentShortTermMemory.timestamp));

      // Delete messages beyond the 20 most recent
      if (allMessages.length > 20) {
        const idsToDelete = allMessages.slice(20).map(m => m.id);
        // Note: Drizzle doesn't support IN with arrays directly, so we delete one by one
        for (const id of idsToDelete) {
          await db
            .delete(agentShortTermMemory)
            .where(eq(agentShortTermMemory.id, id));
        }
      }
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to cleanup messages:", error);
    }
  }

  /**
   * Clear all messages for a conversation
   */
  static async clear(conversationId: string): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      await db
        .delete(agentShortTermMemory)
        .where(eq(agentShortTermMemory.conversationId, conversationId));
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to clear messages:", error);
    }
  }
}

// ============================================================================
// LONG-TERM MEMORY (User Preferences & History)
// ============================================================================

export class LongTermMemoryDB {
  /**
   * Get or create long-term memory for a user
   */
  static async getMemory(userId: number) {
    const db = await getDb();
    if (!db) return null;

    try {
      const results = await db
        .select()
        .from(agentLongTermMemory)
        .where(eq(agentLongTermMemory.userId, userId))
        .limit(1);

      if (results.length === 0) {
        // Create new memory entry
        await db.insert(agentLongTermMemory).values({
          userId,
          recentInteractions: JSON.stringify([]),
          toolUsageStats: JSON.stringify({}),
          commonTopics: JSON.stringify([]),
          learningPatterns: JSON.stringify({}),
        });

        return {
          recentInteractions: [],
          toolUsageStats: {},
          commonTopics: [],
          learningPatterns: {},
        };
      }

      const memory = results[0];
      return {
        preferredResponseStyle: memory.preferredResponseStyle,
        preferredLanguage: memory.preferredLanguage,
        recentInteractions: JSON.parse(memory.recentInteractions || '[]'),
        toolUsageStats: JSON.parse(memory.toolUsageStats || '{}'),
        commonTopics: JSON.parse(memory.commonTopics || '[]'),
        learningPatterns: JSON.parse(memory.learningPatterns || '{}'),
      };
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to get long-term memory:", error);
      return null;
    }
  }

  /**
   * Record an interaction
   */
  static async recordInteraction(
    userId: number,
    userQuery: string,
    assistantResponse: string,
    toolsUsed: string[],
    wasSuccessful: boolean,
    duration: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const memory = await this.getMemory(userId);
      if (!memory) return;

      const interaction: Interaction = {
        userQuery,
        assistantResponse,
        toolsUsed,
        wasSuccessful,
        duration,
        timestamp: new Date(),
      };

      // Add to recent interactions (keep last 100)
      const interactions = memory.recentInteractions || [];
      interactions.push(interaction);
      if (interactions.length > 100) {
        interactions.shift();
      }

      // Update tool usage stats
      const toolStats = memory.toolUsageStats || {};
      for (const tool of toolsUsed) {
        if (!toolStats[tool]) {
          toolStats[tool] = { uses: 0, successes: 0 };
        }
        toolStats[tool].uses++;
        if (wasSuccessful) {
          toolStats[tool].successes++;
        }
      }

      // Update common topics (simple keyword extraction)
      const topics = memory.commonTopics || [];
      const keywords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      for (const keyword of keywords.slice(0, 3)) {
        if (!topics.includes(keyword)) {
          topics.push(keyword);
          if (topics.length > 20) topics.shift();
        }
      }

      // Save updated memory
      await db
        .update(agentLongTermMemory)
        .set({
          recentInteractions: JSON.stringify(interactions),
          toolUsageStats: JSON.stringify(toolStats),
          commonTopics: JSON.stringify(topics),
          updatedAt: new Date(),
        })
        .where(eq(agentLongTermMemory.userId, userId));
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to record interaction:", error);
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: number,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const updates: any = { updatedAt: new Date() };
      if (preferences.preferredResponseStyle) {
        updates.preferredResponseStyle = preferences.preferredResponseStyle;
      }
      if (preferences.preferredLanguage) {
        updates.preferredLanguage = preferences.preferredLanguage;
      }

      await db
        .update(agentLongTermMemory)
        .set(updates)
        .where(eq(agentLongTermMemory.userId, userId));
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to update preferences:", error);
    }
  }
}

// ============================================================================
// EPISODIC MEMORY (Specific Experiences)
// ============================================================================

export class EpisodicMemoryDB {
  /**
   * Record an episode
   */
  static async recordEpisode(
    userId: number,
    episodeType: string,
    context: string,
    action: string,
    result: string,
    outcome: 'success' | 'partial' | 'failure',
    toolsUsed: string[] = [],
    duration?: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Calculate confidence based on outcome
      const confidence = outcome === 'success' ? 90 : outcome === 'partial' ? 60 : 30;

      await db.insert(agentEpisodicMemory).values({
        userId,
        episodeType,
        context,
        action,
        result,
        outcome,
        confidence,
        toolsUsed: JSON.stringify(toolsUsed),
        duration: duration || 0,
        timestamp: new Date(),
      });

      // Clean up old episodes (keep last 50 per user)
      await this.cleanup(userId);
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to record episode:", error);
    }
  }

  /**
   * Get relevant episodes for a query
   */
  static async getRelevantEpisodes(
    userId: number,
    query: string,
    limit: number = 5
  ): Promise<Episode[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      // Get recent successful episodes
      const results = await db
        .select()
        .from(agentEpisodicMemory)
        .where(
          and(
            eq(agentEpisodicMemory.userId, userId),
            eq(agentEpisodicMemory.outcome, 'success')
          )
        )
        .orderBy(desc(agentEpisodicMemory.timestamp))
        .limit(limit);

      return results.map(r => ({
        type: r.episodeType,
        context: r.context,
        action: r.action,
        result: r.result,
        outcome: r.outcome,
        timestamp: r.timestamp,
      }));
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to get episodes:", error);
      return [];
    }
  }

  /**
   * Clean up old episodes (keep last 50)
   */
  private static async cleanup(userId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const allEpisodes = await db
        .select({ id: agentEpisodicMemory.id })
        .from(agentEpisodicMemory)
        .where(eq(agentEpisodicMemory.userId, userId))
        .orderBy(desc(agentEpisodicMemory.timestamp));

      if (allEpisodes.length > 50) {
        const idsToDelete = allEpisodes.slice(50).map(e => e.id);
        for (const id of idsToDelete) {
          await db
            .delete(agentEpisodicMemory)
            .where(eq(agentEpisodicMemory.id, id));
        }
      }
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to cleanup episodes:", error);
    }
  }
}

// ============================================================================
// TOOL PREFERENCES (Learning Which Tools Work Best)
// ============================================================================

export class ToolPreferencesDB {
  /**
   * Record tool usage
   */
  static async recordUsage(
    userId: number,
    toolName: string,
    wasSuccessful: boolean,
    duration: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Get existing preference
      const existing = await db
        .select()
        .from(agentToolPreferences)
        .where(
          and(
            eq(agentToolPreferences.userId, userId),
            eq(agentToolPreferences.toolName, toolName)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        // Create new
        await db.insert(agentToolPreferences).values({
          userId,
          toolName,
          usageCount: 1,
          successCount: wasSuccessful ? 1 : 0,
          failureCount: wasSuccessful ? 0 : 1,
          averageDuration: duration,
          lastUsed: new Date(),
        });
      } else {
        // Update existing
        const pref = existing[0];
        const newUsageCount = pref.usageCount + 1;
        const newSuccessCount = pref.successCount + (wasSuccessful ? 1 : 0);
        const newFailureCount = pref.failureCount + (wasSuccessful ? 0 : 1);
        const newAvgDuration = Math.round(
          (pref.averageDuration * pref.usageCount + duration) / newUsageCount
        );

        await db
          .update(agentToolPreferences)
          .set({
            usageCount: newUsageCount,
            successCount: newSuccessCount,
            failureCount: newFailureCount,
            averageDuration: newAvgDuration,
            lastUsed: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(agentToolPreferences.id, pref.id));
      }
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to record tool usage:", error);
    }
  }

  /**
   * Get preferred tools for a user
   */
  static async getPreferredTools(userId: number): Promise<ToolStats[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const results = await db
        .select()
        .from(agentToolPreferences)
        .where(eq(agentToolPreferences.userId, userId))
        .orderBy(desc(agentToolPreferences.usageCount));

      return results.map(r => ({
        toolName: r.toolName,
        usageCount: r.usageCount,
        successRate: r.usageCount > 0 ? r.successCount / r.usageCount : 0,
        averageDuration: r.averageDuration,
      }));
    } catch (error) {
      console.error("[AgentMemoryDB] Failed to get preferred tools:", error);
      return [];
    }
  }
}

// ============================================================================
// UNIFIED MEMORY INTERFACE (Backwards Compatible)
// ============================================================================

export class AgentMemoryDB {
  static shortTerm = ShortTermMemoryDB;
  static longTerm = LongTermMemoryDB;
  static episodic = EpisodicMemoryDB;
  static toolPreferences = ToolPreferencesDB;

  /**
   * Get full context for a query (combines all memory types)
   */
  static async getFullContext(
    userId: number,
    conversationId: string,
    currentQuery: string
  ) {
    const [recentMessages, longTermMemory, relevantEpisodes, preferredTools] = await Promise.all([
      ShortTermMemoryDB.getMessages(conversationId),
      LongTermMemoryDB.getMemory(userId),
      EpisodicMemoryDB.getRelevantEpisodes(userId, currentQuery),
      ToolPreferencesDB.getPreferredTools(userId),
    ]);

    return {
      recentMessages,
      relevantPastInteractions: longTermMemory?.recentInteractions.slice(-10) || [],
      relevantEpisodes,
      preferredTools,
      userPreferences: {
        preferredResponseStyle: longTermMemory?.preferredResponseStyle,
        preferredLanguage: longTermMemory?.preferredLanguage,
      },
    };
  }
}
