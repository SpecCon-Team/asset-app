import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureTripTable() {
  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected!\n');

    // Check if Trip table exists
    console.log('📝 Checking if Trip table exists...');
    const tableCheck = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'Trip'
    `);

    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      console.log('⚠️  Trip table does not exist. This should be created by prisma migrate deploy.');
      console.log('📝 The migration script will only add the isPegRoute column if the table exists.');
      console.log('⚠️  If you see this message, ensure prisma migrate deploy runs successfully.\n');
      await prisma.$disconnect();
      // Don't exit with error - let prisma migrate deploy handle table creation
      return;
    }

    console.log('✅ Trip table exists!\n');

    // Check if isPegRoute column exists
    console.log('📝 Checking if isPegRoute column exists...');
    const columnCheck = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Trip' 
      AND column_name = 'isPegRoute'
    `);

    if (Array.isArray(columnCheck) && columnCheck.length > 0) {
      console.log('✅ Column isPegRoute already exists! Skipping migration.\n');
      await prisma.$disconnect();
      return;
    }

    // Add isPegRoute column
    console.log('📝 Adding isPegRoute column to Trip table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Trip" 
      ADD COLUMN IF NOT EXISTS "isPegRoute" BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('✅ Column added!\n');

    // Add index if it doesn't exist
    console.log('📝 Creating index on isPegRoute...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Trip_isPegRoute_idx" 
        ON "Trip"("isPegRoute")
      `);
      console.log('✅ Index created!\n');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Migration completed successfully!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

ensureTripTable()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

