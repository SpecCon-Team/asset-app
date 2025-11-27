import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { getAuditLogs } from '../lib/auditLog';

const router = Router();

// GET /api/audit-logs - Get audit logs (ADMIN only)
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res) => {
  try {
    const querySchema = z.object({
      userId: z.string().optional(),
      action: z.string().optional(),
      entityType: z.string().optional(),
      startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      limit: z.string().optional().transform(val => val ? parseInt(val) : 100),
      offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid query parameters', errors: parsed.error.flatten() });
    }

    const { logs, total } = await getAuditLogs(parsed.data);

    res.json({
      logs: logs.map(log => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      total,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

// GET /api/audit-logs/stats - Get audit log statistics (ADMIN only)
router.get('/stats', authenticate, requireRole('ADMIN'), async (req: Request, res) => {
  try {
    const { prisma } = await import('../lib/prisma');

    // Get stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalLogs, actionBreakdown, entityBreakdown, recentActivity] = await Promise.all([
      // Total logs
      prisma.auditLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),

      // Breakdown by action
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),

      // Breakdown by entity type
      prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: true,
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { _count: { entityType: 'desc' } },
      }),

      // Recent activity (last 24 hours)
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
    ]);

    res.json({
      totalLogs,
      recentActivity,
      actionBreakdown: actionBreakdown.map(item => ({
        action: item.action,
        count: item._count,
      })),
      entityBreakdown: entityBreakdown.map(item => ({
        entityType: item.entityType,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch audit log stats:', error);
    res.status(500).json({ message: 'Failed to fetch audit log stats' });
  }
});

// GET /api/audit-logs/export - Export audit logs as CSV (ADMIN only)
router.get('/export', authenticate, requireRole('ADMIN'), async (req: Request, res) => {
  try {
    const querySchema = z.object({
      startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid query parameters' });
    }

    const { logs } = await getAuditLogs({
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      limit: 10000, // Max export limit
    });

    // Log the export action
    const { logExport } = await import('../lib/auditLog');
    await logExport(
      req.user!.id,
      req.user!.email,
      'AuditLog',
      req.ip,
      { count: logs.length, startDate: parsed.data.startDate, endDate: parsed.data.endDate }
    );

    // Convert to CSV
    const headers = ['Date/Time', 'Action', 'Entity Type', 'Entity ID', 'User Email', 'User Name', 'IP Address', 'Status'];
    const rows = logs.map(log => [
      log.createdAt.toISOString(),
      log.action,
      log.entityType,
      log.entityId || '',
      log.userEmail || '',
      log.userName || '',
      log.ipAddress || '',
      log.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    res.status(500).json({ message: 'Failed to export audit logs' });
  }
});

export default router;
