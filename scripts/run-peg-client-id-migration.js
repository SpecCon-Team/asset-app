/**
 * Migration Script: Add pegClientId to Asset table
 * Run this script to add the pegClientId column to your Render database
 */

const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 Connecting to Render database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Add pegClientId column
    console.log('📝 Step 1: Adding pegClientId column to Asset table...');
    await client.query('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "pegClientId" TEXT');
    console.log('✅ Column added!\n');

    // Step 2: Add foreign key constraint
    console.log('📝 Step 2: Adding foreign key constraint...');
    try {
      await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'Asset_pegClientId_fkey'
            ) THEN
                ALTER TABLE "Asset" ADD CONSTRAINT "Asset_pegClientId_fkey" 
                FOREIGN KEY ("pegClientId") REFERENCES "PEGClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
        END $$;
      `);
      console.log('✅ Foreign key constraint added!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Constraint already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Step 3: Create index
    console.log('📝 Step 3: Creating index for better performance...');
    try {
      await client.query('CREATE INDEX IF NOT EXISTS "Asset_pegClientId_idx" ON "Asset"("pegClientId")');
      console.log('✅ Index created!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Verify results
    console.log('🔍 Verifying schema...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Asset' AND column_name = 'pegClientId'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('\n✅ pegClientId column exists in Asset table:');
      console.table(verifyResult.rows);
    } else {
      console.log('\n❌ pegClientId column not found!');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('Assets can now be assigned to PEG clients.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Disconnected from database');
  }
}

runMigration();
