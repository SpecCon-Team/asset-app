import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

console.log('\n🧪 Direct WooAlerts Flow Test\n');

try {
  const testData = {
    name: "Kagiso~",
    phone: "27712919486",
    email: "",
    ticket: "Hi"
  };

  console.log('1️⃣ Looking for existing user...');
  const cleanPhone = testData.phone.replace(/[\s+()-]/g, '').slice(-10);
  console.log('   Searching for phone ending in:', cleanPhone);

  let user = await prisma.user.findFirst({
    where: {
      phone: {
        contains: cleanPhone
      }
    }
  });

  if (user) {
    console.log('   ✅ Found:', user.name, `(${user.email})`);
  } else {
    console.log('   ❌ User not found');
    console.log('\n2️⃣ Creating new user...');

    const userName = testData.name || 'WhatsApp User';
    const userEmail = testData.email || `whatsapp_${Date.now()}@temp.local`;
    const randomPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        name: userName,
        email: userEmail,
        phone: testData.phone,
        role: 'USER',
        emailVerified: !testData.email,
        password: hashedPassword
      }
    });

    console.log('   ✅ Created user:', user.name, `(${user.email})`);
  }

  console.log('\n3️⃣ Creating ticket...');
  const ticketCount = await prisma.ticket.count();
  const ticketNumber = `TKT-${String(ticketCount + 1).padStart(5, '0')}`;

  const ticket = await prisma.ticket.create({
    data: {
      number: ticketNumber,
      title: testData.ticket,
      description: testData.ticket,
      priority: 'medium',
      status: 'open',
      createdById: user.id
    }
  });

  console.log('   ✅ Created ticket:', ticket.number);
  console.log('   Title:', ticket.title);
  console.log('   Status:', ticket.status);

  console.log('\n✅ SUCCESS! The webhook logic works!');
  console.log('\n📋 Check your dashboard - you should see:');
  console.log(`   - New user: ${user.name}`);
  console.log(`   - New ticket: ${ticket.number}`);

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('   Full error:', error);
} finally {
  await prisma.$disconnect();
}
