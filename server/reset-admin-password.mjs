import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const newPassword = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const admin = await prisma.user.update({
      where: { email: 'opiwej@specco.co.za' },
      data: {
        password: hashedPassword,
        emailVerified: true,
        loginAttempts: 0,
        lockoutUntil: null
      }
    });

    console.log('✅ Admin password reset successfully!');
    console.log('');
    console.log('Email:', admin.email);
    console.log('New Password:', newPassword);
    console.log('');
    console.log('🔑 You can now login with these credentials:');
    console.log('   Email: opiwej@specco.co.za');
    console.log('   Password:', newPassword);
    console.log('');
    console.log('⚠️  Remember to change your password after first login!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
