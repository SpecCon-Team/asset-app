import 'dotenv/config';
import { Client } from 'pg';

async function addFileContentColumn() {
  // Connect to production database
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon/production databases
  });

  try {
    console.log('🔗 Connecting to production database...');
    await client.connect();

    console.log('📝 Adding fileContent column to Document table...');

    // Add the fileContent column
    await client.query(`
      ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "fileContent" BYTEA;
    `);

    console.log('✅ Column added successfully!');

    // Verify the column exists
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Document' AND column_name = 'fileContent';
    `);

    if (result.rows.length > 0) {
      console.log('🔍 Verification: fileContent column exists');
      console.log('   Column:', result.rows[0].column_name);
      console.log('   Type:', result.rows[0].data_type);
      console.log('   Nullable:', result.rows[0].is_nullable);
    } else {
      console.log('❌ Column verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

addFileContentColumn();