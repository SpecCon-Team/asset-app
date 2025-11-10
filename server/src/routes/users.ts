import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const assignRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  res.json(users);
});

router.patch('/:id/role', async (req, res) => {
  const parsed = assignRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, role: true },
  });
  res.json(user);
});

export default router;


