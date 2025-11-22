import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAuditEvent } from '../lib/auditLog.js';

const router = Router();
const prisma = new PrismaClient();

// Get all maintenance schedules
router.get('/', authenticate, async (req: any, res) => {
  try {
    const { assetId, status, priority, assignedToId } = req.query;

    const where: any = {};
    if (assetId) where.assetId = assetId;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    const schedules = await prisma.maintenanceSchedule.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            asset_code: true,
            asset_type: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            history: true,
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    res.json(schedules);
  } catch (error) {
    console.error('Failed to fetch maintenance schedules:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance schedules' });
  }
});

// Get upcoming maintenance (due within X days)
router.get('/upcoming', authenticate, async (req: any, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const schedules = await prisma.maintenanceSchedule.findMany({
      where: {
        isActive: true,
        nextDueDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        asset: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    res.json(schedules);
  } catch (error) {
    console.error('Failed to fetch upcoming maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming maintenance' });
  }
});

// Get overdue maintenance
router.get('/overdue', authenticate, async (req: any, res) => {
  try {
    const now = new Date();

    const schedules = await prisma.maintenanceSchedule.findMany({
      where: {
        isActive: true,
        nextDueDate: {
          lt: now,
        },
      },
      include: {
        asset: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    res.json(schedules);
  } catch (error) {
    console.error('Failed to fetch overdue maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch overdue maintenance' });
  }
});

// Get single maintenance schedule
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: req.params.id },
      include: {
        asset: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          include: {
            completedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Failed to fetch maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance schedule' });
  }
});

// Create maintenance schedule
router.post('/', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const {
      assetId,
      title,
      description,
      scheduleType,
      frequency,
      nextDueDate,
      priority,
      estimatedDuration,
      cost,
      assignedToId,
    } = req.body;

    if (!assetId || !title || !scheduleType || !nextDueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        assetId,
        title,
        description,
        scheduleType,
        frequency,
        nextDueDate: new Date(nextDueDate),
        priority: priority || 'medium',
        estimatedDuration,
        cost,
        assignedToId,
        createdById: req.user.id,
      },
      include: {
        asset: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logAuditEvent({
      action: 'CREATE',
      entityType: 'MaintenanceSchedule',
      entityId: schedule.id,
      userId: req.user.id,
      changes: { created: schedule },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Failed to create maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to create maintenance schedule' });
  }
});

// Update maintenance schedule
router.put('/:id', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const {
      title,
      description,
      scheduleType,
      frequency,
      nextDueDate,
      priority,
      estimatedDuration,
      cost,
      assignedToId,
      isActive,
    } = req.body;

    const oldSchedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: req.params.id },
    });

    if (!oldSchedule) {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }

    const schedule = await prisma.maintenanceSchedule.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        scheduleType,
        frequency,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
        priority,
        estimatedDuration,
        cost,
        assignedToId,
        isActive,
      },
      include: {
        asset: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logAuditEvent({
      action: 'UPDATE',
      entityType: 'MaintenanceSchedule',
      entityId: schedule.id,
      userId: req.user.id,
      changes: { old: oldSchedule, new: schedule },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(schedule);
  } catch (error) {
    console.error('Failed to update maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to update maintenance schedule' });
  }
});

// Delete maintenance schedule
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: any, res) => {
  try {
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: req.params.id },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }

    await prisma.maintenanceSchedule.delete({
      where: { id: req.params.id },
    });

    await logAuditEvent({
      action: 'DELETE',
      entityType: 'MaintenanceSchedule',
      entityId: req.params.id,
      userId: req.user.id,
      changes: { deleted: schedule },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Maintenance schedule deleted successfully' });
  } catch (error) {
    console.error('Failed to delete maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to delete maintenance schedule' });
  }
});

// Complete maintenance task
router.post('/:id/complete', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const {
      status,
      notes,
      actualDuration,
      actualCost,
      partsReplaced,
      issues,
    } = req.body;

    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: req.params.id },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }

    // Create history record
    const history = await prisma.maintenanceHistory.create({
      data: {
        scheduleId: schedule.id,
        assetId: schedule.assetId,
        completedById: req.user.id,
        status: status || 'completed',
        notes,
        actualDuration,
        actualCost,
        partsReplaced: partsReplaced ? JSON.stringify(partsReplaced) : null,
        issues,
      },
    });

    // Calculate next due date if recurring
    let nextDueDate = schedule.nextDueDate;
    if (schedule.scheduleType === 'recurring' && schedule.frequency) {
      const current = new Date();
      switch (schedule.frequency) {
        case 'daily':
          nextDueDate = new Date(current.setDate(current.getDate() + 1));
          break;
        case 'weekly':
          nextDueDate = new Date(current.setDate(current.getDate() + 7));
          break;
        case 'monthly':
          nextDueDate = new Date(current.setMonth(current.getMonth() + 1));
          break;
        case 'quarterly':
          nextDueDate = new Date(current.setMonth(current.getMonth() + 3));
          break;
        case 'yearly':
          nextDueDate = new Date(current.setFullYear(current.getFullYear() + 1));
          break;
      }
    }

    // Update schedule
    const updatedSchedule = await prisma.maintenanceSchedule.update({
      where: { id: req.params.id },
      data: {
        lastCompletedDate: new Date(),
        nextDueDate,
      },
    });

    await logAuditEvent({
      action: 'UPDATE',
      entityType: 'MaintenanceSchedule',
      entityId: schedule.id,
      userId: req.user.id,
      changes: { action: 'completed', history },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ schedule: updatedSchedule, history });
  } catch (error) {
    console.error('Failed to complete maintenance:', error);
    res.status(500).json({ error: 'Failed to complete maintenance' });
  }
});

// Get maintenance history
router.get('/:id/history', authenticate, async (req: any, res) => {
  try {
    const history = await prisma.maintenanceHistory.findMany({
      where: { scheduleId: req.params.id },
      include: {
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    console.error('Failed to fetch maintenance history:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance history' });
  }
});

// Get maintenance statistics
router.get('/stats/overview', authenticate, async (req: any, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSchedules,
      activeSchedules,
      overdueSchedules,
      completedLast30Days,
      totalCostLast30Days,
    ] = await Promise.all([
      prisma.maintenanceSchedule.count(),
      prisma.maintenanceSchedule.count({ where: { isActive: true } }),
      prisma.maintenanceSchedule.count({
        where: {
          isActive: true,
          nextDueDate: { lt: now },
        },
      }),
      prisma.maintenanceHistory.count({
        where: {
          completedAt: { gte: thirtyDaysAgo },
          status: 'completed',
        },
      }),
      prisma.maintenanceHistory.aggregate({
        where: {
          completedAt: { gte: thirtyDaysAgo },
          status: 'completed',
        },
        _sum: { actualCost: true },
      }),
    ]);

    res.json({
      totalSchedules,
      activeSchedules,
      overdueSchedules,
      completedLast30Days,
      totalCostLast30Days: totalCostLast30Days._sum.actualCost || 0,
    });
  } catch (error) {
    console.error('Failed to fetch maintenance statistics:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance statistics' });
  }
});

export default router;
