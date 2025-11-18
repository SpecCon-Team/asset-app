import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user (12+ character password)
    const adminPassword = await bcrypt.hash('admin123456789', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: adminPassword,
        role: 'ADMIN',
        name: 'Admin User',
      },
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Created/Updated admin:', { id: admin.id, email: admin.email, role: admin.role });

    // Create regular test user (12+ character password)
    const userPassword = await bcrypt.hash('password123456', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        password: userPassword,
        role: 'USER',
        name: 'Test User',
      },
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: userPassword,
        role: 'USER',
      },
    });

    console.log('✅ Created/Updated user:', { id: user.id, email: user.email, role: user.role });

    // Create technician user (12+ character password)
    const techPassword = await bcrypt.hash('tech123456789', 10);
    const technician = await prisma.user.upsert({
      where: { email: 'tech@example.com' },
      update: {
        password: techPassword,
        role: 'TECHNICIAN',
        name: 'Technician User',
        isAvailable: true,
      },
      create: {
        email: 'tech@example.com',
        name: 'Technician User',
        password: techPassword,
        role: 'TECHNICIAN',
        isAvailable: true,
      },
    });

    console.log('✅ Created/Updated technician:', { id: technician.id, email: technician.email, role: technician.role });
    console.log('\n=== Demo Credentials (Updated with 12+ character passwords) ===');
    console.log('Admin: admin@example.com / admin123456789');
    console.log('Technician: tech@example.com / tech123456789');
    console.log('User: test@example.com / password123456');
    console.log('\n⚠️  IMPORTANT: Passwords now meet the 12-character minimum requirement!');
    console.log('You can now login and change passwords in General Settings.');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
