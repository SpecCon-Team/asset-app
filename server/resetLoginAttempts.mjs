import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetLoginAttempts() {
  try {
    console.log('🔓 Resetting login attempts and unlocking accounts...\n');

    // Get all users with login attempts or lockouts
    const lockedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { loginAttempts: { gt: 0 } },
          { lockoutUntil: { not: null } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        loginAttempts: true,
        lockoutUntil: true
      }
    });

    if (lockedUsers.length === 0) {
      console.log('✅ No locked accounts found. All users are accessible.\n');
      await prisma.$disconnect();
      return;
    }

    console.log(`Found ${lockedUsers.length} user(s) with login restrictions:\n`);

    lockedUsers.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Login Attempts: ${user.loginAttempts}`);
      console.log(`   Locked Until: ${user.lockoutUntil || 'Not locked'}`);
      console.log('');
    });

    // Reset all login attempts and lockouts
    const result = await prisma.user.updateMany({
      where: {
        OR: [
          { loginAttempts: { gt: 0 } },
          { lockoutUntil: { not: null } }
        ]
      },
      data: {
        loginAttempts: 0,
        lockoutUntil: null
      }
    });

    console.log(`✅ Successfully reset ${result.count} user account(s)!\n`);
    console.log('🎯 All accounts are now unlocked and ready for login.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetLoginAttempts();
