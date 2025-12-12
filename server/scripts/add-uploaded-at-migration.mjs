import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const prisma = new PrismaClient();

async function addUploadedAtColumn() {
  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected!\n');

    // Check if column already exists
    console.log('📝 Checking if uploadedAt column exists...');
    const checkResult = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Document' 
      AND column_name = 'uploadedAt'
    `);

    if (Array.isArray(checkResult) && checkResult.length > 0) {
      console.log('✅ Column uploadedAt already exists! Skipping migration.\n');
      await prisma.$disconnect();
      return;
    }

    // Add uploadedAt column
    console.log('📝 Adding uploadedAt column to Document table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Document" 
      ADD COLUMN "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ Column added!\n');

    // Create index
    console.log('📝 Creating index on uploadedAt...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Document_uploadedAt_idx" 
        ON "Document"("uploadedAt")
      `);
      console.log('✅ Index created!\n');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Update existing documents to set uploadedAt from createdAt if needed
    console.log('📝 Updating existing documents to set uploadedAt from createdAt...');
    const updateResult = await prisma.$executeRawUnsafe(`
      UPDATE "Document"
      SET "uploadedAt" = "createdAt"
      WHERE "uploadedAt" IS NULL OR "uploadedAt" != "createdAt"
    `);
    console.log(`✅ Updated ${updateResult} documents!\n`);

    console.log('✅ Migration completed successfully!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addUploadedAtColumn()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

