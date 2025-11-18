console.log('\n🧪 Final WooAlerts Webhook Test\n');

const payload = {
  name: "Test User",
  phone: "27606344230", // Jojo's number - exists in database
  email: "",
  ticket: "Test message from webhook"
};

console.log('Testing with Jojo\'s phone number (should exist)');
console.log('Payload:', JSON.stringify(payload, null, 2));

try {
  const response = await fetch('http://localhost:4000/api/wooalerts-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  console.log('\nResponse status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  const text = await response.text();
  console.log('\nRaw response:', text);

  try {
    const data = JSON.parse(text);
    console.log('\nParsed response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS!');
      console.log('Ticket:', data.data.ticketNumber);
    } else {
      console.log('\n❌ Failed:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
    }
  } catch (e) {
    console.log('Could not parse JSON:', e.message);
  }

} catch (error) {
  console.log('\n❌ Request error:', error.message);
}

console.log('\n📋 Check your server logs (npm run dev terminal) for detailed error messages\n');
