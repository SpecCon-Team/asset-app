import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPegClientIdColumn() {
  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected!\n');

    // Check if column already exists
    console.log('📝 Checking if pegClientId column exists...');
    const checkResult = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Asset' 
      AND column_name = 'pegClientId'
    `);

    if (Array.isArray(checkResult) && checkResult.length > 0) {
      console.log('✅ Column pegClientId already exists! Skipping migration.\n');
      await prisma.$disconnect();
      return;
    }

    // Add pegClientId column
    console.log('📝 Adding pegClientId column to Asset table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Asset" 
      ADD COLUMN IF NOT EXISTS "pegClientId" TEXT
    `);
    console.log('✅ Column added!\n');

    // Add foreign key constraint
    console.log('📝 Adding foreign key constraint...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Asset" 
        ADD CONSTRAINT "Asset_pegClientId_fkey" 
        FOREIGN KEY ("pegClientId") 
        REFERENCES "PEGClient"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key constraint added!\n');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Foreign key constraint already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Add index
    console.log('📝 Creating index on pegClientId...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Asset_pegClientId_idx" 
        ON "Asset"("pegClientId")
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

addPegClientIdColumn()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

