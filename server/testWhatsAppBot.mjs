#!/usr/bin/env node

/**
 * WhatsApp Bot Test Script
 *
 * This script tests the WhatsApp bot's ability to:
 * 1. Send text messages
 * 2. Display the interactive menu
 * 3. Verify API connectivity
 */

import https from 'https';
import { config } from 'dotenv';

// Load environment variables
config();

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

// Test phone number (replace with actual recipient number)
const TEST_PHONE = process.argv[2] || '+27712919486';

console.log('🤖 WhatsApp Bot Test Script');
console.log('=' .repeat(50));
console.log(`📱 Phone Number ID: ${PHONE_NUMBER_ID}`);
console.log(`🔑 Access Token: ${ACCESS_TOKEN ? ACCESS_TOKEN.substring(0, 20) + '...' : 'NOT SET'}`);
console.log(`📞 Test Recipient: ${TEST_PHONE}`);
console.log('=' .repeat(50));
console.log('');

if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
  console.error('❌ Error: WhatsApp credentials not configured in .env file');
  process.exit(1);
}

/**
 * Format phone number (remove + and spaces)
 */
function formatPhoneNumber(phone) {
  return phone.replace(/[\s+()-]/g, '');
}

/**
 * Send a WhatsApp text message
 */
function sendWhatsAppMessage(phoneNumber, messageText) {
  return new Promise((resolve, reject) => {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText
      }
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Main menu message
 */
function getMainMenuMessage(name = 'User') {
  return `👋 *Welcome ${name}!*

How can I help you today?

*Please reply with a number:*

1️⃣ Create a Support Ticket
2️⃣ Check My Tickets Status
3️⃣ General Enquiry
4️⃣ Report an Issue
5️⃣ Contact Support Team

Type the number of your choice (1-5)`;
}

/**
 * Run the test
 */
async function runTest() {
  try {
    console.log('📤 Sending test message to WhatsApp...\n');

    // Send the main menu
    const menuMessage = getMainMenuMessage('Test User');
    const result = await sendWhatsAppMessage(TEST_PHONE, menuMessage);

    console.log('✅ Message sent successfully!');
    console.log('');
    console.log('📋 Response from WhatsApp API:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    console.log('=' .repeat(50));
    console.log('✅ TEST PASSED!');
    console.log('');
    console.log('📱 Next Steps:');
    console.log('1. Check your WhatsApp on: ' + TEST_PHONE);
    console.log('2. You should receive the interactive menu');
    console.log('3. Reply with a number (1-5) to test the bot');
    console.log('4. The bot should respond based on your choice');
    console.log('');
    console.log('⚠️  Note: Make sure the webhook is configured in Meta');
    console.log('   to receive replies from users.');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Test failed!');
    console.error('');
    console.error('Error details:');
    console.error(error.message);
    console.error('');

    if (error.message.includes('403')) {
      console.error('🔒 Permission Issue:');
      console.error('   - Check if the access token is valid');
      console.error('   - Verify the token has proper permissions');
      console.error('   - Ensure the phone number is verified');
    } else if (error.message.includes('404')) {
      console.error('📞 Phone Number Issue:');
      console.error('   - Check if WHATSAPP_PHONE_NUMBER_ID is correct');
      console.error('   - Verify the number is active in Meta Business');
    } else if (error.message.includes('400')) {
      console.error('📝 Request Issue:');
      console.error('   - Check the phone number format: +27712919486');
      console.error('   - Ensure the recipient number is valid');
    }

    console.error('');
    console.error('=' .repeat(50));
    process.exit(1);
  }
}

// Run the test
runTest();
