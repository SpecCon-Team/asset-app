import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Connect to production database using NEON_DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

async function createProductionAdmin() {
  try {
    // Check if we have a database URL
    const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ Error: NEON_DATABASE_URL or DATABASE_URL must be set');
      console.log('\n💡 To use this script, run:');
      console.log('   node create-production-admin.mjs');
      console.log('\n   Make sure your .env file has NEON_DATABASE_URL set to your production database');
      process.exit(1);
    }

    // Mask the database URL for security (show only last 10 characters)
    const maskedUrl = '***' + dbUrl.slice(-10);
    console.log('🔗 Connecting to production database:', maskedUrl);
    console.log('');

    console.log('🔍 Checking for admin user: admin@example.com');
    
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingUser) {
      console.log('✅ Admin user already exists in production!');
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
      console.log('❌ Admin user not found in production. Creating new admin...');
      
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
      
      console.log('\n✅ Admin user created successfully in production!');
      console.log('Email:', newAdmin.email);
      console.log('Password:', password);
      console.log('Role:', newAdmin.role);
    }
    
    console.log('\n🎉 You can now login to your production app with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin@123456');
    console.log('\n   Login at: https://speccon-team.github.io/asset-app/#/login');
    console.log('\n⚠️  Remember to change your password after first login!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Make sure:');
    console.log('   1. Your NEON_DATABASE_URL is correctly set in .env');
    console.log('   2. The database URL is accessible from this machine');
    console.log('   3. You have run "npx prisma generate" to generate the Prisma client');
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();
