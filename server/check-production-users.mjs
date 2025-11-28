import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Connect to production database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

async function checkProductionUsers() {
  try {
    const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ Error: NEON_DATABASE_URL or DATABASE_URL must be set');
      process.exit(1);
    }

    console.log('🔍 Checking production users...\n');

    const emails = ['admin@example.com', 'test@example.com', 'tech@example.com'];
    const expectedPasswords = {
      'admin@example.com': 'Admin@123456',
      'test@example.com': 'User@123456',
      'tech@example.com': 'Tech@123456'
    };

    for (const email of emails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        console.log(`✅ ${email} - EXISTS`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
        console.log(`   Login Attempts: ${user.loginAttempts}`);
        console.log(`   Locked: ${user.lockoutUntil && user.lockoutUntil > new Date() ? '❌ Yes' : '✅ No'}`);
        
        // Test password
        const expectedPassword = expectedPasswords[email];
        const passwordMatch = await bcrypt.compare(expectedPassword, user.password);
        console.log(`   Password Match: ${passwordMatch ? '✅ Yes' : '❌ No'}`);
        console.log(`   Expected Password: ${expectedPassword}`);
        console.log('');
      } else {
        console.log(`❌ ${email} - NOT FOUND`);
        console.log(`   Expected Password: ${expectedPasswords[email]}`);
        console.log('');
      }
    }

    console.log('\n💡 To create/update these accounts, run:');
    console.log('   node create-production-admin.mjs');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionUsers();

