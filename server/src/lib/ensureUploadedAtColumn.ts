import { prisma } from './prisma';

/**
 * Ensures the uploadedAt column exists in the Document table
 * This is a safety check that runs on app startup
 */
export async function ensureUploadedAtColumn(): Promise<void> {
  try {
    // Check if column exists
    const checkResult = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'Document' 
      AND column_name = 'uploadedAt'
    `);

    if (Array.isArray(checkResult) && checkResult.length > 0) {
      console.log('✅ uploadedAt column exists');
      return;
    }

    console.log('⚠️  uploadedAt column missing, attempting to add it...');

    // Add column (PostgreSQL doesn't support IF NOT EXISTS for ADD COLUMN)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Document" 
        ADD COLUMN "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('✅ Column already exists (race condition)');
        return;
      }
      throw error;
    }

    // Create index
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Document_uploadedAt_idx" 
        ON "Document"("uploadedAt")
      `);
    } catch (error: any) {
      // Index creation errors are non-fatal
      if (!error.message?.includes('already exists')) {
        console.warn('⚠️  Could not create index:', error.message);
      }
    }

    // Update existing documents
    await prisma.$executeRawUnsafe(`
      UPDATE "Document"
      SET "uploadedAt" = "createdAt"
      WHERE "uploadedAt" IS NULL OR "uploadedAt" != "createdAt"
    `);

    console.log('✅ uploadedAt column added successfully');
  } catch (error: any) {
    // If column already exists, that's fine
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('✅ uploadedAt column already exists');
      return;
    }
    console.error('❌ Failed to ensure uploadedAt column:', error.message);
    // Don't throw - let the app start even if this fails
    // The migration script should handle it during build
  }
}

