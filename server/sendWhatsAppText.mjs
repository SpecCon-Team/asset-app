import 'dotenv/config';

const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

// You can change the recipient and message here
const RECIPIENT = "27639477702"; // Change to your phone number
const MESSAGE = "Hello! This is a test message from your Asset Management System. 🚀";

console.log('📱 Sending WhatsApp Text Message\n');
console.log('━'.repeat(50));
console.log(`Phone Number ID: ${phoneNumberId}`);
console.log(`API Version: ${apiVersion}`);
console.log(`To: +${RECIPIENT}`);
console.log(`Message: ${MESSAGE}`);
console.log('━'.repeat(50));

const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

const payload = {
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: RECIPIENT,
  type: "text",
  text: {
    preview_url: false,
    body: MESSAGE
  }
};

console.log('\n📤 Sending request...\n');

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
    console.log('📱 To: +' + data.contacts?.[0]?.wa_id);
    console.log('\n💡 Check your WhatsApp to see the message!');
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
        console.log('\n⚠️  Access token expired or invalid');
      } else if (data.error.code === 131026) {
        console.log('\n⚠️  Message undeliverable - recipient may not be on WhatsApp');
      } else if (data.error.code === 131047) {
        console.log('\n⚠️  Re-engagement message - recipient needs to message you first');
        console.log('   Solution: Have the recipient send you a message first');
      } else if (data.error.code === 131021) {
        console.log('\n⚠️  Recipient not in allowed list');
        console.log('   Add the phone number in: WhatsApp → API Setup → To field');
      }
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('✅ Test Complete\n');

} catch (error) {
  console.log('❌ Network Error:', error.message);
  console.log('\nFull error:', error);
}
