import { prisma } from './prisma';
import { ensureUploadedAtColumn } from './ensureUploadedAtColumn';

/**
 * Runs all custom migrations on startup
 * These are idempotent and safe to run multiple times
 */
export async function runStartupMigrations(): Promise<void> {
  console.log('🔄 Running startup migrations...\n');

  const migrations = [
    {
      name: 'uploadedAt column',
      fn: ensureUploadedAtColumn
    },
    // Add other migrations here if needed
    // They should all be idempotent (safe to run multiple times)
  ];

  for (const migration of migrations) {
    try {
      console.log(`📝 Running migration: ${migration.name}...`);
      await migration.fn();
      console.log(`✅ Migration completed: ${migration.name}\n`);
    } catch (error: any) {
      console.error(`⚠️  Migration failed (non-fatal): ${migration.name}`, error.message);
      // Continue with other migrations even if one fails
    }
  }

  console.log('✅ All startup migrations completed\n');
}

