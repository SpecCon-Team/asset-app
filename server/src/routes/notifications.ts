import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const createNotificationSchema = z.object({
  type: z.string(),
  title: z.string(),
  message: z.string(),
  userId: z.string(),
  senderId: z.string().optional().nullable(),
  ticketId: z.string().optional().nullable(),
  assetId: z.string().optional().nullable(),
});

// Get all notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.params.userId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.params.userId,
        read: false,
      },
    });
    res.json({ count });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Create a notification
router.post('/', async (req, res) => {
  const parsed = createNotificationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const notification = await prisma.notification.create({
      data: parsed.data,
    });
    res.json(notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(notification);
  } catch (error) {
    console.error('Failed to update notification:', error);
    res.status(404).json({ message: 'Notification not found' });
  }
});

// Mark all notifications as read for a user
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.params.userId,
        read: false,
      },
      data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(404).json({ message: 'Notification not found' });
  }
});

// Delete all read notifications for a user
router.delete('/user/:userId/read', async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId: req.params.userId,
        read: true,
      },
    });
    res.json({ message: 'Read notifications deleted successfully' });
  } catch (error) {
    console.error('Failed to delete read notifications:', error);
    res.status(500).json({ message: 'Failed to delete read notifications' });
  }
});

// Speed test notification endpoint
router.post('/speed-test', async (req, res) => {
  const schema = z.object({
    downloadSpeed: z.number(),
    uploadSpeed: z.number(),
    latency: z.number(),
    technicianEmail: z.string(),
    technicianId: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const { downloadSpeed, uploadSpeed, latency, technicianEmail, technicianId } = parsed.data;

    // Get technician details
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { name: true, email: true },
    });

    // Get all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    // Determine connection quality
    let quality = 'Good';
    if (latency > 100 || downloadSpeed < 10 || uploadSpeed < 5) {
      quality = 'Poor';
    } else if (latency > 50 || downloadSpeed < 25 || uploadSpeed < 10) {
      quality = 'Fair';
    } else if (downloadSpeed > 100 && uploadSpeed > 50 && latency < 30) {
      quality = 'Excellent';
    }

    // Create notification for each admin
    const notificationPromises = admins.map((admin) =>
      prisma.notification.create({
        data: {
          type: 'system',
          title: `Network Speed Test - ${quality}`,
          message: `${technician?.name || technicianEmail} completed a speed test:\n\n🔽 Download: ${downloadSpeed} Mbps\n🔼 Upload: ${uploadSpeed} Mbps\n⏱️ Ping: ${latency} ms\n\nConnection Quality: ${quality}\nTest completed at ${new Date().toLocaleString()}`,
          userId: admin.id,
          senderId: technicianId,
        },
      })
    );

    await Promise.all(notificationPromises);

    res.json({
      message: 'Speed test results sent to all admins',
      count: admins.length,
      quality,
    });
  } catch (error) {
    console.error('Failed to send speed test notification:', error);
    res.status(500).json({ message: 'Failed to send speed test notification' });
  }
});

// TEST ENDPOINT: Create a test notification
router.post('/test/:userId', async (req, res) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: 'comment',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system works!',
        userId: req.params.userId,
      },
    });
    res.json({ message: 'Test notification created', notification });
  } catch (error) {
    console.error('Failed to create test notification:', error);
    res.status(500).json({ message: 'Failed to create test notification' });
  }
});

export default router;
