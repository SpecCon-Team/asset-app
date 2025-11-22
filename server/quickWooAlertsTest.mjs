import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

console.log('\n🧪 Quick WooAlerts Webhook Test\n');

// Test: Look up user by phone
const testPhone = '27712919486';
const cleanPhone = testPhone.replace(/[\s+()-]/g, '').slice(-10);

console.log('Looking for user with phone ending in:', cleanPhone);

try {
  const user = await prisma.user.findFirst({
    where: {
      phone: {
        contains: cleanPhone
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true
    }
  });

  if (user) {
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Phone:', user.phone);
    console.log('   Role:', user.role);
    console.log('\n✅ WooAlerts webhook WILL work for this phone number!');
  } else {
    console.log('❌ No user found with phone ending in:', cleanPhone);
    console.log('\n💡 The webhook will try to CREATE a new user.');
    console.log('   But this might fail if email validation is strict.');
  }

  // Check if there's a user with exactly this phone
  const exactUser = await prisma.user.findFirst({
    where: {
      phone: testPhone
    }
  });

  if (exactUser) {
    console.log('\n✅ Found exact match:', exactUser.name);
  }

} catch (error) {
  console.error('❌ Database error:', error.message);
}

await prisma.$disconnect();

console.log('\n📋 SUMMARY:');
console.log('If user exists → Webhook will create ticket');
console.log('If user missing → Webhook will try to create user + ticket');
console.log('\n🔧 MAIN ISSUE: WooAlerts is not sending webhooks to your server');
console.log('Solution: Configure webhook URL in WooAlerts dashboard\n');
