import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPEG() {
  console.log('🧪 Testing PEG Client Database...\n');

  try {
    // Get a test user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }

    console.log(`✅ Found user: ${user.email}\n`);

    // Create a test client
    console.log('Creating test PEG client...');
    const newClient = await prisma.pEGClient.create({
      data: {
        name: 'Test Company',
        location: 'Cape Town',
        contactPerson: 'John Doe',
        phone: '+27 21 123 4567',
        email: 'john@testcompany.com',
        provinceId: 'WC',
        userId: user.id,
      },
    });
    console.log('✅ Created:', newClient);
    console.log();

    // List all clients for this user
    console.log('Fetching all PEG clients...');
    const allClients = await prisma.pEGClient.findMany({
      where: { userId: user.id },
    });
    console.log(`✅ Found ${allClients.length} client(s):`, allClients);
    console.log();

    // Update the client
    console.log('Updating client...');
    const updatedClient = await prisma.pEGClient.update({
      where: { id: newClient.id },
      data: {
        contactPerson: 'Jane Smith',
        phone: '+27 21 987 6543',
      },
    });
    console.log('✅ Updated:', updatedClient);
    console.log();

    // Get clients by province
    console.log('Fetching clients for Western Cape...');
    const wcClients = await prisma.pEGClient.findMany({
      where: {
        userId: user.id,
        provinceId: 'WC',
      },
    });
    console.log(`✅ Found ${wcClients.length} client(s) in Western Cape`);
    console.log();

    // Delete the test client
    console.log('Cleaning up test data...');
    await prisma.pEGClient.delete({
      where: { id: newClient.id },
    });
    console.log('✅ Test client deleted');
    console.log();

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPEG();
