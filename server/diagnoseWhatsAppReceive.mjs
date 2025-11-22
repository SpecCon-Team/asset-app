import 'dotenv/config';

console.log('🔍 WhatsApp Receive Diagnostics\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n📋 Configuration Check:');
console.log('✓ WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Not set');
console.log('✓ WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? `✅ Set (${process.env.WHATSAPP_ACCESS_TOKEN.substring(0, 20)}...)` : '❌ Not set');
console.log('✓ WHATSAPP_VERIFY_TOKEN:', process.env.WHATSAPP_VERIFY_TOKEN ? '✅ Set' : '❌ Not set');
console.log('✓ CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:5174');

console.log('\n📡 Webhook Configuration:');
console.log('Server should be running on: http://localhost:4000');
console.log('Webhook endpoint (local): http://localhost:4000/api/whatsapp/webhook');
console.log('\n⚠️  IMPORTANT: Meta WhatsApp cannot reach localhost!');
console.log('You need to expose your webhook using one of these:');
console.log('  1. ngrok: https://ngrok.com');
console.log('  2. localtunnel: https://localtunnel.github.io');
console.log('  3. Deploy to a public server');

console.log('\n🔧 Steps to Fix:');
console.log('1. First, update your expired access token:');
console.log('   - Go to: https://developers.facebook.com/apps');
console.log('   - Select your app → WhatsApp → API Setup');
console.log('   - Copy the new access token');
console.log('   - Update WHATSAPP_ACCESS_TOKEN in server/.env');

console.log('\n2. Expose your webhook using ngrok or localtunnel:');
console.log('   Option A - ngrok:');
console.log('     ngrok http 4000');
console.log('     Copy the https URL (e.g., https://abc123.ngrok.io)');
console.log('   ');
console.log('   Option B - localtunnel:');
console.log('     npx localtunnel --port 4000');
console.log('     Copy the URL provided');

console.log('\n3. Configure the webhook in Meta:');
console.log('   - Go to: https://developers.facebook.com/apps');
console.log('   - WhatsApp → Configuration');
console.log('   - Webhook → Edit');
console.log('   - Callback URL: [YOUR_NGROK_URL]/api/whatsapp/webhook');
console.log('   - Verify Token:', process.env.WHATSAPP_VERIFY_TOKEN || 'asset_app_webhook_verify_2024');
console.log('   - Subscribe to: messages');

console.log('\n4. Test the connection:');
console.log('   - Send "My laptop is broken" to your WhatsApp Business number');
console.log('   - Watch the server logs for webhook calls');

console.log('\n📊 Testing Access Token:');
console.log('Testing if your access token is valid...\n');

const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

if (!phoneNumberId || !accessToken) {
  console.log('❌ Missing credentials. Cannot test.');
  process.exit(1);
}

try {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Access token is VALID!');
    console.log('Phone number details:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ Access token is INVALID or EXPIRED!');
    console.log('Error:', JSON.stringify(data, null, 2));
    console.log('\n⚠️  You MUST get a new access token from Meta Developer Console');
  }
} catch (error) {
  console.log('❌ Failed to test access token:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('🔍 Diagnostics Complete\n');
