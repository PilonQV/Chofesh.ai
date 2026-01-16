const mysql = require('mysql2/promise');

async function migrateDOB() {
  console.log('🚀 Starting Date of Birth Migration...\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL found');
  console.log('🔌 Connecting to database...');

  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connected to database\n');

    // Check if column already exists
    console.log('🔍 Checking if dateOfBirth column exists...');
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'dateOfBirth'"
    );

    if (columns.length > 0) {
      console.log('✅ dateOfBirth column already exists - skipping migration');
      return;
    }

    // Add dateOfBirth column
    console.log('📝 Adding dateOfBirth column to users table...');
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN dateOfBirth DATE NULL 
      AFTER ageVerifiedAt
    `);
    console.log('✅ dateOfBirth column added successfully\n');

    // Verify the column was added
    console.log('🔍 Verifying column...');
    const [verifyColumns] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'dateOfBirth'"
    );

    if (verifyColumns.length > 0) {
      console.log('✅ Column verified successfully\n');
      console.log('📊 Column details:');
      console.log(verifyColumns[0]);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('🎉 Date of birth field is now ready for age verification!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      console.log('\n🔌 Database connection closed');
      await connection.end();
    }
  }
}

// Run migration
migrateDOB()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
