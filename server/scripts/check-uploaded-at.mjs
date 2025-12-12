import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });
dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

async function checkUploadedAt() {
  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected!\n');

    // Check if column exists
    console.log('📝 Checking if uploadedAt column exists...');
    const checkResult = await prisma.$queryRawUnsafe(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        table_name
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'Document' 
      AND column_name = 'uploadedAt'
    `);

    if (Array.isArray(checkResult) && checkResult.length > 0) {
      console.log('✅ Column uploadedAt EXISTS!');
      console.log('Details:', checkResult[0]);
      
      // Check if index exists
      const indexCheck = await prisma.$queryRawUnsafe(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'Document' 
        AND indexname = 'Document_uploadedAt_idx'
      `);
      
      if (Array.isArray(indexCheck) && indexCheck.length > 0) {
        console.log('✅ Index Document_uploadedAt_idx EXISTS!');
      } else {
        console.log('⚠️  Index Document_uploadedAt_idx does NOT exist');
      }
      
      // Count documents
      const docCount = await prisma.document.count();
      console.log(`\n📊 Total documents in database: ${docCount}`);
      
    } else {
      console.log('❌ Column uploadedAt does NOT exist!');
      console.log('\n💡 Run the migration script:');
      console.log('   node scripts/add-uploaded-at-migration.mjs');
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUploadedAt();

