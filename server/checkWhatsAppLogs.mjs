import 'dotenv/config';

console.log('🔍 Checking WhatsApp Message Sending\n');
console.log('='.repeat(60));

// Test if we can send a message right now
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

console.log('\n1️⃣ Testing Access Token and Phone Number');
console.log('─'.repeat(60));

try {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Access token is valid');
    console.log('📱 Phone:', data.display_phone_number);
    console.log('🏢 Account:', data.verified_name);
    console.log('📊 Quality:', data.quality_rating);
  } else {
    console.log('❌ Access token error:', data.error.message);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Failed to check token:', error.message);
  process.exit(1);
}

console.log('\n2️⃣ Testing Message Sending to Test Number');
console.log('─'.repeat(60));

// Try sending a test message
const testPhone = '27712919486'; // Kagiso's phone

console.log('Attempting to send message to:', testPhone);

try {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: testPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: '🧪 Test message from diagnostic script. If you see this, WhatsApp sending is working!'
        }
      })
    }
  );

  const data = await response.json();

  console.log('\n📊 Response Status:', response.status);
  console.log('📋 Response:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('\n✅ SUCCESS! Message sent!');
    console.log('📱 Message ID:', data.messages[0].id);
    console.log('📞 To:', data.contacts[0].wa_id);
    console.log('\n💡 Check phone +27 71 291 9486 for the message!');
  } else {
    console.log('\n❌ FAILED to send message!');
    console.log('🔴 Error:', data.error.message);
    console.log('🔴 Code:', data.error.code);

    if (data.error.code === 131047) {
      console.log('\n⚠️  ERROR 131047: Re-engagement message required');
      console.log('📌 This means: The recipient must message YOU first!');
      console.log('📌 Solution: Have +27 71 291 9486 send a message to +27 63 947 7702');
      console.log('📌 Then you have 24 hours to reply with any message');
    } else if (data.error.code === 131026) {
      console.log('\n⚠️  ERROR 131026: Message undeliverable');
      console.log('📌 The phone number may not be on WhatsApp');
      console.log('📌 Or the number is not verified for testing');
    } else if (data.error.code === 100) {
      console.log('\n⚠️  ERROR 100: Invalid parameter');
      console.log('📌 Check phone number format');
      console.log('📌 Number should be: 27712919486 (no + or spaces)');
    }
  }
} catch (error) {
  console.log('❌ Network error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🏁 Diagnostic Complete\n');
