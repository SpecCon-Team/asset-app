import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('📱 Checking user phone numbers...\n');

const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true
  }
});

console.log(`Found ${users.length} users:\n`);

users.forEach(u => {
  console.log(`📧 ${u.email}`);
  console.log(`👤 ${u.name}`);
  console.log(`📱 Phone: ${u.phone || '❌ NOT SET'}`);
  console.log(`🔑 Role: ${u.role}`);
  console.log(`🆔 ID: ${u.id}`);
  console.log('━'.repeat(50));
});

await prisma.$disconnect();
