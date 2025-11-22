import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePhone() {
  try {
    console.log('📱 Updating Kagiso\'s phone number...\n');

    // Find Kagiso
    const user = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!user) {
      console.log('❌ User admin@example.com not found');
      return;
    }

    console.log(`Found: ${user.name} (${user.email})`);
    console.log(`Current phone: ${user.phone || 'Not set'}`);

    // Update phone number
    const updated = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: { phone: '+27639477702' }
    });

    console.log(`\n✅ Updated phone to: ${updated.phone}`);
    console.log('\n━'.repeat(60));
    console.log('✅ Success! You can now send WhatsApp messages from +27639477702');
    console.log('\nNext steps:');
    console.log('1. Make sure webhook is configured in Meta');
    console.log('2. Send "Hi" to your WhatsApp Business bot');
    console.log('3. Check server logs for webhook activity');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updatePhone();
