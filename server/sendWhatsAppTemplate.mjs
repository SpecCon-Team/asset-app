import 'dotenv/config';

const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

console.log('📱 Sending WhatsApp Template Message\n');
console.log('━'.repeat(50));
console.log(`Phone Number ID: ${phoneNumberId}`);
console.log(`API Version: ${apiVersion}`);
console.log(`Access Token: ${accessToken.substring(0, 20)}...`);
console.log('━'.repeat(50));

const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

const payload = {
  messaging_product: "whatsapp",
  to: "27639477702", // Recipient phone number
  type: "template",
  template: {
    name: "hello_world",
    language: {
      code: "en_US"
    }
  }
};

console.log('\n📤 Sending request to:', url);
console.log('📦 Payload:', JSON.stringify(payload, null, 2));
console.log('\n⏳ Waiting for response...\n');

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  console.log('━'.repeat(50));
  console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
  console.log('━'.repeat(50));

  if (response.ok) {
    console.log('✅ SUCCESS! Message sent successfully!\n');
    console.log('📋 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n✉️  Message ID:', data.messages?.[0]?.id);
    console.log('📱 To:', data.contacts?.[0]?.wa_id);
  } else {
    console.log('❌ FAILED! Error sending message!\n');
    console.log('🔴 Error Details:');
    console.log(JSON.stringify(data, null, 2));

    if (data.error) {
      console.log('\n💡 Error Summary:');
      console.log(`   Code: ${data.error.code}`);
      console.log(`   Message: ${data.error.message}`);
      console.log(`   Type: ${data.error.type}`);

      // Provide helpful suggestions
      if (data.error.code === 190) {
        console.log('\n⚠️  Access token issue - token may be expired or invalid');
      } else if (data.error.code === 131009) {
        console.log('\n⚠️  Template not found - make sure "hello_world" template exists');
      } else if (data.error.code === 131021) {
        console.log('\n⚠️  Recipient phone number not registered for testing');
      }
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('✅ Test Complete\n');

} catch (error) {
  console.log('❌ Network Error:', error.message);
  console.log('\nFull error:', error);
}
