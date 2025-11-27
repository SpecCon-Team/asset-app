import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

// Helper function to convert BigInt values to numbers recursively
function convertBigIntsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToNumbers);
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntsToNumbers(value);
    }
    return converted;
  }

  return obj;
}

const router = Router();

// GET /api/analytics/overview - System-wide overview
router.get('/overview', authenticate, cacheMiddleware(60000), async (req: Request, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
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
      prisma.asset.count({ where: dateFilter }).catch(err => {
        console.error('Error counting assets:', err);
        return 0;
      }),
      prisma.ticket.count({ where: dateFilter }).catch(err => {
        console.error('Error counting tickets:', err);
        return 0;
      }),
      prisma.user.count({ where: dateFilter }).catch(err => {
        console.error('Error counting users:', err);
        return 0;
      }),
      prisma.document.count({ where: { ...dateFilter, isLatestVersion: true } }).catch(err => {
        console.error('Error counting documents:', err);
        return 0;
      }),

      prisma.asset.groupBy({
        by: ['asset_type'],
        _count: true,
        where: dateFilter
      }).catch(err => {
        console.error('Error grouping assets by type:', err);
        return [];
      }),

      prisma.ticket.groupBy({
        by: ['status'],
        _count: true,
        where: dateFilter
      }).catch(err => {
        console.error('Error grouping tickets by status:', err);
        return [];
      }),

      prisma.ticket.groupBy({
        by: ['priority'],
        _count: true,
        where: dateFilter
      }).catch(err => {
        console.error('Error grouping tickets by priority:', err);
        return [];
      }),

      prisma.auditLog.findMany({
        where: dateFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          userId: true,
          userName: true,
          userEmail: true,
          createdAt: true,
          status: true
        }
      }).catch(err => {
        console.error('Error fetching recent activity:', err);
        return [];
      })
    ]);

    // Convert BigInt values to numbers for JSON serialization
    const response = {
      overview: {
        totalAssets,
        totalTickets,
        totalUsers,
        totalDocuments
      },
      distribution: {
        assetsByType: convertBigIntsToNumbers(assetsByType),
        ticketsByStatus: convertBigIntsToNumbers(ticketsByStatus),
        ticketsByPriority: convertBigIntsToNumbers(ticketsByPriority)
      },
      recentActivity: convertBigIntsToNumbers(recentActivity)
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching overview:', error);
    res.status(500).json({
      error: 'Failed to fetch overview',
      message: error.message
    });
  }
});

