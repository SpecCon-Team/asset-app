import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAccounts() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        loginAttempts: true,
        lockoutUntil: true
      }
    });

    console.log('📋 Available Test Accounts:\n');
    users.forEach(user => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.name || 'N/A');
      console.log('🔑 Role:', user.role);
      console.log('✉️  Verified:', user.emailVerified ? '✓ Yes' : '✗ No');
      console.log('🔒 Login Attempts:', user.loginAttempts);
      console.log('⏰ Locked Until:', user.lockoutUntil || 'Not locked');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Password Info:');
    console.log('   Default password for seeded accounts: password123456');
    console.log('   (Minimum 12 characters required)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAccounts();
