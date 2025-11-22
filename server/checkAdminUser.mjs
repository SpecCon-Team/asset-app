import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('Checking for admin users...\n');

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        name: true,
      },
    });

    if (admins.length === 0) {
      console.log('❌ No ADMIN users found in the database!');
      console.log('\nAll users:');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          name: true,
        },
      });
      console.table(allUsers);
    } else {
      console.log(`✅ Found ${admins.length} ADMIN user(s):\n`);
      console.table(admins);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAdminUsers();
