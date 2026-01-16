-- Agent Memory System Database Migration
-- Run this SQL script in your production database to create the agent memory tables

-- 1. Agent Short-Term Memory Table
-- Stores recent conversation messages (last 20 per user)
CREATE TABLE IF NOT EXISTS `agent_short_term_memory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `role` ENUM('user', 'assistant', 'system') NOT NULL,
  `content` TEXT NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_timestamp` (`userId`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Agent Long-Term Memory Table
-- Stores user preferences, past interactions, and learning patterns
CREATE TABLE IF NOT EXISTS `agent_long_term_memory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `preferenceType` VARCHAR(100) NOT NULL,
  `preferenceValue` TEXT NOT NULL,
  `confidence` INT NOT NULL DEFAULT 50,
  `lastUpdated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_type` (`userId`, `preferenceType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Agent Episodic Memory Table
-- Stores specific experiences and outcomes (last 50 per user)
CREATE TABLE IF NOT EXISTS `agent_episodic_memory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `episodeType` VARCHAR(100) NOT NULL,
  `context` TEXT NOT NULL,
  `action` TEXT NOT NULL,
  `result` TEXT NOT NULL,
  `outcome` ENUM('success', 'partial', 'failure') NOT NULL,
  `confidence` INT NOT NULL DEFAULT 50,
  `toolsUsed` JSON,
  `duration` INT NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_type` (`userId`, `episodeType`),
  INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Agent Tool Preferences Table
-- Tracks tool usage statistics and success rates
CREATE TABLE IF NOT EXISTS `agent_tool_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `toolName` VARCHAR(100) NOT NULL,
  `usageCount` INT NOT NULL DEFAULT 0,
  `successCount` INT NOT NULL DEFAULT 0,
  `failureCount` INT NOT NULL DEFAULT 0,
  `averageDuration` INT NOT NULL DEFAULT 0,
  `lastUsed` DATETIME,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_tool` (`userId`, `toolName`),
  INDEX `idx_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SHOW TABLES LIKE 'agent_%';
