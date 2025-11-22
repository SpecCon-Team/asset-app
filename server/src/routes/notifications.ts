import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

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
router.get('/user/:userId', authenticate, cacheMiddleware(15000), async (req: AuthRequest, res) => {
  try {
    // Users can only view their own notifications
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add pagination support (default limit 50 for better performance)
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const skip = (page - 1) * limit;

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
      take: limit === -1 ? undefined : limit,
      skip: limit === -1 ? undefined : skip,
    });

    // Optimized: Batch fetch all tickets and assets in 2 queries instead of N queries
    const ticketIds = notifications
      .filter((n) => n.ticketId)
      .map((n) => n.ticketId as string);

    const assetIds = notifications
      .filter((n) => n.assetId)
      .map((n) => n.assetId as string);

    // Fetch all tickets in a single query
    const tickets = ticketIds.length > 0
      ? await prisma.ticket.findMany({
          where: { id: { in: ticketIds } },
          select: { id: true, number: true },
        })
      : [];

    // Fetch all assets in a single query
    const assets = assetIds.length > 0
      ? await prisma.asset.findMany({
          where: { id: { in: assetIds } },
          select: { id: true, asset_code: true },
        })
      : [];

    // Create lookup maps for O(1) access
    const ticketMap = new Map(tickets.map((t) => [t.id, t.number]));
    const assetMap = new Map(assets.map((a) => [a.id, a.asset_code]));

    // Enrich notifications with ticket numbers and asset codes
    const enrichedNotifications = notifications.map((notification) => ({
      ...notification,
      ticketNumber: notification.ticketId ? ticketMap.get(notification.ticketId) || null : null,
      assetCode: notification.assetId ? assetMap.get(notification.assetId) || null : null,
    }));

    res.json(enrichedNotifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/user/:userId/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    // Users can only view their own notification count
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

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

// Create a notification (authenticated users only, typically used by system)
router.post('/', authenticate, async (req: AuthRequest, res) => {
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
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get the notification first to check ownership
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Users can only mark their own notifications as read
    if (req.user?.id !== notification.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(updatedNotification);
  } catch (error) {
    console.error('Failed to update notification:', error);
    res.status(404).json({ message: 'Notification not found' });
  }
});

// Mark all notifications as read for a user
router.patch('/user/:userId/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    // Users can only mark their own notifications as read
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

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
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get the notification first to check ownership
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Users can only delete their own notifications
    if (req.user?.id !== notification.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

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
router.delete('/user/:userId/read', authenticate, async (req: AuthRequest, res) => {
  try {
    // Users can only delete their own notifications
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

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

// Dismiss all notifications for a user
router.delete('/user/:userId/dismiss-all', authenticate, async (req: AuthRequest, res) => {
  try {
    // Users can only delete their own notifications
    if (req.user?.id !== req.params.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await prisma.notification.deleteMany({
      where: {
        userId: req.params.userId,
      },
    });

    console.log(`✅ Dismissed ${result.count} notifications for user ${req.params.userId}`);
    res.json({ message: 'All notifications dismissed successfully', count: result.count });
  } catch (error) {
    console.error('Failed to dismiss all notifications:', error);
    res.status(500).json({ message: 'Failed to dismiss all notifications' });
  }
});

// Speed test notification endpoint (TECHNICIAN or ADMIN only)
router.post('/speed-test', authenticate, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
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

// TEST ENDPOINT: Create a test notification (ADMIN only)
router.post('/test/:userId', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
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
