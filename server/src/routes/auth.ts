import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash } });
  res.json({ id: user.id, email: user.email, role: user.role });
});

router.post('/login', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;


