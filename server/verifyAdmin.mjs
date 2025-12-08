import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    console.log('Connecting to database...');
    
    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (!admin) {
      console.log('❌ Admin user not found. Creating...');
      
      // Create admin user
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'System Admin',
          password: hashedPassword,
          role: 'ADMIN',
          isAvailable: true,
          emailVerified: true, // Set as verified
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
      
      console.log('✅ Admin user created and verified!');
      console.log('Email:', newAdmin.email);
      console.log('Password: password123');
      
    } else {
      console.log('✅ Admin user found:', admin.email);
      console.log('Email verified:', admin.emailVerified);
      console.log('Login attempts:', admin.loginAttempts);
      console.log('Locked until:', admin.lockoutUntil);
      
      if (!admin.emailVerified || admin.loginAttempts > 0 || admin.lockoutUntil) {
        console.log('🔧 Fixing admin account...');
        
        await prisma.user.update({
          where: { id: admin.id },
          data: {
            emailVerified: true,
            verificationOTP: null,
            verificationExpiry: null,
            loginAttempts: 0,
            lockoutUntil: null
          }
        });
        
        console.log('✅ Admin account fixed!');
      }
    }
    
    // Test login
    console.log('\n🧪 Testing login...');
    const testAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (testAdmin && testAdmin.emailVerified) {
      console.log('✅ Admin is ready for login!');
      console.log('Email: admin@example.com');
      console.log('Password: password123');
    } else {
      console.log('❌ Admin setup failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();