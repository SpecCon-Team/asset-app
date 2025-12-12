import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function migrateExistingFiles() {
  console.log('🔄 Starting migration of existing document files to database...');

  try {
    // Get all documents that have filePath but no fileContent
    const documents = await prisma.document.findMany({
      where: {
        filePath: {
          not: null
        },
        fileContent: null
      }
    });

    console.log(`📄 Found ${documents.length} documents to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const doc of documents) {
      try {
        // Check if file exists on disk
        const fileExists = await fs.access(doc.filePath).then(() => true).catch(() => false);

        if (fileExists) {
          // Read file content
          const fileContent = await fs.readFile(doc.filePath);

          // Update document with file content
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              fileContent: fileContent,
              filePath: null // Clear filePath since we're storing in DB now
            }
          });

          console.log(`✅ Migrated document: ${doc.title} (${doc.id})`);
          migrated++;
        } else {
          console.log(`⚠️  File not found for document: ${doc.title} (${doc.id}) - skipping`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Error migrating document ${doc.id}:`, error);
        failed++;
      }
    }

    console.log(`\n📊 Migration complete:`);
    console.log(`✅ Successfully migrated: ${migrated} documents`);
    console.log(`❌ Failed to migrate: ${failed} documents`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingFiles();