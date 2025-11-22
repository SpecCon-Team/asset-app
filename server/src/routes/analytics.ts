import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/analytics/overview - System-wide overview
router.get('/overview', authenticate, async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const [
      totalAssets,
      totalTickets,
      totalUsers,
      totalDocuments,
      assetsByType,
      ticketsByStatus,
      ticketsByPriority,
      recentActivity
    ] = await Promise.all([
      prisma.asset.count({ where: dateFilter }),
      prisma.ticket.count({ where: dateFilter }),
      prisma.user.count({ where: dateFilter }),
      prisma.document.count({ where: { ...dateFilter, isLatestVersion: true } }),

      prisma.asset.groupBy({
        by: ['asset_type'],
        _count: true,
        where: dateFilter
      }),

      prisma.ticket.groupBy({
        by: ['status'],
        _count: true,
        where: dateFilter
      }),

      prisma.ticket.groupBy({
        by: ['priority'],
        _count: true,
        where: dateFilter
      }),

      prisma.auditLog.findMany({
        where: dateFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { name: true }
          }
        }
      })
    ]);

    res.json({
      overview: {
        totalAssets,
        totalTickets,
        totalUsers,
        totalDocuments
      },
      distribution: {
        assetsByType,
        ticketsByStatus,
        ticketsByPriority
      },
      recentActivity
    });
  } catch (error: any) {
    console.error('Error fetching overview:', error);
    res.status(500).json({
      error: 'Failed to fetch overview',
      message: error.message
    });
  }
});

