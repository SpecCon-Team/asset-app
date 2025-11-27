import { Router, Request } from 'express';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';

const router = Router();

/**
 * POST /api/2fa/setup
 * Generate 2FA secret and QR code
 */
router.post('/setup', authenticate, async (req: Request, res) => {
  try {
    const user = req.user!;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Asset Management (${user.email})`,
      issuer: 'Asset Management System',
    });

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
        backupCodes: JSON.stringify(backupCodes),
      },
    });

    // Log audit
    await logAudit(req, 'SETUP_2FA_INITIATED', 'User', user.id);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeDataURL,
      backupCodes,
    });
  } catch (error) {
    console.error('Failed to setup 2FA:', error);
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
});

/**
 * POST /api/2fa/verify-setup
 * Verify 2FA token and enable 2FA
 */
router.post('/verify-setup', authenticate, async (req: Request, res) => {
  const schema = z.object({
    token: z.string().length(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA setup not initiated' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: parsed.data.token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    // Log audit
    await logAudit(req, 'ENABLE_2FA', 'User', user.id);

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Failed to verify 2FA setup:', error);
    res.status(500).json({ message: 'Failed to verify 2FA setup' });
  }
});

/**
 * POST /api/2fa/verify
 * Verify 2FA token during login
 */
router.post('/verify', async (req: Request, res) => {
  const schema = z.object({
    userId: z.string(),
    token: z.string().min(6).max(8), // 6 for TOTP, 8 for backup code
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const token = parsed.data.token.toUpperCase();

    // Check if it's a backup code (8 characters)
    if (token.length === 8) {
      const backupCodes = user.backupCodes ? JSON.parse(user.backupCodes) : [];
      const codeIndex = backupCodes.indexOf(token);

      if (codeIndex === -1) {
        return res.status(400).json({ message: 'Invalid backup code' });
      }

      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await prisma.user.update({
        where: { id: user.id },
        data: { backupCodes: JSON.stringify(backupCodes) },
      });

      // Log audit
          await logAudit(
            req,
            'LOGIN_2FA_BACKUP',        'User',
        user.id,
        undefined,
        { backupCodesRemaining: backupCodes.length }
      );

      return res.json({ verified: true, backupCodesRemaining: backupCodes.length });
    }

    // Verify TOTP token (6 digits)
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Log audit
    await logAudit(req, 'LOGIN_2FA_SUCCESS', 'User', user.id);

    res.json({ verified: true });
  } catch (error) {
    console.error('Failed to verify 2FA:', error);
    res.status(500).json({ message: 'Failed to verify 2FA' });
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA for current user
 */
router.post('/disable', authenticate, async (req: Request, res) => {
  const schema = z.object({
    token: z.string().length(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: parsed.data.token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });

    // Log audit
    await logAudit(req, 'DISABLE_2FA', 'User', user.id);

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Failed to disable 2FA:', error);
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
});

/**
 * GET /api/2fa/status
 * Get 2FA status for current user
 */
router.get('/status', authenticate, async (req: Request, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        twoFactorEnabled: true,
        backupCodes: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const backupCodes = user.backupCodes ? JSON.parse(user.backupCodes) : [];

    res.json({
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: backupCodes.length,
    });
  } catch (error) {
    console.error('Failed to get 2FA status:', error);
    res.status(500).json({ message: 'Failed to get 2FA status' });
  }
});

/**
 * POST /api/2fa/regenerate-backup-codes
 * Regenerate backup codes
 */
router.post('/regenerate-backup-codes', authenticate, async (req: Request, res) => {
  const schema = z.object({
    token: z.string().length(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: parsed.data.token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { backupCodes: JSON.stringify(backupCodes) },
    });

    // Log audit
    await logAudit(req, 'REGENERATE_BACKUP_CODES', 'User', user.id);

    res.json({ backupCodes });
  } catch (error) {
    console.error('Failed to regenerate backup codes:', error);
    res.status(500).json({ message: 'Failed to regenerate backup codes' });
  }
});

/**
 * POST /api/2fa/admin/reset
 * Admin endpoint to reset 2FA for a locked-out user
 * ADMIN ONLY
 */
router.post('/admin/reset', authenticate, async (req: Request, res) => {
  // Check if requester is admin
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const schema = z.object({
    userId: z.string(),
    reason: z.string().optional(), // Optional reason for audit log
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.twoFactorEnabled) {
      return res.status(400).json({ message: 'User does not have 2FA enabled' });
    }

    // Reset 2FA for the user
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });

    // Log audit with admin details
    await logAudit(
      req,
      'ADMIN_RESET_2FA',
      'User',
      parsed.data.userId,
      undefined,
      {
        adminId: req.user!.id,
        adminEmail: req.user!.email,
        targetUserEmail: targetUser.email,
        reason: parsed.data.reason || 'No reason provided',
      }
    );

    console.log(
      `🔓 Admin ${req.user!.email} reset 2FA for user ${targetUser.email} (${targetUser.id})`
    );

    res.json({
      message: '2FA reset successfully',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    });
  } catch (error) {
    console.error('Failed to reset 2FA:', error);
    res.status(500).json({ message: 'Failed to reset 2FA' });
  }
});

/**
 * GET /api/2fa/admin/users-with-2fa
 * Get list of users with 2FA enabled (admin only)
 */
router.get('/admin/users-with-2fa', authenticate, async (req: Request, res) => {
  // Check if requester is admin
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const users = await prisma.user.findMany({
      where: { twoFactorEnabled: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        twoFactorEnabled: true,
        backupCodes: true,
        createdAt: true,
      },
      orderBy: { email: 'asc' },
    });

    // Count remaining backup codes for each user
    const usersWithBackupCount = users.map(user => {
      const backupCodes = user.backupCodes ? JSON.parse(user.backupCodes) : [];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        backupCodesRemaining: backupCodes.length,
        createdAt: user.createdAt,
      };
    });

    res.json(usersWithBackupCount);
  } catch (error) {
    console.error('Failed to fetch users with 2FA:', error);
    res.status(500).json({ message: 'Failed to fetch users with 2FA' });
  }
});

export default router;
