import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markWhatsAppUsers() {
  try {
    console.log('🔍 Finding and marking WhatsApp users...\n');

    // Find users with temp WhatsApp emails
    const whatsappUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'whatsapp_'
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isWhatsAppUser: true
      }
    });

    console.log(`Found ${whatsappUsers.length} users with WhatsApp emails\n`);

    if (whatsappUsers.length === 0) {
      console.log('✅ No WhatsApp users to update');
      return;
    }

    // Update them to be marked as WhatsApp users
    const result = await prisma.user.updateMany({
      where: {
        email: {
          contains: 'whatsapp_'
        }
      },
      data: {
        isWhatsAppUser: true,
        whatsAppNotifications: true
      }
    });

    console.log(`✅ Updated ${result.count} users to WhatsApp users\n`);

    // Show the updated users
    const updated = await prisma.user.findMany({
      where: {
        isWhatsAppUser: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isWhatsAppUser: true,
        whatsAppNotifications: true
      }
    });

    console.log('📱 WhatsApp Users:');
    updated.forEach(user => {
      console.log(`  ✓ ${user.name} (${user.phone})`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Notifications: ${user.whatsAppNotifications ? 'Enabled' : 'Disabled'}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

markWhatsAppUsers();
