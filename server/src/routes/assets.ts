import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const createSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.string(),
  condition: z.string(),
  location: z.string().optional(),
  ownerId: z.string().nullable().optional(),
});

router.get('/', async (req, res) => {
  const q = (req.query.q as string) || undefined;
  const assets = await prisma.asset.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { type: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: { owner: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assets);
});

router.get('/:id', async (req, res) => {
  const asset = await prisma.asset.findUnique({ where: { id: req.params.id }, include: { owner: true } });
  if (!asset) return res.status(404).json({ message: 'Not found' });
  res.json(asset);
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const asset = await prisma.asset.create({ data: parsed.data });
  res.json(asset);
});

router.patch('/:id', async (req, res) => {
  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const asset = await prisma.asset.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(asset);
});

router.delete('/:id', async (req, res) => {
  await prisma.asset.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;


