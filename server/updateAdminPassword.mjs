import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('🔧 Updating admin password...');
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (admin) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash('admin123456789', 10);
      
      // Update admin password
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
      
      console.log('✅ Admin password updated successfully!');
      console.log('Email: admin@example.com');
      console.log('New Password: admin123456789');
      console.log('Role: ADMIN');
      
      // Test the password
      const testVerify = await bcrypt.compare('admin123456789', hashedPassword);
      console.log('Password verification test:', testVerify ? '✅ PASSED' : '❌ FAILED');
      
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();