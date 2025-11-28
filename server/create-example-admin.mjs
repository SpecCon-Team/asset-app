import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createExampleAdmin() {
  try {
    console.log('🔍 Checking for admin user: admin@example.com');
    
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingUser) {
      console.log('✅ Admin user already exists!');
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.name);
      console.log('Role:', existingUser.role);
      console.log('Email Verified:', existingUser.emailVerified);
      
      // Reset password to default
      const newPassword = 'Admin@123456';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          emailVerified: true,
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
      
      console.log('\n🔑 Password reset to:', newPassword);
      console.log('✅ Email verified and login attempts reset');
      
    } else {
      console.log('❌ Admin user not found. Creating new admin...');
      
      const password = 'Admin@123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'Example Admin',
          role: 'ADMIN',
          emailVerified: true,
          loginAttempts: 0
        }
      });
      
      console.log('\n✅ Admin user created successfully!');
      console.log('Email:', newAdmin.email);
      console.log('Password:', password);
      console.log('Role:', newAdmin.role);
    }
    
    console.log('\n🎉 You can now login with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin@123456');
    console.log('\n⚠️  Remember to change your password after first login!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createExampleAdmin();
