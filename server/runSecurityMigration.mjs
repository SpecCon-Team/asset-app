import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔒 Running Security Enhancements Migration...\n');

  try {
    // Read the SQL migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'prisma/migrations/security_enhancements.sql'),
      'utf-8'
    );

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log('✅ Executed successfully');
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          console.log('⚠️  Already exists, skipping');
        } else {
          console.error('❌ Error:', error.message);
        }
      }
    }

    console.log('\n🎉 Migration completed!\n');

    // Verify tables exist
    console.log('🔍 Verifying new tables...\n');

    const tables = ['RefreshToken', 'UserSession', 'WebhookLog', 'SecurityEvent'];

    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) FROM "${table}" LIMIT 1;
        `);
        console.log(`✅ ${table} table exists`);
      } catch (error) {
        console.log(`❌ ${table} table NOT found`);
      }
    }

    console.log('\n✨ All done! Run "npx prisma generate" to update the Prisma client.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
