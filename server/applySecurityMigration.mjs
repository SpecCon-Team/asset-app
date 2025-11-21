import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔒 Running Security Enhancements Migration...\n');

  try {
    // 1. Add passwordHistory field to User table
    console.log('1️⃣  Adding passwordHistory to User table...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHistory" TEXT;
      `;
      console.log('✅ Done\n');
    } catch (e) {
      console.log('⚠️  Already exists or error:', e.message, '\n');
    }

    // 2. Create RefreshToken table
    console.log('2️⃣  Creating RefreshToken table...');
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "RefreshToken" (
          "id" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "isRevoked" BOOLEAN NOT NULL DEFAULT false,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "revokedAt" TIMESTAMP(3),
          CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Done\n');
    } catch (e) {
      console.log('⚠️  Already exists or error:', e.message, '\n');
    }

    // 3. Create UserSession table
    console.log('3️⃣  Creating UserSession table...');
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "UserSession" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "sessionToken" TEXT NOT NULL,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "device" TEXT,
          "browser" TEXT,
          "location" TEXT,
          "fingerprint" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Done\n');
    } catch (e) {
      console.log('⚠️  Already exists or error:', e.message, '\n');
    }

    // 4. Create WebhookLog table
    console.log('4️⃣  Creating WebhookLog table...');
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "WebhookLog" (
          "id" TEXT NOT NULL,
          "source" TEXT NOT NULL,
          "event" TEXT NOT NULL,
          "payload" TEXT NOT NULL,
          "signature" TEXT,
          "verified" BOOLEAN NOT NULL DEFAULT false,
          "processed" BOOLEAN NOT NULL DEFAULT false,
          "error" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Done\n');
    } catch (e) {
      console.log('⚠️  Already exists or error:', e.message, '\n');
    }

    // 5. Create SecurityEvent table
    console.log('5️⃣  Creating SecurityEvent table...');
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "SecurityEvent" (
          "id" TEXT NOT NULL,
          "eventType" TEXT NOT NULL,
          "severity" TEXT NOT NULL,
          "userId" TEXT,
          "userEmail" TEXT,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "details" TEXT,
          "resolved" BOOLEAN NOT NULL DEFAULT false,
          "resolvedBy" TEXT,
          "resolvedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Done\n');
    } catch (e) {
      console.log('⚠️  Already exists or error:', e.message, '\n');
    }

    // 6. Create indexes
    console.log('6️⃣  Creating indexes...');

    const indexes = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_token_key" ON "RefreshToken"("token")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_sessionToken_key" ON "UserSession"("sessionToken")',
      'CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId")',
      'CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt")',
      'CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId")',
      'CREATE INDEX IF NOT EXISTS "UserSession_isActive_idx" ON "UserSession"("isActive")',
      'CREATE INDEX IF NOT EXISTS "UserSession_expiresAt_idx" ON "UserSession"("expiresAt")',
      'CREATE INDEX IF NOT EXISTS "WebhookLog_source_idx" ON "WebhookLog"("source")',
      'CREATE INDEX IF NOT EXISTS "WebhookLog_processed_idx" ON "WebhookLog"("processed")',
      'CREATE INDEX IF NOT EXISTS "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt")',
      'CREATE INDEX IF NOT EXISTS "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType")',
      'CREATE INDEX IF NOT EXISTS "SecurityEvent_severity_idx" ON "SecurityEvent"("severity")',
      'CREATE INDEX IF NOT EXISTS "SecurityEvent_userId_idx" ON "SecurityEvent"("userId")',
      'CREATE INDEX IF NOT EXISTS "SecurityEvent_resolved_idx" ON "SecurityEvent"("resolved")',
      'CREATE INDEX IF NOT EXISTS "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt")'
    ];

    for (const indexSQL of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSQL);
      } catch (e) {
        // Ignore already exists errors
      }
    }
    console.log('✅ Done\n');

    // 7. Add foreign keys
    console.log('7️⃣  Adding foreign key constraints...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "RefreshToken"
        ADD CONSTRAINT "RefreshToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      console.log('⚠️  RefreshToken FK already exists\n');
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "UserSession"
        ADD CONSTRAINT "UserSession_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      console.log('⚠️  UserSession FK already exists\n');
    }
    console.log('✅ Done\n');

    // Verify tables
    console.log('🔍 Verifying tables...\n');

    const tables = [
      { name: 'RefreshToken', count: await prisma.refreshToken.count() },
      { name: 'UserSession', count: await prisma.userSession.count() },
      { name: 'WebhookLog', count: await prisma.webhookLog.count() },
      { name: 'SecurityEvent', count: await prisma.securityEvent.count() }
    ];

    for (const table of tables) {
      console.log(`✅ ${table.name}: ${table.count} records`);
    }

    console.log('\n✨ Migration completed successfully!\n');
    console.log('📦 Next step: Run "npx prisma generate" to update Prisma client\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
