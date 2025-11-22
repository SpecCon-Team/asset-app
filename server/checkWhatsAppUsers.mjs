import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWhatsAppUsers() {
  try {
    console.log('🔍 Checking all users in database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isWhatsAppUser: true,
        whatsAppNotifications: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total users: ${users.length}\n`);

    const whatsappUsers = users.filter(u => u.isWhatsAppUser);
    const regularUsers = users.filter(u => !u.isWhatsAppUser);

    console.log(`WhatsApp users: ${whatsappUsers.length}`);
    console.log(`Regular users: ${regularUsers.length}\n`);

    console.log('=== ALL USERS ===\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone || 'No phone'}`);
      console.log(`   isWhatsAppUser: ${user.isWhatsAppUser}`);
      console.log(`   whatsAppNotifications: ${user.whatsAppNotifications}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    if (whatsappUsers.length > 0) {
      console.log('\n=== WHATSAPP USERS ONLY ===\n');
      whatsappUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Phone: ${user.phone}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWhatsAppUsers();
