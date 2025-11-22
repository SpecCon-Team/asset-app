import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying Security Enhancement Tables...\n');

  try {
    // Check each new table
    const tables = [
      { name: 'RefreshToken', model: prisma.refreshToken },
      { name: 'UserSession', model: prisma.userSession },
      { name: 'WebhookLog', model: prisma.webhookLog },
      { name: 'SecurityEvent', model: prisma.securityEvent }
    ];

    let allGood = true;

    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(`✅ ${table.name}: Table exists (${count} records)`);
      } catch (error) {
        console.log(`❌ ${table.name}: NOT found`);
        allGood = false;
      }
    }

    // Check if User table has passwordHistory field
    console.log('\n🔍 Checking User table fields...');
    const user = await prisma.user.findFirst();
    if (user) {
      console.log(`✅ User table has passwordHistory field: ${user.passwordHistory !== undefined}`);
    } else {
      console.log('⚠️  No users in database to check fields');
    }

    if (allGood) {
      console.log('\n✨ All security tables created successfully!\n');
      console.log('📋 Next steps:');
      console.log('1. Add new environment variables (WHATSAPP_APP_SECRET, etc.)');
      console.log('2. Implement JWT refresh tokens in auth routes');
      console.log('3. Add webhook signature verification');
      console.log('4. Update file upload security');
      console.log('\nSee: SECURITY_ENHANCEMENTS_IMPLEMENTATION_GUIDE.md\n');
    } else {
      console.log('\n⚠️  Some tables are missing. Re-run the migration.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
