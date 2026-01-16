#!/usr/bin/env node
/**
 * Agent Memory Database Migration Script
 * Run with: node migrate.js
 */

import mysql from 'mysql2/promise';

const migrations = [
  {
    name: 'agent_short_term_memory',
    sql: `CREATE TABLE IF NOT EXISTS agent_short_term_memory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      role ENUM('user', 'assistant', 'system') NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_timestamp (userId, timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'agent_long_term_memory',
    sql: `CREATE TABLE IF NOT EXISTS agent_long_term_memory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      preferenceType VARCHAR(100) NOT NULL,
      preferenceValue TEXT NOT NULL,
      confidence INT NOT NULL DEFAULT 50,
      lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_type (userId, preferenceType)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'agent_episodic_memory',
    sql: `CREATE TABLE IF NOT EXISTS agent_episodic_memory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      episodeType VARCHAR(100) NOT NULL,
      context TEXT NOT NULL,
      action TEXT NOT NULL,
      result TEXT NOT NULL,
      outcome ENUM('success', 'partial', 'failure') NOT NULL,
      confidence INT NOT NULL DEFAULT 50,
      toolsUsed JSON,
      duration INT NOT NULL,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_type (userId, episodeType),
      INDEX idx_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'agent_tool_preferences',
    sql: `CREATE TABLE IF NOT EXISTS agent_tool_preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      toolName VARCHAR(100) NOT NULL,
      usageCount INT NOT NULL DEFAULT 0,
      successCount INT NOT NULL DEFAULT 0,
      failureCount INT NOT NULL DEFAULT 0,
      averageDuration INT NOT NULL DEFAULT 0,
      lastUsed DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_tool (userId, toolName),
      INDEX idx_user (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  }
];

async function runMigration() {
  console.log('🚀 Starting Agent Memory Migration...\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL found');

  let connection;
  try {
    // Create connection
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connected to database\n');

    // Run each migration
    for (const migration of migrations) {
      console.log(`📝 Creating table: ${migration.name}...`);
      try {
        await connection.execute(migration.sql);
        console.log(`✅ ${migration.name} created successfully`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`ℹ️  ${migration.name} already exists (skipped)`);
        } else {
          throw error;
        }
      }
    }

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const [rows] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name LIKE 'agent_%'
      ORDER BY table_name
    `);

    console.log('\n📊 Agent Memory Tables:');
    rows.forEach(row => {
      console.log(`   ✓ ${row.table_name || row.TABLE_NAME}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('🎉 Agent memory tables are now ready!\n');
    console.log('Next steps:');
    console.log('1. Restart your Render service (or it will auto-restart)');
    console.log('2. Test the agent with: "what is today\'s silver price?"');
    console.log('3. Check logs for any database errors\n');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
