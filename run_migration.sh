#!/bin/bash
# Automatic Agent Memory Migration Script
# This script parses DATABASE_URL and runs the migration

set -e

echo "🚀 Starting Agent Memory Migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ DATABASE_URL found"

# Parse DATABASE_URL (format: mysql://user:password@host:port/database)
DB_URL=$DATABASE_URL

# Extract components using parameter expansion
# Remove mysql:// prefix
DB_URL_NO_PROTOCOL=${DB_URL#mysql://}

# Extract user:password@host:port/database
USER_PASS_HOST=${DB_URL_NO_PROTOCOL%/*}
DATABASE=${DB_URL_NO_PROTOCOL##*/}

# Extract user:password and host:port
USER_PASS=${USER_PASS_HOST%@*}
HOST_PORT=${USER_PASS_HOST#*@}

# Extract user and password
DB_USER=${USER_PASS%:*}
DB_PASSWORD=${USER_PASS#*:}

# Extract host and port
DB_HOST=${HOST_PORT%:*}
DB_PORT=${HOST_PORT#*:}

echo "📊 Database: $DATABASE"
echo "🖥️  Host: $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"

# Run the migration SQL
echo ""
echo "🔧 Running migration SQL..."

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DATABASE" << 'EOF'
-- Agent Memory System Database Migration

-- 1. Agent Short-Term Memory Table
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
SELECT 'agent_short_term_memory' as 'Table', COUNT(*) as 'Exists' FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'agent_short_term_memory'
UNION ALL
SELECT 'agent_long_term_memory', COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'agent_long_term_memory'
UNION ALL
SELECT 'agent_episodic_memory', COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'agent_episodic_memory'
UNION ALL
SELECT 'agent_tool_preferences', COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'agent_tool_preferences';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo "🎉 Agent memory tables are now ready!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your Render service (or it will auto-restart)"
    echo "2. Test the agent with: 'what is today's silver price?'"
    echo "3. Check logs for any database errors"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above"
    exit 1
fi
