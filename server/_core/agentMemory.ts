/**
 * Agent Memory System for Chofesh.ai
 * 
 * Implements short-term and long-term memory for the autonomous agent
 * to enable learning, context retention, and personalization.
 * 
 * Memory Types:
 * 1. Short-term Memory: Current conversation context (working memory)
 * 2. Long-term Memory: User preferences, past interactions, learned patterns
 * 3. Episodic Memory: Specific past experiences and their outcomes
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ShortTermMemory {
  conversationId: string;
  messages: ConversationMessage[];
  currentGoal?: string;
  activeTools: string[];
  context: Map<string, any>;  // Key-value store for current context
  timestamp: Date;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface LongTermMemory {
  userId: number;
  preferences: UserPreferences;
  interactions: InteractionHistory[];
  learnedPatterns: LearnedPattern[];
  toolUsageStats: Map<string, ToolStats>;
}

export interface UserPreferences {
  preferredResponseStyle?: 'concise' | 'detailed' | 'technical';
  preferredTools?: string[];
  topics: string[];
  language?: string;
  timezone?: string;
}

export interface InteractionHistory {
  id: string;
  timestamp: Date;
  userQuery: string;
  agentResponse: string;
  toolsUsed: string[];
  wasSuccessful: boolean;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  duration: number; // milliseconds
}

export interface LearnedPattern {
  pattern: string;
  context: string;
  successRate: number;
  timesUsed: number;
  lastUsed: Date;
}

export interface ToolStats {
  toolName: string;
  timesUsed: number;
  successRate: number;
  averageDuration: number;
  lastUsed: Date;
}

export interface EpisodicMemory {
  episode: string;
  situation: string;
  action: string;
  result: string;
  outcome: 'success' | 'failure' | 'partial';
  timestamp: Date;
  relevance: number; // 0-1 score
}

// ============================================================================
// SHORT-TERM MEMORY (In-Memory Store)
// ============================================================================

const shortTermStore = new Map<string, ShortTermMemory>();

export class ShortTermMemoryManager {
  /**
   * Initialize or retrieve short-term memory for a conversation
   */
  static getOrCreate(conversationId: string): ShortTermMemory {
    if (!shortTermStore.has(conversationId)) {
      shortTermStore.set(conversationId, {
        conversationId,
        messages: [],
        activeTools: [],
        context: new Map(),
        timestamp: new Date(),
      });
    }
    return shortTermStore.get(conversationId)!;
  }
  
  /**
   * Add a message to short-term memory
   */
  static addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: any
  ): void {
    const memory = this.getOrCreate(conversationId);
    memory.messages.push({
      role,
      content,
      timestamp: new Date(),
      metadata,
    });
    
    // Keep only last 20 messages to prevent memory overflow
    if (memory.messages.length > 20) {
      memory.messages = memory.messages.slice(-20);
    }
  }
  
  /**
   * Set the current goal in working memory
   */
  static setGoal(conversationId: string, goal: string): void {
    const memory = this.getOrCreate(conversationId);
    memory.currentGoal = goal;
  }
  
  /**
   * Add a tool to active tools list
   */
  static addActiveTool(conversationId: string, toolName: string): void {
    const memory = this.getOrCreate(conversationId);
    if (!memory.activeTools.includes(toolName)) {
      memory.activeTools.push(toolName);
    }
  }
  
  /**
   * Store arbitrary context data
   */
  static setContext(conversationId: string, key: string, value: any): void {
    const memory = this.getOrCreate(conversationId);
    memory.context.set(key, value);
  }
  
  /**
   * Retrieve context data
   */
  static getContext(conversationId: string, key: string): any {
    const memory = this.getOrCreate(conversationId);
    return memory.context.get(key);
  }
  
  /**
   * Get recent conversation history (for context)
   */
  static getRecentMessages(conversationId: string, count: number = 10): ConversationMessage[] {
    const memory = this.getOrCreate(conversationId);
    return memory.messages.slice(-count);
  }
  
  /**
   * Clear short-term memory for a conversation
   */
  static clear(conversationId: string): void {
    shortTermStore.delete(conversationId);
  }
  
  /**
   * Clean up old conversations (older than 1 hour)
   */
  static cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, memory] of Array.from(shortTermStore.entries())) {
      if (memory.timestamp < oneHourAgo) {
        shortTermStore.delete(id);
      }
    }
  }
}

