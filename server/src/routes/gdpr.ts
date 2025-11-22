/**
 * GDPR Compliance Routes
 * Provides endpoints for data export, deletion, and privacy management
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import {
  exportUserData,
  anonymizeUserData,
  permanentlyDeleteUser,
  getDataRetentionSummary,
  generatePrivacyReport,
  cleanupOldData,
} from '../lib/gdpr';
import { logAudit } from '../lib/auditLog';

const router = Router();

/**
 * GET /api/gdpr/export
 * Export all user data (GDPR Article 20 - Right to Data Portability)
 */
router.get('/export', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const exportData = await exportUserData(userId);

    // Log the export
    await logAudit(req, 'DATA_EXPORT', 'User', userId, undefined, {
      dataCategories: Object.keys(exportData.summary),
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`);

    res.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ message: 'Failed to export user data' });
  }
});

/**
 * GET /api/gdpr/retention-summary
 * Get data retention summary for current user
 */
router.get('/retention-summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const summary = await getDataRetentionSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Retention summary error:', error);
    res.status(500).json({ message: 'Failed to get retention summary' });
  }
});

/**
 * GET /api/gdpr/privacy-report
 * Generate privacy report for current user
 */
router.get('/privacy-report', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const report = await generatePrivacyReport(userId);

    // Log report generation
    await logAudit(req, 'PRIVACY_REPORT_GENERATED', 'User', userId);

    res.json(report);
  } catch (error) {
    console.error('Privacy report error:', error);
    res.status(500).json({ message: 'Failed to generate privacy report' });
  }
});

/**
 * POST /api/gdpr/anonymize
 * Request account anonymization (GDPR Article 17 - Right to Erasure)
 * Requires password confirmation
 */
router.post('/anonymize', authenticate, async (req: AuthRequest, res) => {
  const schema = z.object({
    password: z.string(),
    confirmation: z.literal('I understand this action cannot be undone'),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request',
        errors: parsed.error.flatten(),
      });
    }

    const userId = req.user!.id;

    // Verify password
    const bcrypt = require('bcryptjs');
    const { prisma } = require('../lib/prisma');
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Anonymize user data
    const result = await anonymizeUserData(userId, userId);

    // Log anonymization
    await logAudit(req, 'USER_ANONYMIZED', 'User', userId, undefined, {
      reason: 'User requested data erasure (GDPR Article 17)',
    });

    res.json({
      success: true,
      message: 'Your account has been anonymized. You will be logged out.',
      ...result,
    });
  } catch (error) {
    console.error('Anonymization error:', error);
    res.status(500).json({ message: 'Failed to anonymize user data' });
  }
});

/**
 * DELETE /api/gdpr/delete/:userId
 * Permanently delete user account (ADMIN only)
 * This is for compliance with legal deletion requirements
 */
router.delete('/delete/:userId', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const schema = z.object({
    reason: z.string().min(10, 'Deletion reason must be at least 10 characters'),
    confirmation: z.literal('PERMANENTLY DELETE'),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request',
        errors: parsed.error.flatten(),
      });
    }

    const userIdToDelete = req.params.userId;

    // Prevent self-deletion
    if (userIdToDelete === req.user!.id) {
      return res.status(400).json({
        message: 'You cannot permanently delete your own account',
      });
    }

    // Log before deletion
    await logAudit(req, 'USER_PERMANENTLY_DELETED', 'User', userIdToDelete, undefined, {
      reason: parsed.data.reason,
      deletedBy: req.user!.id,
    });

    // Permanently delete
    const result = await permanentlyDeleteUser(userIdToDelete);

    res.json({
      success: true,
      message: 'User permanently deleted',
      ...result,
    });
  } catch (error) {
    console.error('Permanent deletion error:', error);
    res.status(500).json({ message: 'Failed to permanently delete user' });
  }
});

/**
 * POST /api/gdpr/cleanup
 * Clean up old data based on retention policies (ADMIN only)
 */
router.post('/cleanup', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const schema = z.object({
    daysToRetain: z.number().min(30).max(3650).optional(),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request',
        errors: parsed.error.flatten(),
      });
    }

    const daysToRetain = parsed.data.daysToRetain || 365;

    const result = await cleanupOldData(daysToRetain);

    // Log cleanup
    await logAudit(req, 'DATA_CLEANUP', 'System', undefined, undefined, {
      daysToRetain,
      ...result,
    });

    res.json({
      success: true,
      message: 'Data cleanup completed',
      ...result,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Failed to cleanup old data' });
  }
});

/**
 * GET /api/gdpr/admin/retention-stats
 * Get overall data retention statistics (ADMIN only)
 */
router.get('/admin/retention-stats', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { prisma } = require('../lib/prisma');

    const [
      totalUsers,
      anonymizedUsers,
      totalTickets,
      resolvedTickets,
      totalNotifications,
      oldNotifications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { email: { contains: '@anonymized.local' } } }),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'resolved' } }),
      prisma.notification.count(),
      prisma.notification.count({
        where: {
          read: true,
          createdAt: {
            lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      users: {
        total: totalUsers,
        anonymized: anonymizedUsers,
        active: totalUsers - anonymizedUsers,
      },
      tickets: {
        total: totalTickets,
        resolved: resolvedTickets,
        active: totalTickets - resolvedTickets,
      },
      notifications: {
        total: totalNotifications,
        oldReadNotifications: oldNotifications,
      },
      recommendations: {
        shouldCleanupNotifications: oldNotifications > 100,
        shouldReviewAnonymizedUsers: anonymizedUsers > 0,
      },
    });
  } catch (error) {
    console.error('Retention stats error:', error);
    res.status(500).json({ message: 'Failed to get retention statistics' });
  }
});

export default router;
