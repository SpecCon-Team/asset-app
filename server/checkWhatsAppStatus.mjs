import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWhatsAppStatus() {
  try {
    const whatsappUsers = await prisma.user.findMany({
      where: { isWhatsAppUser: true },
      select: {
        name: true,
        phone: true,
        isAvailable: true,
        email: true
      }
    });

    console.log('WhatsApp Users Status:\n');
    whatsappUsers.forEach(u => {
      console.log(`Name: ${u.name}`);
      console.log(`Phone: ${u.phone}`);
      console.log(`Status: ${u.isAvailable ? '🟢 Online' : '🔴 Offline'}`);
      console.log(`Email: ${u.email}\n`);
    });

    console.log('\n💡 Note: WhatsApp users are set to "Online" by default when created.');
    console.log('They remain online unless manually changed in the system.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWhatsAppStatus();
