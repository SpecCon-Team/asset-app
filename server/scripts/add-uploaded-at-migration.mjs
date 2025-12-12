import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from multiple possible locations
dotenv.config({ path: './.env' });
dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

async function addUploadedAtColumn() {
  try {
    console.log('🔌 Connecting to database...');
    console.log('📊 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    await prisma.$connect();
    console.log('✅ Connected!\n');

    // Check if Document table exists
    console.log('📝 Checking if Document table exists...');
    const tableCheck = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Document'
    `);

    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      console.log('⚠️  Document table does not exist. This should be created by prisma migrate deploy.');
      console.log('⚠️  If you see this message, ensure prisma migrate deploy runs successfully.\n');
      await prisma.$disconnect();
      return;
    }
    console.log('✅ Document table exists!\n');

    // Check if column already exists
    console.log('📝 Checking if uploadedAt column exists...');
    const checkResult = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'Document' 
      AND column_name = 'uploadedAt'
    `);

    if (Array.isArray(checkResult) && checkResult.length > 0) {
      console.log('✅ Column uploadedAt already exists! Skipping migration.\n');
      await prisma.$disconnect();
      return;
    }

    // Add uploadedAt column
    console.log('📝 Adding uploadedAt column to Document table...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Document" 
        ADD COLUMN "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Column added!\n');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Column already exists (detected via error), skipping...\n');
      } else {
        throw error;
      }
    }

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

    // Verify column was created
    console.log('🔍 Verifying uploadedAt column was created...');
    const verifyResult = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'Document' 
      AND column_name = 'uploadedAt'
    `);

    if (!Array.isArray(verifyResult) || verifyResult.length === 0) {
      throw new Error('❌ Column verification failed - uploadedAt column was not created!');
    }
    console.log('✅ Column verified:', verifyResult[0]);
    console.log('');

    // Update existing documents to set uploadedAt from createdAt if needed
    console.log('📝 Updating existing documents to set uploadedAt from createdAt...');
    try {
      const updateResult = await prisma.$executeRawUnsafe(`
        UPDATE "Document"
        SET "uploadedAt" = "createdAt"
        WHERE "uploadedAt" IS NULL OR "uploadedAt" != "createdAt"
      `);
      console.log(`✅ Updated ${updateResult} documents!\n`);
    } catch (error) {
      console.log('⚠️  Could not update documents (this is OK if table is empty):', error.message);
    }

    console.log('✅ Migration completed successfully!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
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

