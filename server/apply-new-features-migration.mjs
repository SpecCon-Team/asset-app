import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Applying new features migration...\n');

  try {
    // Create AssetReservation table
    console.log('📝 Creating AssetReservation table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AssetReservation" (
        "id" TEXT NOT NULL,
        "assetId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "reservationStart" TIMESTAMP(3) NOT NULL,
        "reservationEnd" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "purpose" TEXT,
        "notes" TEXT,
        "approvedById" TEXT,
        "approvedAt" TIMESTAMP(3),
        "rejectedReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "AssetReservation_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ AssetReservation table created\n');

    // Create EmailNotificationLog table
    console.log('📝 Creating EmailNotificationLog table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailNotificationLog" (
        "id" TEXT NOT NULL,
        "recipient" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "entityType" TEXT,
        "entityId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'sent',
        "error" TEXT,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "EmailNotificationLog_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ EmailNotificationLog table created\n');

    // Create ExportImportHistory table
    console.log('📝 Creating ExportImportHistory table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExportImportHistory" (
        "id" TEXT NOT NULL,
        "operation" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "format" TEXT NOT NULL,
        "recordCount" INTEGER NOT NULL DEFAULT 0,
        "fileName" TEXT NOT NULL,
        "filePath" TEXT,
        "userId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'completed',
        "error" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "ExportImportHistory_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ ExportImportHistory table created\n');

    // Create ApiRateLimit table
    console.log('📝 Creating ApiRateLimit table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ApiRateLimit" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "endpoint" TEXT NOT NULL,
        "requestCount" INTEGER NOT NULL DEFAULT 0,
        "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "windowEnd" TIMESTAMP(3) NOT NULL,
        "isBlocked" BOOLEAN NOT NULL DEFAULT false,

        CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ ApiRateLimit table created\n');

    // Create KeyboardShortcut table
    console.log('📝 Creating KeyboardShortcut table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "KeyboardShortcut" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "keys" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "KeyboardShortcut_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ KeyboardShortcut table created\n');

    // Create indexes for AssetReservation
    console.log('📝 Creating indexes for AssetReservation...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AssetReservation_assetId_idx" ON "AssetReservation"("assetId");
      CREATE INDEX IF NOT EXISTS "AssetReservation_userId_idx" ON "AssetReservation"("userId");
      CREATE INDEX IF NOT EXISTS "AssetReservation_status_idx" ON "AssetReservation"("status");
      CREATE INDEX IF NOT EXISTS "AssetReservation_reservationStart_idx" ON "AssetReservation"("reservationStart");
      CREATE INDEX IF NOT EXISTS "AssetReservation_reservationEnd_idx" ON "AssetReservation"("reservationEnd");
    `);

    // Create indexes for EmailNotificationLog
    console.log('📝 Creating indexes for EmailNotificationLog...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EmailNotificationLog_recipient_idx" ON "EmailNotificationLog"("recipient");
      CREATE INDEX IF NOT EXISTS "EmailNotificationLog_type_idx" ON "EmailNotificationLog"("type");
      CREATE INDEX IF NOT EXISTS "EmailNotificationLog_status_idx" ON "EmailNotificationLog"("status");
      CREATE INDEX IF NOT EXISTS "EmailNotificationLog_sentAt_idx" ON "EmailNotificationLog"("sentAt");
    `);

    // Create indexes for ExportImportHistory
    console.log('📝 Creating indexes for ExportImportHistory...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ExportImportHistory_userId_idx" ON "ExportImportHistory"("userId");
      CREATE INDEX IF NOT EXISTS "ExportImportHistory_operation_idx" ON "ExportImportHistory"("operation");
      CREATE INDEX IF NOT EXISTS "ExportImportHistory_entityType_idx" ON "ExportImportHistory"("entityType");
      CREATE INDEX IF NOT EXISTS "ExportImportHistory_createdAt_idx" ON "ExportImportHistory"("createdAt");
    `);

    // Create indexes for ApiRateLimit
    console.log('📝 Creating indexes for ApiRateLimit...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ApiRateLimit_userId_endpoint_windowStart_key" ON "ApiRateLimit"("userId", "endpoint", "windowStart");
      CREATE INDEX IF NOT EXISTS "ApiRateLimit_userId_idx" ON "ApiRateLimit"("userId");
      CREATE INDEX IF NOT EXISTS "ApiRateLimit_windowStart_idx" ON "ApiRateLimit"("windowStart");
    `);

    // Create indexes for KeyboardShortcut
    console.log('📝 Creating indexes for KeyboardShortcut...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "KeyboardShortcut_userId_action_key" ON "KeyboardShortcut"("userId", "action");
      CREATE INDEX IF NOT EXISTS "KeyboardShortcut_userId_idx" ON "KeyboardShortcut"("userId");
    `);

    // Add foreign key constraints
    console.log('📝 Adding foreign key constraints...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'AssetReservation_assetId_fkey'
        ) THEN
          ALTER TABLE "AssetReservation"
          ADD CONSTRAINT "AssetReservation_assetId_fkey"
          FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'AssetReservation_userId_fkey'
        ) THEN
          ALTER TABLE "AssetReservation"
          ADD CONSTRAINT "AssetReservation_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'AssetReservation_approvedById_fkey'
        ) THEN
          ALTER TABLE "AssetReservation"
          ADD CONSTRAINT "AssetReservation_approvedById_fkey"
          FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('✅ Foreign key constraints added\n');

    console.log('✨ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ 5 new tables created');
    console.log('   ✅ Indexes created for performance');
    console.log('   ✅ Foreign key constraints added');
    console.log('\n🎉 All new features are now ready to use!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
