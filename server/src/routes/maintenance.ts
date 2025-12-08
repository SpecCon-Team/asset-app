import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../lib/auditLog.js';

interface CreateMaintenanceScheduleBody {
  assetId: string;
  title: string;
  description?: string;
  frequency: string;
  nextDueDate: string; // ISO date string
  priority?: string;
  estimatedDuration?: number;
  cost?: number;
  assignedToId?: string;
}

interface UpdateMaintenanceScheduleBody {
  title?: string;
  description?: string;
  frequency?: string;
  nextDueDate?: string; // ISO date string
  priority?: string;
  estimatedDuration?: number;
  cost?: number;
  assignedToId?: string;
  isActive?: boolean;
}

interface CompleteMaintenanceTaskBody {
  status?: string;
  notes?: string;
  actualDuration?: number;
  actualCost?: number;
  partsReplaced?: string[]; // Assuming it's an array of strings
  issues?: string;
}

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
const prisma = new PrismaClient();

// Get all maintenance schedules
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { assetId, status, priority, assignedToId } = req.query;

    const where: any = {};
    if (assetId) where.assetId = assetId;
    
    
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
      },
      orderBy: { nextDueDate: 'asc' },
    });

    // Convert BigInt values to numbers for JSON serialization
    res.json(convertBigIntsToNumbers(schedules));
  } catch (error) {
    console.error('Failed to fetch maintenance schedules:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance schedules' });
  }
});

// Get upcoming maintenance (due within X days)
router.get('/upcoming', authenticate, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const schedules = await prisma.maintenanceSchedule.findMany({
      where: {
        
        nextDueDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        asset: true,
      },
      orderBy: { nextDueDate: 'asc' },
    });

    res.json(convertBigIntsToNumbers(schedules));
  } catch (error) {
    console.error('Failed to fetch upcoming maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming maintenance' });
  }
});

// Get overdue maintenance
router.get('/overdue', authenticate, async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const schedules = await prisma.maintenanceSchedule.findMany({
      where: {
        
        nextDueDate: {
          lt: now,
        },
      },
      include: {
        asset: true,
      },
      orderBy: { nextDueDate: 'asc' },
    });

    res.json(convertBigIntsToNumbers(schedules));
  } catch (error) {
    console.error('Failed to fetch overdue maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch overdue maintenance' });
  }
});

// Get single maintenance schedule
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: req.params.id },
      include: {
        asset: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }

    res.json(convertBigIntsToNumbers(schedule));
  } catch (error) {
    console.error('Failed to fetch maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance schedule' });
  }
});

// Create maintenance schedule
router.post('/', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: Request<{}, {}, CreateMaintenanceScheduleBody>, res: Response) => {
  try {
    const {
      assetId,
      title,
      description,
      frequency,
      nextDueDate,
      priority,
      estimatedDuration,
      cost,
      assignedToId,
    } = req.body;

    if (!assetId || !title || !nextDueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        assetId,
        title,
        description,
        frequency,
        nextDueDate: new Date(nextDueDate),
        cost,
        assignedToId,
        createdById: req.user.id,
      },
      include: {
        asset: true,
      },
    });

    await logAudit(req, 'CREATE', 'MaintenanceSchedule', schedule.id, { created: schedule });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Failed to create maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to create maintenance schedule' });
  }
});

// Update maintenance schedule
router.put('/:id', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: Request<{ id: string }, {}, UpdateMaintenanceScheduleBody>, res: Response) => {
  try {
    const {
      title,
      description,
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
        frequency,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
        cost,
        assignedToId,
        isActive,
      },
      include: {
        asset: true,
      },
    });

    await logAudit(req, 'UPDATE', 'MaintenanceSchedule', schedule.id, { old: oldSchedule, new: schedule });

    res.json(convertBigIntsToNumbers(schedule));
  } catch (error) {
    console.error('Failed to update maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to update maintenance schedule' });
  }
});

// Delete maintenance schedule
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
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

    await logAudit(req, 'DELETE', 'MaintenanceSchedule', req.params.id, { deleted: schedule });

    res.json({ message: 'Maintenance schedule deleted successfully' });
  } catch (error) {
    console.error('Failed to delete maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to delete maintenance schedule' });
  }
});

// Complete maintenance task
router.post('/:id/complete', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: Request<{ id: string }, {}, CompleteMaintenanceTaskBody>, res: Response) => {
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
    // const history = await prisma.maintenanceHistory.create({
    //   data: {
    //     scheduleId: schedule.id,
    //     assetId: schedule.assetId,
    //     completedById: req.user.id,
    //     status: status || 'completed',
    //     notes,
    //     actualDuration,
    //     actualCost,
    //     partsReplaced: partsReplaced ? JSON.stringify(partsReplaced) : null,
    //     issues,
    //   },
    // });

    // Calculate next due date if recurring
    let nextDueDate = schedule.nextDueDate;
    if (schedule.frequency) {
      const current = new Date(schedule.nextDueDate); // Base calculation on the *current* nextDueDate
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
        default:
          // For 'once' or unknown frequencies, do not change nextDueDate
          break;
      }
    }

    // Update schedule
    const updatedSchedule = await prisma.maintenanceSchedule.update({
      where: { id: req.params.id },
      data: {
        lastCompletedAt: new Date(),
        nextDueDate,
      },
    });

    await logAudit(req, 'UPDATE', 'MaintenanceSchedule', schedule.id, { action: 'completed', history });

    res.json(convertBigIntsToNumbers({ schedule: updatedSchedule, history }));
  } catch (error) {
    console.error('Failed to complete maintenance:', error);
    res.status(500).json({ error: 'Failed to complete maintenance' });
  }
});

// Get maintenance history
// router.get('/:id/history', authenticate, async (req: Request, res: Response) => {
//   try {
//     const history = await prisma.maintenanceHistory.findMany({
//       where: { scheduleId: req.params.id },
//       include: {
//         completedBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//       orderBy: { completedAt: 'desc' },
//     });

//     res.json(convertBigIntsToNumbers(history));
//   } catch (error) {
//     console.error('Failed to fetch maintenance history:', error);
//     res.status(500).json({ error: 'Failed to fetch maintenance history' });
//   }
// });

// Get maintenance statistics
router.get('/stats/overview', authenticate, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSchedules,
      overdueSchedules,
    ] = await Promise.all([
      prisma.maintenanceSchedule.count(),
      prisma.maintenanceSchedule.count({
        where: {
          nextDueDate: { lt: now },
          status: { not: 'completed' }
        },
      }),
    ]);

    // Convert BigInt values to numbers for JSON serialization
    const response = {
      totalSchedules,
      activeSchedules: totalSchedules, // All schedules are considered active
      overdueSchedules,
      completedLast30Days: 0, // Not available without MaintenanceHistory
      totalCostLast30Days: 0, // Not available without MaintenanceHistory
    };

    res.json(convertBigIntsToNumbers(response));
  } catch (error) {
    console.error('Failed to fetch maintenance statistics:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance statistics' });
  }
});

export default router;
