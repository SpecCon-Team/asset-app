import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const createSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.string().default('medium'),
  createdById: z.string(),
  assetId: z.string().nullable().optional(),
});

router.get('/', async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    include: {
      createdBy: { select: { id: true, email: true } },
      assignedTo: { select: { id: true, email: true } },
      asset: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tickets);
});

router.get('/:id', async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: { createdBy: true, assignedTo: true, asset: true },
  });
  if (!ticket) return res.status(404).json({ message: 'Not found' });
  res.json(ticket);
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const seq = Math.floor(Date.now() / 1000);
  const number = `TKT-${seq}`;
  const ticket = await prisma.ticket.create({
    data: { ...parsed.data, number },
  });
  res.json(ticket);
});

router.patch('/:id', async (req, res) => {
  const parsed = createSchema.partial().extend({
    status: z.string().optional(),
    resolution: z.string().optional(),
    assignedToId: z.string().nullable().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(ticket);
});

export default router;


