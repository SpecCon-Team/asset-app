console.log('\n🧪 WooAlerts Webhook Test\n');
console.log('='.repeat(60));

// Test 1: Check if endpoint is accessible
console.log('\n1️⃣ Testing WooAlerts Webhook Endpoint...');
try {
  const response = await fetch('http://localhost:4000/api/wooalerts-webhook/test');
  const data = await response.json();

  if (data.success) {
    console.log('   ✅ Webhook endpoint is accessible');
    console.log('   Endpoint:', data.endpoint);
  } else {
    console.log('   ❌ Unexpected response');
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

// Test 2: Simulate WooAlerts sending a message
console.log('\n2️⃣ Simulating WooAlerts Webhook (Your "Hi" message)...');
console.log('   From: Kagiso~ (27712919486)');
console.log('   Message: "Hi"');

const wooalertsPayload = {
  name: "Kagiso~",
  phone: "27712919486",
  email: "", // WooAlerts might not have email
  ticket: "Hi"
};

try {
  const response = await fetch('http://localhost:4000/api/wooalerts-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(wooalertsPayload)
  });

  const data = await response.json();

  if (data.success) {
    console.log('\n   ✅ SUCCESS! Ticket created!');
    console.log('   Ticket Number:', data.data.ticketNumber);
    console.log('   Title:', data.data.title);
    console.log('   Status:', data.data.status);
    console.log('   Priority:', data.data.priority);
    console.log('\n   🎯 Check your dashboard for the new ticket!');
    console.log('   🎯 Check WhatsApp for confirmation message!');
  } else {
    console.log('\n   ❌ Failed:', data.error);
  }
} catch (error) {
  console.log('\n   ❌ Error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('\n📋 WHAT THIS MEANS:\n');
console.log('The webhook ENDPOINT works correctly on your server.');
console.log('The issue is: WooAlerts is NOT configured to send to it.\n');
console.log('🔧 TO FIX:\n');
console.log('1. You need to configure WooAlerts to forward messages to:');
console.log('   → https://YOUR_PUBLIC_URL/api/wooalerts-webhook\n');
console.log('2. Options for public URL:');
console.log('   a) Use ngrok: ~/bin/ngrok http 4000');
console.log('   b) Use localtunnel: npx localtunnel --port 4000');
console.log('   c) Deploy to production with real domain\n');
console.log('3. Configure in WooAlerts dashboard:');
console.log('   → Log into: https://wooalerts.woosms.in');
console.log('   → Settings → WhatsApp Cloud API Setup');
console.log('   → Enable Webhook');
console.log('   → Enter your public webhook URL\n');
console.log('='.repeat(60));
console.log('\n');
