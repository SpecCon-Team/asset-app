import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Email: admin@example.com');
      console.log('Password: password123');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'System Admin',
        password: hashedPassword,
        role: 'ADMIN',
        isAvailable: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 'P2002') {
      console.log('Admin user already exists!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