// Run cleanup every 30 minutes
setInterval(() => ShortTermMemoryManager.cleanup(), 30 * 60 * 1000);

// ============================================================================
// LONG-TERM MEMORY (Persistent Store)
// ============================================================================

// In-memory store for now (TODO: Move to database)
const longTermStore = new Map<number, LongTermMemory>();

export class LongTermMemoryManager {
  /**
   * Initialize or retrieve long-term memory for a user
   */
  static getOrCreate(userId: number): LongTermMemory {
    if (!longTermStore.has(userId)) {
      longTermStore.set(userId, {
        userId,
        preferences: {
          topics: [],
        },
        interactions: [],
        learnedPatterns: [],
        toolUsageStats: new Map(),
      });
    }
    return longTermStore.get(userId)!;
  }
  
  /**
   * Record an interaction
   */
  static recordInteraction(
    userId: number,
    userQuery: string,
    agentResponse: string,
    toolsUsed: string[],
    wasSuccessful: boolean,
    duration: number
  ): void {
    const memory = this.getOrCreate(userId);
    
    const interaction: InteractionHistory = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      userQuery,
      agentResponse,
      toolsUsed,
      wasSuccessful,
      duration,
    };
    
    memory.interactions.push(interaction);
    
    // Keep only last 100 interactions
    if (memory.interactions.length > 100) {
      memory.interactions = memory.interactions.slice(-100);
    }
    
    // Update tool usage stats
    for (const tool of toolsUsed) {
      this.updateToolStats(userId, tool, wasSuccessful, duration);
    }
  }
  
  /**
   * Update tool usage statistics
   */
  static updateToolStats(
    userId: number,
    toolName: string,
    wasSuccessful: boolean,
    duration: number
  ): void {
    const memory = this.getOrCreate(userId);
    
    let stats = memory.toolUsageStats.get(toolName);
    if (!stats) {
      stats = {
        toolName,
        timesUsed: 0,
        successRate: 0,
        averageDuration: 0,
        lastUsed: new Date(),
      };
      memory.toolUsageStats.set(toolName, stats);
    }
    
    stats.timesUsed++;
    stats.lastUsed = new Date();
    
    // Update success rate (exponential moving average)
    const alpha = 0.2; // Weight for new data
    stats.successRate = alpha * (wasSuccessful ? 1 : 0) + (1 - alpha) * stats.successRate;
    
    // Update average duration (exponential moving average)
    stats.averageDuration = alpha * duration + (1 - alpha) * stats.averageDuration;
  }
  
  /**
   * Learn a pattern from successful interactions
   */
  static learnPattern(
    userId: number,
    pattern: string,
    context: string,
    wasSuccessful: boolean
  ): void {
    const memory = this.getOrCreate(userId);
    
    // Find existing pattern or create new
    let learned = memory.learnedPatterns.find(p => p.pattern === pattern);
    if (!learned) {
      learned = {
        pattern,
        context,
        successRate: 0,
        timesUsed: 0,
        lastUsed: new Date(),
      };
      memory.learnedPatterns.push(learned);
    }
    
    learned.timesUsed++;
    learned.lastUsed = new Date();
    
    // Update success rate
    const alpha = 0.3;
    learned.successRate = alpha * (wasSuccessful ? 1 : 0) + (1 - alpha) * learned.successRate;
  }
  
  /**
   * Get user preferences
   */
  static getPreferences(userId: number): UserPreferences {
    const memory = this.getOrCreate(userId);
    return memory.preferences;
  }
  
  /**
   * Update user preferences
   */
  static updatePreferences(userId: number, preferences: Partial<UserPreferences>): void {
    const memory = this.getOrCreate(userId);
    memory.preferences = { ...memory.preferences, ...preferences };
  }
  
  /**
   * Get most successful tools for a user
   */
  static getMostSuccessfulTools(userId: number, limit: number = 5): ToolStats[] {
    const memory = this.getOrCreate(userId);
    return Array.from(memory.toolUsageStats.values())
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }
  
  /**
   * Get relevant past interactions (for context)
   */
  static getRelevantInteractions(
    userId: number,
    currentQuery: string,
    limit: number = 5
  ): InteractionHistory[] {
    const memory = this.getOrCreate(userId);
    
    // Simple relevance: check if query contains similar keywords
    const queryWords = currentQuery.toLowerCase().split(/\s+/);
    
    return memory.interactions
      .map(interaction => ({
        interaction,
        relevance: this.calculateRelevance(interaction.userQuery, queryWords),
      }))
      .filter(item => item.relevance > 0.3)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(item => item.interaction);
  }
  
  /**
   * Calculate relevance score between a past query and current query
   */
  private static calculateRelevance(pastQuery: string, currentQueryWords: string[]): number {
    const pastWords = pastQuery.toLowerCase().split(/\s+/);
    const matches = currentQueryWords.filter(word => pastWords.includes(word)).length;
    return matches / Math.max(currentQueryWords.length, pastWords.length);
  }
}

