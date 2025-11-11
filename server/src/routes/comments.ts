import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
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
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (error) {
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
          select: { id: true, email: true, name: true },
        },
      },
    });
    res.json(comment);
  } catch (error) {
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