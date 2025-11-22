import dotenv from 'dotenv';
dotenv.config();

console.log('\n🧪 WhatsApp Bot End-to-End Test\n');
console.log('='.repeat(60));

// Test 1: Configuration
console.log('\n1️⃣ Configuration Check');
console.log('   Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing');
console.log('   Access Token:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
console.log('   Verify Token:', process.env.WHATSAPP_VERIFY_TOKEN);

// Test 2: Webhook endpoint
console.log('\n2️⃣ Webhook Endpoint Test');
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
const testUrl = `http://localhost:4000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=TEST123`;

try {
  const response = await fetch(testUrl);
  const text = await response.text();

  if (text === 'TEST123') {
    console.log('   ✅ Webhook verification works correctly');
  } else {
    console.log('   ❌ Unexpected response:', text);
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

// Test 3: Simulate incoming message
console.log('\n3️⃣ Simulating Incoming WhatsApp Message');
console.log('   Simulating message from: 0606344230');
console.log('   Message: "Hi"');

const webhookPayload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: '123456789',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '27712919486',
          phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID
        },
        messages: [{
          from: '27606344230',
          id: 'wamid.test123',
          timestamp: Date.now(),
          type: 'text',
          text: {
            body: 'Hi'
          }
        }]
      },
      field: 'messages'
    }]
  }]
};

try {
  console.log('\n   Sending webhook payload to local server...');
  const response = await fetch('http://localhost:4000/api/whatsapp/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookPayload)
  });

  if (response.status === 200) {
    console.log('   ✅ Webhook accepted the message!');
    console.log('\n   📊 Check your server logs above to see:');
    console.log('      - Message processing');
    console.log('      - User lookup');
    console.log('      - Ticket creation');
    console.log('      - WhatsApp confirmation sent');
  } else {
    console.log('   ❌ Webhook returned status:', response.status);
  }
} catch (error) {
  console.log('   ❌ Error sending to webhook:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 What This Test Did:');
console.log('   1. Verified webhook configuration');
console.log('   2. Simulated Meta sending a WhatsApp message from your number');
console.log('   3. Triggered ticket creation and auto-response');
console.log('\n🎯 Next Step:');
console.log('   Check your app dashboard for a new ticket created by Jojo!');
console.log('   If you provided a real WhatsApp number in .env, check for a');
console.log('   confirmation message on your phone.\n');
