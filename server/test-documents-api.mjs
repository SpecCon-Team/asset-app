import 'dotenv/config';
import fetch from 'node-fetch';

async function testDocumentsAPI() {
  try {
    console.log('🧪 Testing Documents API on Production\n');

    // First, we need to authenticate to get a token
    console.log('🔐 Attempting to login...');

    const loginResponse = await fetch('https://assettrack-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Production admin email
        password: 'Admin@123456' // Production admin password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.log('Error details:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.accessToken;

    if (!token) {
      console.log('❌ No token received from login');
      console.log('Login response:', loginData);
      return;
    }

    console.log('✅ Login successful, got token\n');

    // Now test the documents endpoint
    console.log('📄 Testing documents endpoint...');

    const docsResponse = await fetch('https://assettrack-api.onrender.com/api/documents?page=1&limit=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', docsResponse.status);

    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      console.log('✅ Documents API working!');
      console.log('📊 Response data:');
      console.log('   Total documents:', docsData.pagination?.total || 'N/A');
      console.log('   Documents returned:', docsData.documents?.length || 0);
      console.log('   Sample document:', docsData.documents?.[0] ? {
        id: docsData.documents[0].id,
        title: docsData.documents[0].title,
        status: docsData.documents[0].status
      } : 'No documents');
    } else {
      console.log('❌ Documents API failed:', docsResponse.status, docsResponse.statusText);
      const errorText = await docsResponse.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDocumentsAPI();