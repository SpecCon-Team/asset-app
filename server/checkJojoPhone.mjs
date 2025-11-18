import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const user = await prisma.user.findFirst({
  where: { name: 'Jojo' },
  select: { id: true, name: true, email: true, phone: true }
});

console.log('\n📱 Your WhatsApp Account Check\n');
console.log('Your user account:');
console.log(`  Name: ${user.name}`);
console.log(`  Email: ${user.email}`);
console.log(`  Phone: ${user.phone}`);

const yourPhone = '0606344230';
const cleanPhone = yourPhone.replace(/[\s+()-]/g, '').slice(-10);
console.log('\n🔍 Phone Number Matching:');
console.log(`  Your phone: ${yourPhone}`);
console.log(`  Last 10 digits webhook searches for: ${cleanPhone}`);
console.log(`  Stored in database: ${user.phone}`);

const dbClean = (user.phone || '').replace(/[\s+()-]/g, '');
if (dbClean.includes(cleanPhone)) {
  console.log('  ✅ MATCH! The webhook will find your account');
} else {
  console.log('  ⚠️  NO MATCH! Update your phone number to include these digits: ' + cleanPhone);
}

console.log('\n📋 Next Steps:');
console.log('1. Set up public URL (ngrok or localtunnel)');
console.log('2. Configure webhook in Meta dashboard');
console.log('3. Send "Hi" to your WhatsApp business number');
console.log('4. Watch the magic happen! ✨\n');

await prisma.$disconnect();
