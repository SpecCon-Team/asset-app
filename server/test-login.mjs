import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testing login for: opiwej@specco.co.za\n');
    
    const user = await prisma.user.findUnique({
      where: { email: 'opiwej@specco.co.za' }
    });

    if (!user) {
      console.log('❌ User not found in database!');
      return;
    }

    console.log('✅ User found in database:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Email Verified:', user.emailVerified);
    console.log('   Login Attempts:', user.loginAttempts);
    console.log('   Locked Until:', user.lockoutUntil);
    console.log('   Password Hash:', user.password.substring(0, 20) + '...');
    console.log('');

    // Test password
    const testPassword = 'Admin@123456';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('🔑 Password Test:');
    console.log('   Testing password:', testPassword);
    console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      console.log('\n⚠️  Password does not match! Resetting now...');
      const newHash = await bcrypt.hash(testPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: newHash,
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
      console.log('✅ Password reset complete!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
