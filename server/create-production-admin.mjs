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
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists in production!');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      console.log('Email Verified:', existingAdmin.emailVerified);
      
      // Reset password to default
      const newPassword = 'Admin@123456';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: existingAdmin.id },
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
    
    // Create/Update User account
    console.log('\n🔍 Checking for user: test@example.com');
    const existingRegularUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (existingRegularUser) {
      const userPassword = 'User@123456';
      const hashedUserPassword = await bcrypt.hash(userPassword, 10);
      await prisma.user.update({
        where: { id: existingRegularUser.id },
        data: {
          password: hashedUserPassword,
          emailVerified: true,
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
      console.log('✅ User account updated!');
    } else {
      const userPassword = 'User@123456';
      const hashedUserPassword = await bcrypt.hash(userPassword, 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedUserPassword,
          name: 'Test User',
          role: 'USER',
          emailVerified: true,
          loginAttempts: 0
        }
      });
      console.log('✅ User account created!');
    }

    // Create/Update Technician account
    console.log('\n🔍 Checking for technician: tech@example.com');
    const existingTech = await prisma.user.findUnique({
      where: { email: 'tech@example.com' }
    });

    if (existingTech) {
      const techPassword = 'Tech@123456';
      const hashedTechPassword = await bcrypt.hash(techPassword, 10);
      await prisma.user.update({
        where: { id: existingTech.id },
        data: {
          password: hashedTechPassword,
          emailVerified: true,
          loginAttempts: 0,
          lockoutUntil: null,
          isAvailable: true
        }
      });
      console.log('✅ Technician account updated!');
    } else {
      const techPassword = 'Tech@123456';
      const hashedTechPassword = await bcrypt.hash(techPassword, 10);
      await prisma.user.create({
        data: {
          email: 'tech@example.com',
          password: hashedTechPassword,
          name: 'Technician User',
          role: 'TECHNICIAN',
          emailVerified: true,
          loginAttempts: 0,
          isAvailable: true
        }
      });
      console.log('✅ Technician account created!');
    }
    
    console.log('\n🎉 Production Accounts Ready!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Admin:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin@123456');
    console.log('\n👤 User:');
    console.log('   Email: test@example.com');
    console.log('   Password: User@123456');
    console.log('\n🔧 Technician:');
    console.log('   Email: tech@example.com');
    console.log('   Password: Tech@123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n   Login at: https://speccon-team.github.io/asset-app/#/login');
    console.log('\n⚠️  Remember to change passwords after first login!');
    
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
