import { PrismaClient } from '@prisma/client';
import pg from 'pg';
const { Client } = pg;

const prisma = new PrismaClient();

async function addPegClientIdColumn() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check if column already exists
    console.log('📝 Checking if pegClientId column exists...');
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Asset' 
      AND column_name = 'pegClientId'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Column pegClientId already exists! Skipping migration.\n');
      await client.end();
      return;
    }

    // Add pegClientId column
    console.log('📝 Adding pegClientId column to Asset table...');
    await client.query(`
      ALTER TABLE "Asset" 
      ADD COLUMN IF NOT EXISTS "pegClientId" TEXT
    `);
    console.log('✅ Column added!\n');

    // Add foreign key constraint
    console.log('📝 Adding foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE "Asset" 
        ADD CONSTRAINT "Asset_pegClientId_fkey" 
        FOREIGN KEY ("pegClientId") 
        REFERENCES "PEGClient"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key constraint added!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Foreign key constraint already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Add index
    console.log('📝 Creating index on pegClientId...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Asset_pegClientId_idx" 
        ON "Asset"("pegClientId")
      `);
      console.log('✅ Index created!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Migration completed successfully!\n');
    await client.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.end();
    process.exit(1);
  }
}

addPegClientIdColumn()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

