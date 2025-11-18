import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔍 WhatsApp Bot Diagnostic Tool\n');
console.log('='.repeat(50));

// Check 1: Environment Variables
console.log('\n1️⃣ Checking Environment Variables...');
const requiredVars = [
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_VERIFY_TOKEN'
];

let envOk = true;
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.length < 10) {
    console.log(`   ❌ ${varName}: Missing or invalid`);
    envOk = false;
  } else {
    console.log(`   ✅ ${varName}: Configured (${value.substring(0, 15)}...)`);
  }
}

if (!envOk) {
  console.log('\n⚠️  Some environment variables are missing or invalid!');
}

// Check 2: Server Status
console.log('\n2️⃣ Checking Server Status...');
try {
  const response = await fetch('http://localhost:4000/health').catch(() => null);
  if (response) {
    console.log('   ✅ Server is running on port 4000');
  } else {
    console.log('   ❌ Server is not responding on port 4000');
    console.log('   💡 Make sure to run: npm run dev');
  }
} catch (error) {
  console.log('   ❌ Cannot check server status');
}

// Check 3: Webhook Endpoint
console.log('\n3️⃣ Checking Webhook Endpoint...');
try {
  const testUrl = 'http://localhost:4000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=' +
    process.env.WHATSAPP_VERIFY_TOKEN + '&hub.challenge=test123';

  const response = await fetch(testUrl);
  const text = await response.text();

  if (text === 'test123') {
    console.log('   ✅ Webhook verification endpoint working correctly');
  } else {
    console.log('   ❌ Webhook verification not working as expected');
    console.log('   Response:', text);
  }
} catch (error) {
  console.log('   ❌ Webhook endpoint error:', error.message);
}

// Check 4: Public Accessibility
console.log('\n4️⃣ Checking Public Accessibility...');
console.log('   ℹ️  Your server must be publicly accessible for WhatsApp to reach it');
console.log('   ℹ️  Options:');
console.log('      - Production: Use a domain with HTTPS');
console.log('      - Development: Use ngrok (see instructions below)');

// Check 5: Database Connection & Users
console.log('\n5️⃣ Checking Database & Users...');
try {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const usersWithPhone = await prisma.user.findMany({
    where: {
      phone: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  });

  if (usersWithPhone.length === 0) {
    console.log('   ⚠️  No users with phone numbers found!');
    console.log('   💡 The bot needs users with phone numbers to create tickets');
  } else {
    console.log(`   ✅ Found ${usersWithPhone.length} user(s) with phone numbers:`);
    usersWithPhone.forEach(user => {
      console.log(`      - ${user.name} (${user.phone})`);
    });
  }

  await prisma.$disconnect();
} catch (error) {
  console.log('   ❌ Database check failed:', error.message);
}

// Summary & Next Steps
console.log('\n' + '='.repeat(50));
console.log('\n📋 DIAGNOSIS SUMMARY\n');

if (!envOk) {
  console.log('❌ ISSUE: Environment variables not configured');
  console.log('   FIX: Check your server/.env file and add missing values');
}

console.log('\n📱 TO FIX WHATSAPP BOT NOT RESPONDING:\n');
console.log('Step 1: Expose your server publicly');
console.log('   Run this in a new terminal:');
console.log('   → npx localtunnel --port 4000');
console.log('   OR');
console.log('   → ~/bin/ngrok http 4000');
console.log('   Copy the HTTPS URL (e.g., https://abc123.ngrok.io)\n');

console.log('Step 2: Configure Meta Webhook');
console.log('   1. Go to: https://developers.facebook.com/apps');
console.log('   2. Select your WhatsApp app');
console.log('   3. Click WhatsApp → Configuration');
console.log('   4. In Webhooks section, click "Edit"');
console.log('   5. Enter:');
console.log('      - Callback URL: https://YOUR_PUBLIC_URL/api/whatsapp/webhook');
console.log(`      - Verify Token: ${process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token'}`);
console.log('   6. Click "Verify and Save"');
console.log('   7. Subscribe to "messages" field\n');

console.log('Step 3: Add your phone number to a user account');
console.log('   1. Log into your app as admin');
console.log('   2. Go to Users section');
console.log('   3. Edit your user profile');
console.log('   4. Add your phone number (e.g., +27712919486)');
console.log('   5. Save\n');

console.log('Step 4: Test the bot');
console.log('   Send a WhatsApp message to your business number');
console.log('   Watch the server logs for activity\n');

console.log('='.repeat(50));
console.log('\n✅ Diagnostic complete!\n');
