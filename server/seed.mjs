import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
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

    // Create regular test user
    const userPassword = await bcrypt.hash('password123', 10);
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
    console.log('\n=== Demo Credentials ===');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: test@example.com / password123');
    console.log('\nYou can now login with these credentials!');
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
