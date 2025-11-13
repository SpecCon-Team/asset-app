import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotifications() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });

    console.log('\n=== Available Users ===');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
    });

    // Find test user
    const testUser = users.find(u => u.email === 'test@example.com');
    if (!testUser) {
      console.log('\n❌ Test user not found!');
      return;
    }

    console.log('\n=== Creating Test Notification ===');
    const notification = await prisma.notification.create({
      data: {
        type: 'comment',
        title: 'Test Notification',
        message: 'This is a test notification! If you can see this, the system works! 🎉',
        userId: testUser.id,
      },
    });

    console.log('✅ Test notification created:', notification);

    // Check notifications for test user
    const notifications = await prisma.notification.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\n=== Notifications for ${testUser.email} ===`);
    console.log(`Total: ${notifications.length}`);
    notifications.forEach(n => {
      console.log(`- [${n.read ? 'READ' : 'UNREAD'}] ${n.title}: ${n.message}`);
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    console.log(`\n📬 Unread count: ${unreadCount}`);

    console.log('\n✅ Test completed! Login as test@example.com to see the notification.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();
