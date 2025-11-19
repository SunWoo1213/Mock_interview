/**
 * Add voice column to interview_sessions table
 * Run: node scripts/run-add-voice-column.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🔄 Starting migration: Add voice column...\n');

  // Database connection
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'add-voice-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute migration
    console.log('📝 Executing migration SQL...\n');
    const result = await client.query(sql);
    
    // Display results
    console.log('✅ Migration completed successfully!\n');
    
    if (result.length > 0 && result[result.length - 1].rows) {
      console.log('📊 Verification result:');
      console.table(result[result.length - 1].rows);
    }

    console.log('\n🎉 Voice column is now ready for use!');
    console.log('   Supported voices: alloy, echo, fable, onyx, nova, shimmer\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();