// ============================================================================
// EPISODIC MEMORY (Specific Experiences)
// ============================================================================

const episodicStore = new Map<number, EpisodicMemory[]>();

export class EpisodicMemoryManager {
  /**
   * Record an episode (specific experience)
   */
  static recordEpisode(
    userId: number,
    episode: string,
    situation: string,
    action: string,
    result: string,
    outcome: 'success' | 'failure' | 'partial'
  ): void {
    if (!episodicStore.has(userId)) {
      episodicStore.set(userId, []);
    }
    
    const episodes = episodicStore.get(userId)!;
    episodes.push({
      episode,
      situation,
      action,
      result,
      outcome,
      timestamp: new Date(),
      relevance: 1.0, // Starts at max relevance, decays over time
    });
    
    // Keep only last 50 episodes
    if (episodes.length > 50) {
      episodicStore.set(userId, episodes.slice(-50));
    }
  }
  
  /**
   * Retrieve relevant episodes for current situation
   */
  static getRelevantEpisodes(
    userId: number,
    currentSituation: string,
    limit: number = 3
  ): EpisodicMemory[] {
    const episodes = episodicStore.get(userId) || [];
    
    // Calculate relevance based on situation similarity
    const situationWords = currentSituation.toLowerCase().split(/\s+/);
    
    return episodes
      .map(ep => ({
        episode: ep,
        score: this.calculateSituationSimilarity(ep.situation, situationWords) * ep.relevance,
      }))
      .filter(item => item.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.episode);
  }
  
  /**
   * Calculate similarity between situations
   */
  private static calculateSituationSimilarity(situation: string, queryWords: string[]): number {
    const sitWords = situation.toLowerCase().split(/\s+/);
    const matches = queryWords.filter(word => sitWords.includes(word)).length;
    return matches / Math.max(queryWords.length, sitWords.length);
  }
}

// ============================================================================
// MEMORY INTEGRATION
// ============================================================================

/**
 * Unified memory interface for the agent
 */
export class AgentMemory {
  static shortTerm = ShortTermMemoryManager;
  static longTerm = LongTermMemoryManager;
  static episodic = EpisodicMemoryManager;
  
  /**
   * Get complete context for the agent
   */
  static getFullContext(userId: number, conversationId: string, currentQuery: string): {
    recentMessages: ConversationMessage[];
    currentGoal?: string;
    userPreferences: UserPreferences;
    relevantPastInteractions: InteractionHistory[];
    relevantEpisodes: EpisodicMemory[];
    preferredTools: ToolStats[];
  } {
    return {
      recentMessages: this.shortTerm.getRecentMessages(conversationId, 10),
      currentGoal: this.shortTerm.getOrCreate(conversationId).currentGoal,
      userPreferences: this.longTerm.getPreferences(userId),
      relevantPastInteractions: this.longTerm.getRelevantInteractions(userId, currentQuery, 3),
      relevantEpisodes: this.episodic.getRelevantEpisodes(userId, currentQuery, 3),
      preferredTools: this.longTerm.getMostSuccessfulTools(userId, 5),
    };
  }
}
