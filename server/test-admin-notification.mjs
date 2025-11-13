import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminNotifications() {
  try {
    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('\n=== Admin User ===');
    console.log(`Email: ${admin.email}`);
    console.log(`ID: ${admin.id}`);
    console.log(`Role: ${admin.role}`);

    // Create a test notification for admin
    console.log('\n=== Creating Test Notification for Admin ===');
    const notification = await prisma.notification.create({
      data: {
        type: 'ticket_status',
        title: 'New ticket created',
        message: 'Test User created a new ticket: "Test Ticket for Admin Notification"',
        userId: admin.id,
      },
    });

    console.log('✅ Test notification created:', notification);

    // Check all notifications for admin
    const notifications = await prisma.notification.findMany({
      where: { userId: admin.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log(`\n=== Notifications for ${admin.email} ===`);
    console.log(`Total: ${notifications.length}`);
    notifications.forEach((n, index) => {
      console.log(`${index + 1}. [${n.read ? 'READ' : 'UNREAD'}] ${n.title}`);
      console.log(`   ${n.message}`);
      console.log(`   Created: ${n.createdAt.toLocaleString()}`);
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    console.log(`\n📬 Unread count: ${unreadCount}`);

    console.log('\n✅ Test completed! Login as admin@example.com to see the notification.');
    console.log('💡 The bell icon should show a badge with the unread count.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminNotifications();
