import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔍 FULL WHATSAPP DIAGNOSTIC\n');
console.log('='.repeat(70));

// 1. Check environment
console.log('\n1️⃣ ENVIRONMENT VARIABLES');
console.log('─'.repeat(70));
console.log('✓ WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅' : '❌');
console.log('✓ WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅' : '❌');
console.log('✓ WHATSAPP_VERIFY_TOKEN:', process.env.WHATSAPP_VERIFY_TOKEN ? '✅' : '❌');
console.log('✓ Business Phone:', process.env.WHATSAPP_PHONE_NUMBER_ID);

// 2. Check access token validity
console.log('\n2️⃣ ACCESS TOKEN VALIDITY');
console.log('─'.repeat(70));
try {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
    }
  );
  const data = await response.json();

  if (response.ok) {
    console.log('✅ Access token is VALID');
    console.log('📱 Phone:', data.display_phone_number);
    console.log('👤 Name:', data.verified_name);
  } else {
    console.log('❌ Access token is INVALID');
    console.log('Error:', data.error.message);
  }
} catch (error) {
  console.log('❌ Failed to check token:', error.message);
}

// 3. Check ngrok
console.log('\n3️⃣ NGROK TUNNEL');
console.log('─'.repeat(70));
try {
  const ngrokResponse = await fetch('http://localhost:4040/api/tunnels');
  const ngrokData = await ngrokResponse.json();
  const tunnel = ngrokData.tunnels[0];

  if (tunnel) {
    console.log('✅ ngrok is running');
    console.log('🌐 Public URL:', tunnel.public_url);
    console.log('📍 Webhook URL:', tunnel.public_url + '/api/whatsapp/webhook');
  } else {
    console.log('❌ No ngrok tunnels found');
  }
} catch (error) {
  console.log('❌ ngrok is not running');
}

// 4. Check server
console.log('\n4️⃣ SERVER STATUS');
console.log('─'.repeat(70));
try {
  const healthResponse = await fetch('http://localhost:4000/health');
  const healthData = await healthResponse.json();

  if (healthResponse.ok) {
    console.log('✅ Server is running on port 4000');
    console.log('⏱️  Uptime:', healthData.uptime);
    console.log('💾 Database:', healthData.database.connected ? 'Connected' : 'Disconnected');
  } else {
    console.log('❌ Server health check failed');
  }
} catch (error) {
  console.log('❌ Server is not responding on port 4000');
}

// 5. Check users with phone numbers
console.log('\n5️⃣ USERS WITH PHONE NUMBERS');
console.log('─'.repeat(70));
const users = await prisma.user.findMany({
  where: {
    phone: { not: null }
  },
  select: { name: true, phone: true, role: true }
});

if (users.length > 0) {
  console.log(`✅ Found ${users.length} users with phone numbers:`);
  users.forEach(u => {
    console.log(`   📱 ${u.phone} - ${u.name} (${u.role})`);
  });
} else {
  console.log('❌ No users with phone numbers found');
}

// 6. Check recent tickets
console.log('\n6️⃣ RECENT TICKETS');
console.log('─'.repeat(70));
const tickets = await prisma.ticket.findMany({
  orderBy: { createdAt: 'desc' },
  take: 3,
  include: {
    createdBy: { select: { name: true, phone: true } }
  }
});

if (tickets.length > 0) {
  console.log(`✅ Found ${tickets.length} recent tickets:`);
  tickets.forEach(t => {
    const timeAgo = Math.round((Date.now() - t.createdAt.getTime()) / 1000 / 60);
    console.log(`   🎫 ${t.number}: "${t.title}"`);
    console.log(`      By: ${t.createdBy.name} (${t.createdBy.phone || 'no phone'})`);
    console.log(`      ${timeAgo} minutes ago`);
  });
} else {
  console.log('ℹ️  No tickets found');
}

// 7. Check admin users
console.log('\n7️⃣ ADMIN & TECHNICIAN USERS');
console.log('─'.repeat(70));
const admins = await prisma.user.findMany({
  where: {
    role: { in: ['ADMIN', 'TECHNICIAN'] }
  },
  select: { name: true, email: true, role: true }
});

console.log(`✅ Found ${admins.length} admin/technician users:`);
admins.forEach(a => {
  console.log(`   👤 ${a.name} - ${a.email} (${a.role})`);
});

// 8. Check recent notifications
console.log('\n8️⃣ RECENT NOTIFICATIONS');
console.log('─'.repeat(70));
const notifications = await prisma.notification.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  include: {
    user: { select: { name: true, role: true } }
  }
});

if (notifications.length > 0) {
  console.log(`✅ Found ${notifications.length} recent notifications:`);
  notifications.forEach(n => {
    const timeAgo = Math.round((Date.now() - n.createdAt.getTime()) / 1000 / 60);
    console.log(`   🔔 To: ${n.user.name} (${n.user.role})`);
    console.log(`      ${n.message}`);
    console.log(`      ${timeAgo} minutes ago - ${n.read ? '✓ Read' : '✗ Unread'}`);
  });
} else {
  console.log('ℹ️  No notifications found');
}

// 9. Test webhook endpoint
console.log('\n9️⃣ WEBHOOK ENDPOINT TEST');
console.log('─'.repeat(70));
try {
  const webhookTest = await fetch('http://localhost:4000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=asset_app_webhook_verify_2024&hub.challenge=TEST123');
  const webhookResult = await webhookTest.text();

  if (webhookResult === 'TEST123') {
    console.log('✅ Webhook verification endpoint works');
  } else {
    console.log('❌ Webhook verification failed');
    console.log('Response:', webhookResult);
  }
} catch (error) {
  console.log('❌ Webhook endpoint test failed:', error.message);
}

console.log('\n' + '='.repeat(70));
console.log('📊 DIAGNOSIS COMPLETE\n');

// Summary
console.log('📝 SUMMARY & RECOMMENDATIONS:');
console.log('─'.repeat(70));

const issues = [];
const working = [];

if (!process.env.WHATSAPP_ACCESS_TOKEN) issues.push('Missing access token');
else working.push('Access token configured');

if (users.length === 0) issues.push('No users with phone numbers');
else working.push(`${users.length} users with phone numbers`);

if (admins.length === 0) issues.push('No admin/technician users');
else working.push(`${admins.length} admin/technician users`);

console.log('\n✅ Working:');
working.forEach(w => console.log(`   • ${w}`));

if (issues.length > 0) {
  console.log('\n⚠️  Issues:');
  issues.forEach(i => console.log(`   • ${i}`));
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Send a WhatsApp message from one of these numbers:');
users.forEach(u => console.log(`   📱 ${u.phone}`));
console.log(`2. TO this business number: +27 63 947 7702`);
console.log('3. Watch your server terminal for logs');
console.log('4. Check admin dashboard for notifications');

await prisma.$disconnect();
