import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const prisma = new PrismaClient();

async function fixUploadedAt() {
  try {
    console.log('🔍 Updating documents to set uploadedAt from createdAt...');
    
    // Use raw SQL to update all documents where uploadedAt should match createdAt
    // This ensures all existing documents have the correct upload date
    const result = await prisma.$executeRaw`
      UPDATE "Document"
      SET "uploadedAt" = "createdAt"
      WHERE "uploadedAt" IS NULL OR "uploadedAt" != "createdAt"
    `;

    console.log(`✅ Updated ${result} documents!`);
    
    // Verify the update
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Document"
      WHERE "uploadedAt" IS NULL
    `;
    
    const nullCount = Number(count[0]?.count || 0);
    if (nullCount > 0) {
      console.log(`⚠️  Warning: ${nullCount} documents still have NULL uploadedAt`);
    } else {
      console.log('✅ All documents now have uploadedAt set!');
    }
  } catch (error) {
    console.error('❌ Error fixing uploadedAt:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixUploadedAt()
  .then(() => {
    console.log('\n🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });

