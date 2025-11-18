#!/usr/bin/env node

/**
 * Simulate WhatsApp Webhook Message
 * This simulates what Meta would send to your webhook when someone messages you
 */

import http from 'http';

const webhookUrl = 'http://localhost:4000/api/whatsapp/webhook';
const testPhoneNumber = '27712919486'; // Your phone number

// This is the payload Meta sends when someone sends "Hello"
const webhookPayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1554902325693975',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '27639477702',
              phone_number_id: '852483691285659'
            },
            contacts: [
              {
                profile: {
                  name: 'Test User'
                },
                wa_id: testPhoneNumber
              }
            ],
            messages: [
              {
                from: testPhoneNumber,
                id: 'wamid.test123456',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: {
                  body: 'Hello'
                },
                type: 'text'
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
};

console.log('🧪 Simulating WhatsApp Webhook Message');
console.log('=' .repeat(50));
console.log('📱 From: ' + testPhoneNumber);
console.log('💬 Message: "Hello"');
console.log('🌐 Webhook URL: ' + webhookUrl);
console.log('=' .repeat(50));
console.log('');

// Use fetch or http to POST to the webhook
const data = JSON.stringify(webhookPayload);

const url = new URL(webhookUrl);
const options = {
  hostname: url.hostname,
  port: url.port,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('✅ Webhook Response Status:', res.statusCode);
    if (responseData) {
      console.log('📄 Response:', responseData);
    }
    console.log('');
    console.log('=' .repeat(50));
    console.log('✅ Simulation Complete!');
    console.log('');
    console.log('📊 What should happen:');
    console.log('1. Server logs should show: "📩 Received webhook"');
    console.log('2. Bot should send menu to: ' + testPhoneNumber);
    console.log('3. Check your WhatsApp for the menu message');
    console.log('=' .repeat(50));
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('');
  console.log('⚠️  Make sure the server is running on port 4000');
});

req.write(data);
req.end();
