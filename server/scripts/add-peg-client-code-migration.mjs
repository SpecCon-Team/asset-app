import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensurePegClientCodeColumn() {
  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected!\n');

    // Check if PEGClient table exists
    console.log('📝 Checking if PEGClient table exists...');
    const tableCheck = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'PEGClient'
    `);

    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      console.log('⚠️  PEGClient table does not exist. This should be created by prisma migrate deploy.');
      console.log('⚠️  If you see this message, ensure prisma migrate deploy runs successfully.\n');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ PEGClient table exists!\n');

    // Check if clientCode column exists
    console.log('📝 Checking if clientCode column exists...');
    const columnCheck = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'PEGClient' 
      AND column_name = 'clientCode'
    `);

    if (Array.isArray(columnCheck) && columnCheck.length > 0) {
      console.log('✅ Column clientCode already exists! Skipping migration.\n');
      await prisma.$disconnect();
      return;
    }

    // Add clientCode column
    console.log('📝 Adding clientCode column to PEGClient table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PEGClient" 
      ADD COLUMN IF NOT EXISTS "clientCode" TEXT
    `);
    console.log('✅ Column added!\n');

    // Add unique constraint if it doesn't exist
    console.log('📝 Adding unique constraint on clientCode...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "PEGClient" 
        ADD CONSTRAINT "PEGClient_clientCode_key" UNIQUE ("clientCode")
      `);
      console.log('✅ Unique constraint added!\n');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Unique constraint already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Add index if it doesn't exist
    console.log('📝 Creating index on clientCode...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PEGClient_clientCode_idx" 
        ON "PEGClient"("clientCode")
      `);
      console.log('✅ Index created!\n');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Generate client codes for existing clients that don't have one
    console.log('📝 Generating client codes for existing clients...');
    try {
      const result = await prisma.$executeRawUnsafe(`
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
      console.log('✅ Client codes generated for existing clients!\n');
    } catch (error) {
      console.log('⚠️  Could not generate client codes (this is okay if there are no existing clients):', error.message);
    }

    console.log('✅ Migration completed successfully!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

ensurePegClientCodeColumn()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

