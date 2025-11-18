import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456789', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Created/Updated admin:', admin);

  // Create regular test user
  const userPassword = await bcrypt.hash('password123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: { password: userPassword },
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('Created/Updated user:', user);
  console.log('\n=== Demo Credentials (Updated with 12+ character passwords) ===');
  console.log('Admin: admin@example.com / admin123456789');
  console.log('User: test@example.com / password123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });