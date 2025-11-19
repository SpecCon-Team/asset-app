import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateNotifications() {
  try {
    console.log('🧹 Starting cleanup of duplicate notifications...\n');

    // Find all notifications grouped by userId, title, and message
    const allNotifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Total notifications in database: ${allNotifications.length}`);

    // Group notifications by unique key (userId + title + message + ticketId)
    const grouped = new Map();

    for (const notification of allNotifications) {
      const key = `${notification.userId}_${notification.title}_${notification.message}_${notification.ticketId}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(notification);
    }

    // Find duplicates and keep only the first one
    let duplicateCount = 0;
    let deletedCount = 0;

    for (const [key, notifications] of grouped.entries()) {
      if (notifications.length > 1) {
        duplicateCount++;
        console.log(`\n🔍 Found ${notifications.length} duplicates for: "${notifications[0].title}"`);

        // Keep the first (oldest) notification, delete the rest
        const toDelete = notifications.slice(1);

        for (const notification of toDelete) {
          await prisma.notification.delete({
            where: { id: notification.id }
          });
          deletedCount++;
        }

        console.log(`   ✅ Kept 1, deleted ${toDelete.length} duplicates`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Cleanup Summary:');
    console.log(`   Total notifications before: ${allNotifications.length}`);
    console.log(`   Duplicate groups found: ${duplicateCount}`);
    console.log(`   Notifications deleted: ${deletedCount}`);
    console.log(`   Notifications remaining: ${allNotifications.length - deletedCount}`);
    console.log('='.repeat(50));

    if (deletedCount > 0) {
      console.log('\n✅ Cleanup completed successfully!');
    } else {
      console.log('\n✅ No duplicates found - database is clean!');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateNotifications();
