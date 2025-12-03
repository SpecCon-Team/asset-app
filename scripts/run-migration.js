/**
 * Migration Script: Add Client Codes to PEGClient table
 * Run this script to add the clientCode column to your Render database
 */

const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

async function runMigration() {
  // Use DATABASE_URL from your .env file
  const client = new Client({
    connectionString: process.env.DATABASE_URL
    // Render doesn't require SSL config in the connection
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1: Add clientCode column
    console.log('📝 Step 1: Adding clientCode column...');
    await client.query('ALTER TABLE "PEGClient" ADD COLUMN IF NOT EXISTS "clientCode" TEXT');
    console.log('✅ Column added!\n');

    // Step 2: Generate client codes for existing clients
    console.log('📝 Step 2: Generating client codes for existing clients...');
    const result = await client.query(`
      DO $$
      DECLARE
          client_record RECORD;
          counter INT := 1;
      BEGIN
          FOR client_record IN 
              SELECT id FROM "PEGClient" WHERE "clientCode" IS NULL ORDER BY "createdAt" ASC
          LOOP
              UPDATE "PEGClient" 
              SET "clientCode" = 'CLT-' || LPAD(counter::TEXT, 3, '0')
              WHERE id = client_record.id;
              
              counter := counter + 1;
          END LOOP;
      END $$;
    `);
    console.log('✅ Client codes generated!\n');

    // Step 3: Add unique constraint (only if it doesn't exist)
    console.log('📝 Step 3: Adding unique constraint...');
    try {
      await client.query('ALTER TABLE "PEGClient" ADD CONSTRAINT "PEGClient_clientCode_key" UNIQUE ("clientCode")');
      console.log('✅ Constraint added!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Constraint already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Step 4: Create index (only if it doesn't exist)
    console.log('📝 Step 4: Creating index...');
    try {
      await client.query('CREATE INDEX "PEGClient_clientCode_idx" ON "PEGClient"("clientCode")');
      console.log('✅ Index created!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Verify results
    console.log('🔍 Verifying results...');
    const verifyResult = await client.query('SELECT id, "clientCode", name FROM "PEGClient" LIMIT 5');
    console.log('Sample clients:');
    console.table(verifyResult.rows);

    console.log('\n🎉 Migration completed successfully!');
    console.log('You can now create new clients and they will get auto-generated serial numbers.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Disconnected from database');
  }
}

runMigration();