// GET /api/analytics/assets - Asset analytics
router.get('/assets', authenticate, async (req: any, res) => {
  try {
    const [
      totalValue,
      byStatus,
      byLocation,
      depreciation,
      topAssets
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT SUM("currentBookValue") as total
        FROM "Asset"
        WHERE "currentBookValue" IS NOT NULL
      `,

      prisma.asset.groupBy({
        by: ['status'],
        _count: true
      }),

      prisma.asset.groupBy({
        by: ['location'],
        _count: true
      }),

      prisma.$queryRaw`
        SELECT
          SUM("currentBookValue") as total_value,
          SUM("accumulatedDepreciation") as total_depreciation
        FROM "AssetDepreciation"
        WHERE "isActive" = true
      `,

      prisma.asset.findMany({
        where: { currentBookValue: { not: null } },
        orderBy: { currentBookValue: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          asset_code: true,
          currentBookValue: true
        }
      })
    ]);

    res.json({
      totalValue: totalValue[0]?.total || 0,
      byStatus,
      byLocation,
      depreciation: depreciation[0] || {},
      topAssets
    });
  } catch (error: any) {
    console.error('Error fetching asset analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch asset analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/tickets - Ticket analytics
router.get('/tickets', authenticate, async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const [
      byStatus,
      byPriority,
      byAssignee,
      avgResolutionTime,
      trendsOverTime
    ] = await Promise.all([
      prisma.ticket.groupBy({
        by: ['status'],
        _count: true,
        where: dateFilter
      }),

      prisma.ticket.groupBy({
        by: ['priority'],
        _count: true,
        where: dateFilter
      }),

      prisma.ticket.groupBy({
        by: ['assigned_to'],
        _count: true,
        where: { ...dateFilter, assigned_to: { not: null } }
      }),

      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600) as avg_hours
        FROM "Ticket"
        WHERE status = 'closed'
        ${startDate && endDate ? prisma.raw(`AND "createdAt" BETWEEN '${startDate}' AND '${endDate}'`) : prisma.raw('')}
      `,

      prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          COUNT(*) as count,
          status
        FROM "Ticket"
        ${startDate && endDate ? prisma.raw(`WHERE "createdAt" BETWEEN '${startDate}' AND '${endDate}'`) : prisma.raw('')}
        GROUP BY DATE("createdAt"), status
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    // Enrich assignee data
    const assigneeIds = byAssignee.map(a => a.assigned_to).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: assigneeIds as string[] } },
      select: { id: true, name: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const enrichedAssignees = byAssignee.map(a => ({
      ...a,
      user: a.assigned_to ? userMap.get(a.assigned_to) : null
    }));

    res.json({
      byStatus,
      byPriority,
      byAssignee: enrichedAssignees,
      avgResolutionTime: avgResolutionTime[0]?.avg_hours || 0,
      trendsOverTime
    });
  } catch (error: any) {
    console.error('Error fetching ticket analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch ticket analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/users - User activity analytics
router.get('/users', authenticate, requireRole(['ADMIN']), async (req: any, res) => {
  try {
    const [
      byRole,
      mostActive,
      loginActivity
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),

      prisma.$queryRaw`
        SELECT
          u.id,
          u.name,
          u.email,
          COUNT(DISTINCT t.id) as ticket_count,
          COUNT(DISTINCT a.id) as asset_count,
          COUNT(DISTINCT al.id) as action_count
        FROM "User" u
        LEFT JOIN "Ticket" t ON t."created_by" = u.id
        LEFT JOIN "Asset" a ON a."assigned_to" = u.id
        LEFT JOIN "AuditLog" al ON al."userId" = u.id
        GROUP BY u.id, u.name, u.email
        ORDER BY action_count DESC
        LIMIT 10
      `,

      prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          COUNT(DISTINCT "userId") as active_users
        FROM "AuditLog"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `
    ]);

    res.json({
      byRole,
      mostActive,
      loginActivity
    });
  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch user analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/maintenance - Maintenance analytics
router.get('/maintenance', authenticate, async (req: any, res) => {
  try {
    const [
      totalScheduled,
      completionRate,
      byType,
      costAnalysis
    ] = await Promise.all([
      prisma.maintenanceSchedule.count(),

      prisma.$queryRaw`
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0) as rate
        FROM "MaintenanceSchedule"
      `,

      prisma.maintenanceSchedule.groupBy({
        by: ['maintenanceType'],
        _count: true
      }),

      prisma.$queryRaw`
        SELECT
          SUM("cost") as total_cost,
          AVG("cost") as avg_cost
        FROM "MaintenanceHistory"
      `
    ]);

    res.json({
      totalScheduled,
      completionRate: completionRate[0]?.rate || 0,
      byType,
      costAnalysis: costAnalysis[0] || {}
    });
  } catch (error: any) {
    console.error('Error fetching maintenance analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch maintenance analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/inventory - Inventory analytics
router.get('/inventory', authenticate, async (req: any, res) => {
  try {
    const [
      totalItems,
      totalValue,
      lowStock,
      topMoving,
      byCategory
    ] = await Promise.all([
      prisma.inventoryItem.count(),

      prisma.$queryRaw`
        SELECT SUM("currentQuantity" * "unitCost") as total
        FROM "InventoryItem"
      `,

      prisma.inventoryItem.count({
        where: {
          currentQuantity: { lte: prisma.raw('"reorderPoint"') }
        }
      }),

      prisma.$queryRaw`
        SELECT
          i.id,
          i.name,
          i."currentQuantity",
          COUNT(st.id) as transaction_count
        FROM "InventoryItem" i
        LEFT JOIN "StockTransaction" st ON st."itemId" = i.id
        GROUP BY i.id, i.name, i."currentQuantity"
        ORDER BY transaction_count DESC
        LIMIT 10
      `,

      prisma.inventoryItem.groupBy({
        by: ['category'],
        _count: true,
        _sum: {
          currentQuantity: true
        }
      })
    ]);

    res.json({
      totalItems,
      totalValue: totalValue[0]?.total || 0,
      lowStockItems: lowStock,
      topMoving,
      byCategory
    });
  } catch (error: any) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/export - Export analytics data
router.get('/export', authenticate, requireRole(['ADMIN']), async (req: any, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } : {};

    let data: any;

    switch (type) {
      case 'assets':
        data = await prisma.asset.findMany({
          where: dateFilter,
          include: {
            assigned_user: { select: { name: true } }
          }
        });
        break;
      case 'tickets':
        data = await prisma.ticket.findMany({
          where: dateFilter,
          include: {
            created_by_user: { select: { name: true } },
            assigned_user: { select: { name: true } }
          }
        });
        break;
      case 'audit':
        data = await prisma.auditLog.findMany({
          where: dateFilter,
          include: {
            user: { select: { name: true } }
          }
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Basic CSV conversion
      const keys = Object.keys(data[0] || {});
      const csv = [
        keys.join(','),
        ...data.map((row: any) => keys.map(key => JSON.stringify(row[key])).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({ data });
    }
  } catch (error: any) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      error: 'Failed to export analytics',
      message: error.message
    });
  }
});

export default router;