// GET /api/analytics/assets - Asset analytics
router.get('/assets', authenticate, cacheMiddleware(60000), async (req: Request, res) => {
  try {
    const [
      totalValue,
      byStatus,
      byLocation,
      depreciation,
      topAssets
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT COALESCE(SUM("currentBookValue"), 0) as total
        FROM "Asset"
        WHERE "currentBookValue" IS NOT NULL
      `.catch(err => {
        console.error('Error in totalValue query:', err);
        return [{ total: 0 }];
      }),

      prisma.asset.groupBy({
        by: ['status'],
        _count: true
      }).catch(err => {
        console.error('Error in byStatus query:', err);
        return [];
      }),

      prisma.asset.groupBy({
        by: ['office_location'],
        _count: true
      }).catch(err => {
        console.error('Error in byLocation query:', err);
        return [];
      }),

      prisma.$queryRaw`
        SELECT
          COALESCE(SUM("currentBookValue"), 0) as total_value,
          COALESCE(SUM("accumulatedDepreciation"), 0) as total_depreciation
        FROM "AssetDepreciation"
        WHERE "isActive" = true
      `.catch(err => {
        console.error('Error in depreciation query:', err);
        return [{ total_value: 0, total_depreciation: 0 }];
      }),

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
      }).catch(err => {
        console.error('Error in topAssets query:', err);
        return [];
      })
    ]);

    // Convert BigInt values to numbers for JSON serialization
    const response = {
      totalValue: Number(totalValue[0]?.total || 0),
      byStatus: convertBigIntsToNumbers(byStatus),
      byLocation: convertBigIntsToNumbers(byLocation),
      depreciation: convertBigIntsToNumbers(depreciation[0] || { total_value: 0, total_depreciation: 0 }),
      topAssets: convertBigIntsToNumbers(topAssets)
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching asset analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch asset analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/tickets - Ticket analytics
router.get('/tickets', authenticate, cacheMiddleware(60000), async (req: Request, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
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
      }).catch(err => {
        console.error('Error grouping tickets by status:', err);
        return [];
      }),

      prisma.ticket.groupBy({
        by: ['priority'],
        _count: true,
        where: dateFilter
      }).catch(err => {
        console.error('Error grouping tickets by priority:', err);
        return [];
      }),

      prisma.ticket.groupBy({
        by: ['assignedToId'],
        _count: true,
        where: { ...dateFilter, assignedToId: { not: null } }
      }).catch(err => {
        console.error('Error grouping tickets by assignee:', err);
        return [];
      }),

      (async () => {
        try {
          if (startDate && endDate) {
            return await prisma.$queryRaw<Array<{ avg_hours: number }>>`
              SELECT COALESCE(AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600), 0) as avg_hours
              FROM "Ticket"
              WHERE status = 'closed'
              AND "createdAt" BETWEEN ${new Date(startDate as string)}::timestamp AND ${new Date(endDate as string)}::timestamp
            `;
          } else {
            return await prisma.$queryRaw<Array<{ avg_hours: number }>>`
              SELECT COALESCE(AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600), 0) as avg_hours
              FROM "Ticket"
              WHERE status = 'closed'
            `;
          }
        } catch (err) {
          console.error('Error calculating avg resolution time:', err);
          return [{ avg_hours: 0 }];
        }
      })(),

      (async () => {
        try {
          if (startDate && endDate) {
            return await prisma.$queryRaw<Array<{ date: Date; count: number; status: string }>>`
              SELECT
                DATE("createdAt") as date,
                COUNT(*) as count,
                status
              FROM "Ticket"
              WHERE "createdAt" BETWEEN ${new Date(startDate as string)}::timestamp AND ${new Date(endDate as string)}::timestamp
              GROUP BY DATE("createdAt"), status
              ORDER BY date DESC
              LIMIT 30
            `;
          } else {
            return await prisma.$queryRaw<Array<{ date: Date; count: number; status: string }>>`
              SELECT
                DATE("createdAt") as date,
                COUNT(*) as count,
                status
              FROM "Ticket"
              GROUP BY DATE("createdAt"), status
              ORDER BY date DESC
              LIMIT 30
            `;
          }
        } catch (err) {
          console.error('Error fetching trends over time:', err);
          return [];
        }
      })()
    ]);

    // Enrich assignee data
    const assigneeIds = byAssignee.map((a: any) => a.assignedToId).filter(Boolean);
    const users = assigneeIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: assigneeIds as string[] } },
      select: { id: true, name: true }
    }).catch(err => {
      console.error('Error fetching user data:', err);
      return [];
    }) : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    // Enrich assignees with user data
    const enrichedAssignees = byAssignee.map((a: any) => ({
      ...a,
      user: a.assignedToId ? userMap.get(a.assignedToId) : null
    }));

    // Convert BigInt values to numbers for JSON serialization
    const response = {
      byStatus: convertBigIntsToNumbers(byStatus),
      byPriority: convertBigIntsToNumbers(byPriority),
      byAssignee: convertBigIntsToNumbers(enrichedAssignees),
      avgResolutionTime: Number(avgResolutionTime[0]?.avg_hours || 0),
      trendsOverTime: convertBigIntsToNumbers(trendsOverTime)
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching ticket analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch ticket analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/users - User activity analytics
router.get('/users', authenticate, requireRole(['ADMIN']), async (req: Request, res) => {
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

    // Convert BigInt values to numbers for JSON serialization
    const response = {
      byRole: convertBigIntsToNumbers(byRole),
      mostActive: convertBigIntsToNumbers(mostActive),
      loginActivity: convertBigIntsToNumbers(loginActivity)
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch user analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/maintenance - Maintenance analytics
router.get('/maintenance', authenticate, async (req: Request, res) => {
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
        by: ['maintenanceType'] as const,
        _count: true
      }),

      prisma.$queryRaw`
        SELECT
          SUM("cost") as total_cost,
          AVG("cost") as avg_cost
        FROM "MaintenanceHistory"
      `
    ]);

    // Convert BigInt values to numbers for JSON serialization
    const response = {
      totalScheduled,
      completionRate: Number(completionRate[0]?.rate || 0),
      byType: convertBigIntsToNumbers(byType),
      costAnalysis: convertBigIntsToNumbers(costAnalysis[0] || { total_cost: 0, avg_cost: 0 })
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching maintenance analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch maintenance analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/inventory - Inventory analytics
router.get('/inventory', authenticate, async (req: Request, res) => {
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

    // Convert BigInt values to numbers for JSON serialization
    const response = {
      totalItems,
      totalValue: Number(totalValue[0]?.total || 0),
      lowStockItems: lowStock,
      topMoving: convertBigIntsToNumbers(topMoving),
      byCategory: convertBigIntsToNumbers(byCategory)
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/export - Export analytics data
router.get('/export', authenticate, requireRole(['ADMIN']), async (req: Request, res) => {
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

    // Convert BigInt values to numbers for JSON serialization
    const serializedData = convertBigIntsToNumbers(data);

    if (format === 'csv') {
      // Basic CSV conversion
      const keys = Object.keys(serializedData[0] || {});
      const csv = [
        keys.join(','),
        ...serializedData.map((row: any) => keys.map(key => JSON.stringify(row[key])).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({ data: serializedData });
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
