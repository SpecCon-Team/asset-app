import { Router } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const assignRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  profilePicture: z.string().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(12),
});

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isAvailable: true, profilePicture: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});

router.patch('/:id/role', async (req, res) => {
  const parsed = assignRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, role: true, isAvailable: true },
  });
  res.json(user);
});

router.patch('/:id/availability', async (req, res) => {
  const parsed = updateAvailabilitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isAvailable: parsed.data.isAvailable },
    select: { id: true, email: true, name: true, role: true, isAvailable: true },
  });
  res.json(user);
});

router.patch('/:id/profile', async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isAvailable: true,
      phone: true,
      department: true,
      location: true,
      bio: true,
      profilePicture: true
    },
  });
  res.json(user);
});

router.patch('/:id/password', async (req, res) => {
  const parsed = updatePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password (you'll need to import bcrypt)
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

router.patch('/:id/settings', async (req, res) => {
  // Settings are stored client-side for now (localStorage)
  // You can extend this to store in database if needed
  res.json({ message: 'Settings updated successfully' });
});

export default router;


