import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('📋 Checking users in database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });

    console.log(`Found ${users.length} users:\n`);

    users.forEach(user => {
      console.log(`👤 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone || 'Not set'}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });

    // Check if phone numbers need formatting
    console.log('━'.repeat(60));
    console.log('📱 Phone Number Analysis:\n');

    const usersWithPhone = users.filter(u => u.phone);
    console.log(`Users with phone numbers: ${usersWithPhone.length}/${users.length}`);

    if (usersWithPhone.length > 0) {
      console.log('\nPhone formats:');
      usersWithPhone.forEach(u => {
        const clean = u.phone.replace(/[\s+()-]/g, '').slice(-10);
        console.log(`${u.name}: ${u.phone} → Last 10 digits: ${clean}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
