const mysql = require('mysql2/promise');

async function addDateOfBirthColumn() {
  console.log('🚀 Adding dateOfBirth column to users table...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connected to database\n');

    // Check if column exists
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'dateOfBirth'"
    );

    if (columns.length > 0) {
      console.log('✅ dateOfBirth column already exists');
      return;
    }

    // Add column
    console.log('📝 Adding dateOfBirth column...');
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN dateOfBirth DATE NULL 
      AFTER ageVerifiedAt
    `);

    console.log('✅ Column added successfully!\n');

    // Verify
    const [verify] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'dateOfBirth'"
    );
    console.log('📊 Column details:', verify[0]);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connection closed');
    }
  }
}

addDateOfBirthColumn()
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
