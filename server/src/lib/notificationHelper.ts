import { prisma } from './prisma.js';

/**
 * Creates a notification only if a similar one doesn't already exist within a time window
 * This prevents duplicates caused by dual database writes
 *
 * @param data - The notification data to create
 * @param timeWindowMs - Time window in milliseconds to check for duplicates (default: 5000ms)
 * @returns The created notification or null if duplicate exists
 */
export async function createNotificationIfNotExists(
  data: {
    type: string;
    title: string;
    message: string;
    userId: string;
    senderId?: string | null;
    ticketId?: string | null;
  },
  timeWindowMs: number = 5000
) {
  try {
    // Check for existing notification within the time window
    const recentTime = new Date(Date.now() - timeWindowMs);

    const existingNotification = await prisma.notification.findFirst({
      where: {
        type: data.type,
        title: data.title,
        userId: data.userId,
        ticketId: data.ticketId,
        createdAt: {
          gte: recentTime,
        },
      },
    });

    // If a similar notification was created recently, skip creating a new one
    if (existingNotification) {
      console.log(`[DUPLICATE PREVENTED] Notification already exists for user ${data.userId}, title: "${data.title}"`);
      return null;
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data,
    });

    console.log(`[NOTIFICATION CREATED] Type: ${data.type}, User: ${data.userId}, Title: "${data.title}"`);
    return notification;
  } catch (error) {
    console.error('[NOTIFICATION ERROR]', error);
    throw error;
  }
}
