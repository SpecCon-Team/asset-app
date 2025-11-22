import 'dotenv/config';
import axios from 'axios';

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

const phoneNumber = '27639477702';

async function sendTemplateMessage() {
  try {
    console.log('Sending template message...');
    console.log('Phone Number ID:', PHONE_NUMBER_ID);
    console.log('To:', phoneNumber);

    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US'
        }
      }
    };

    console.log('\nPayload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('\n✅ Template message sent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n📱 Check WhatsApp on +27639477702!');

  } catch (error) {
    console.error('\n❌ Failed to send message:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

sendTemplateMessage();
