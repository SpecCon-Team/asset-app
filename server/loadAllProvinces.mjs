import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Province information
const provinces = [
  { id: 'WC', name: 'Western Cape', color: '#FF9800' },
  { id: 'EC', name: 'Eastern Cape', color: '#8D6E63' },
  { id: 'NC', name: 'Northern Cape', color: '#42A5F5' },
  { id: 'FS', name: 'Free State', color: '#FFC107' },
  { id: 'KZN', name: 'KwaZulu-Natal', color: '#616161' },
  { id: 'NW', name: 'North West', color: '#9E9E9E' },
  { id: 'GP', name: 'Gauteng', color: '#64B5F6' },
  { id: 'MP', name: 'Mpumalanga', color: '#3F51B5' },
  { id: 'LP', name: 'Limpopo', color: '#8BC34A' },
];

async function loadAllProvinces() {
  console.log('🗺️  Loading Sample PEG Clients for All Provinces\n');
  console.log('=' .repeat(60));

  try {
    // Get a user to assign clients to
    const user = await prisma.user.findFirst({
      where: {
        role: 'ADMIN' // Or any role you prefer
      }
    });

    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      console.log('   You can run: node seedUser.mjs');
      return;
    }

    console.log(`\n✅ Using user: ${user.email} (${user.name || 'No name'})\n`);

    // Load sample data from JSON file
    const sampleDataPath = path.join(__dirname, '../client/public/sample-peg-data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));

    console.log(`📦 Found ${sampleData.length} sample clients\n`);

    // Count clients per province
    const provinceCount = {};
    provinces.forEach(p => provinceCount[p.id] = 0);

    // Clear existing data for this user (optional)
    const deleteResult = await prisma.pEGClient.deleteMany({
      where: { userId: user.id }
    });
    console.log(`🗑️  Cleared ${deleteResult.count} existing clients\n`);

    // Insert all sample clients
    console.log('📝 Adding clients to database...\n');

    for (const client of sampleData) {
      const created = await prisma.pEGClient.create({
        data: {
          name: client.name,
          location: client.location,
          contactPerson: client.contactPerson || null,
          phone: client.phone || null,
          email: client.email || null,
          provinceId: client.provinceId,
          userId: user.id,
        },
      });

      provinceCount[client.provinceId]++;

      const province = provinces.find(p => p.id === client.provinceId);
      console.log(`   ✓ Added: ${client.name} → ${province.name}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary by Province:\n');

    let totalClients = 0;
    provinces.forEach(province => {
      const count = provinceCount[province.id];
      totalClients += count;
      const bar = '█'.repeat(count);
      console.log(`   ${province.id} - ${province.name.padEnd(20)} ${bar} (${count} clients)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Successfully loaded ${totalClients} clients across all ${provinces.length} provinces!`);
    console.log('\n💡 You can now:');
    console.log('   1. Open the application');
    console.log('   2. Navigate to "My PEG" page');
    console.log('   3. Click on any province to see the clients');
    console.log('   4. Or click "Load Sample Data" button in the UI');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

loadAllProvinces();
