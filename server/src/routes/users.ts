import { Router } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, requireSelfOrAdmin } from '../middleware/auth';
import { applyFieldVisibility } from '../middleware/fieldVisibility';
import { filterFieldsByPermission, Role as PermRole } from '../lib/permissions';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

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

// Get all users - requires authentication, admins see all fields
router.get('/', authenticate, cacheMiddleware(30000), applyFieldVisibility('user'), async (req: Request, res) => {
  const { type, page = '1', limit = '100' } = req.query;

  let whereClause: any = {};

  // Filter by user type if specified
  if (type === 'whatsapp') {
    whereClause.isWhatsAppUser = true;
  } else if (type === 'regular') {
    whereClause.isWhatsAppUser = false;
  }

  // Parse pagination parameters
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Get total count for pagination metadata
  const totalCount = await prisma.user.count({ where: whereClause });

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isAvailable: true,
      profilePicture: true,
      phone: true,
      isWhatsAppUser: true,
      whatsAppNotifications: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    skip: limitNum === -1 ? undefined : skip,  // -1 means no pagination
    take: limitNum === -1 ? undefined : limitNum
  });

  // Return with pagination metadata
  res.json({
    data: users,
    pagination: limitNum === -1 ? null : {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  });
});

// Assign role - ADMIN only
router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req, res) => {
  const parsed = assignRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, role: true, isAvailable: true },
  });
  res.json(user);
});

// Update availability - self or ADMIN
router.patch('/:id/availability', authenticate, requireSelfOrAdmin, async (req, res) => {
  const parsed = updateAvailabilitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isAvailable: parsed.data.isAvailable },
    select: { id: true, email: true, name: true, role: true, isAvailable: true },
  });
  res.json(user);
});

// Update profile - self or ADMIN
router.patch('/:id/profile', authenticate, requireSelfOrAdmin, async (req, res) => {
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

// Update password - self only (not even admin can change others' passwords)
router.patch('/:id/password', authenticate, requireSelfOrAdmin, async (req, res) => {
  console.log('Password change request received for user:', req.params.id);

  const parsed = updatePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    console.log('Validation failed:', parsed.error.flatten());
    return res.status(400).json({ message: 'Invalid request data', errors: parsed.error.flatten() });
  }

  try {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found, verifying current password...');

    // Verify current password
    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);

    if (!isValid) {
      console.log('Current password is incorrect');
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    console.log('Current password verified, hashing new password...');

    // Hash new password
    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);

    console.log('Updating password in database...');

    // Update password
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });

    console.log('Password updated successfully for user:', req.params.id);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Failed to update password', error: String(error) });
  }
});

// Update settings - self only
router.patch('/:id/settings', authenticate, requireSelfOrAdmin, async (req, res) => {
  // Settings are stored client-side for now (localStorage)
  // You can extend this to store in database if needed
  res.json({ message: 'Settings updated successfully' });
});

// Delete user - ADMIN only
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user and all related data
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);

    // Check if it's a foreign key constraint error
    if ((error as any).code === 'P2003') {
      return res.status(400).json({
        message: 'Cannot delete user because they have associated records (assets, tickets, etc.). Please remove or reassign these first.'
      });
    }

    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;


