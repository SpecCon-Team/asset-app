import 'dotenv/config';

console.log('🧪 Testing WhatsApp Webhook Reception\n');
console.log('━'.repeat(60));

// Simulate a webhook payload from Meta WhatsApp
const testWebhookPayload = {
  object: "whatsapp_business_account",
  entry: [{
    id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
    changes: [{
      value: {
        messaging_product: "whatsapp",
        metadata: {
          display_phone_number: "27639477702",
          phone_number_id: "852483691285659"
        },
        contacts: [{
          profile: {
            name: "Test User"
          },
          wa_id: "27712919486"
        }],
        messages: [{
          from: "27712919486",
          id: "wamid.TEST123",
          timestamp: Date.now().toString(),
          text: {
            body: "My laptop is broken"
          },
          type: "text"
        }]
      },
      field: "messages"
    }]
  }]
};

console.log('📦 Test Payload:');
console.log(JSON.stringify(testWebhookPayload, null, 2));
console.log('\n' + '━'.repeat(60));
console.log('🚀 Sending to local webhook endpoint...\n');

try {
  const response = await fetch('http://localhost:4000/api/whatsapp/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testWebhookPayload)
  });

  console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

  if (response.ok) {
    console.log('✅ Webhook accepted the payload!');
    console.log('\n💡 Check your server logs for:');
    console.log('   - "📩 Received webhook"');
    console.log('   - "📱 Message from: 27712919486"');
    console.log('   - "✅ Created ticket"');
    console.log('   - "✅ Confirmation sent"');
  } else {
    const text = await response.text();
    console.log('❌ Webhook rejected the payload');
    console.log('Response:', text);
  }

} catch (error) {
  console.log('❌ Error sending to webhook:', error.message);
  console.log('\n⚠️  Make sure your server is running on port 4000');
}

console.log('\n' + '━'.repeat(60));
console.log('✅ Test Complete\n');
