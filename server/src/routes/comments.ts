import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const createCommentSchema = z.object({
  content: z.string().min(1),
  ticketId: z.string(),
  authorId: z.string(),
});

// Get all comments for a ticket
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { ticketId: req.params.ticketId },
      include: {
        author: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Create a comment
router.post('/', async (req, res) => {
  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const comment = await prisma.comment.create({
      data: parsed.data,
      include: {
        author: {
          select: { id: true, email: true, name: true, role: true },
        },
        ticket: {
          include: {
            createdBy: true,
          },
        },
      },
    });

    // Determine if comment is from admin/technician or regular user
    const isAdminComment = comment.author.role === 'ADMIN' || comment.author.role === 'TECHNICIAN';
    const isUserComment = comment.author.role === 'USER';
    const ticketCreatorId = comment.ticket.createdById;
    const isNotSelfComment = ticketCreatorId !== comment.authorId;

    // If admin/tech comments → notify ticket creator (user)
    if (isAdminComment && isNotSelfComment) {
      await prisma.notification.create({
        data: {
          type: 'comment',
          title: 'New comment on your ticket',
          message: `${comment.author.name || comment.author.email} commented: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
          userId: ticketCreatorId,
          senderId: comment.authorId,
          ticketId: comment.ticketId,
        },
      });
    }

    // If user comments → notify all admins/technicians
    if (isUserComment) {
      const adminsAndTechs = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'TECHNICIAN'],
          },
        },
        select: { id: true },
      });

      const notificationPromises = adminsAndTechs.map(admin =>
        prisma.notification.create({
          data: {
            type: 'comment',
            title: 'User replied to ticket',
            message: `${comment.author.name || comment.author.email} commented: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
            userId: admin.id,
            senderId: comment.authorId,
            ticketId: comment.ticketId,
          },
        })
      );

      await Promise.all(notificationPromises);
      console.log(`✅ Created comment notifications for ${adminsAndTechs.length} admins/technicians`);
    }

    res.json(comment);
  } catch (error) {
    console.error('Failed to create comment:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
  try {
    await prisma.comment.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: 'Comment not found' });
  }
});

export default router;