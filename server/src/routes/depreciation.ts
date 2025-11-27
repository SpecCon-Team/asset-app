import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';

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

// =====================================================
// DEPRECIATION RECORDS ENDPOINTS
// =====================================================

// GET /api/depreciation - List all depreciation records
router.get('/', authenticate, async (req: Request, res) => {
  try {
    const { status, method, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.isActive = status === 'active';
    }

    if (method) {
      where.depreciationMethod = method;
    }

    const [records, total] = await Promise.all([
      prisma.assetDepreciation.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              asset_code: true,
              asset_type: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.assetDepreciation.count({ where })
    ]);

    res.json({
      records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching depreciation records:', error);
    res.status(500).json({
      error: 'Failed to fetch depreciation records',
      message: error.message
    });
  }
});

// GET /api/depreciation/stats - Get depreciation statistics
router.get('/stats', authenticate, async (req: Request, res) => {
  try {
    const [
      totalAssets,
      totalBookValue,
      totalAccumulated,
      duThisMonth,
      byMethod
    ] = await Promise.all([
      prisma.assetDepreciation.count({ where: { isActive: true } }),

      prisma.$queryRaw`
        SELECT SUM("currentBookValue") as total
        FROM "AssetDepreciation"
        WHERE "isActive" = true
      `,

      prisma.$queryRaw`
        SELECT SUM("accumulatedDepreciation") as total
        FROM "AssetDepreciation"
        WHERE "isActive" = true
      `,

      // Count depreciation due this month (no view available, return 0)
      Promise.resolve([{ count: 0 }]),

      prisma.assetDepreciation.groupBy({
        by: ['depreciationMethod'],
        where: { isActive: true },
        _count: true,
        _sum: {
          currentBookValue: true
        }
      })
    ]);

    const response = {
      totalAssets,
      totalBookValue: Number(totalBookValue[0]?.total || 0),
      totalAccumulated: Number(totalAccumulated[0]?.total || 0),
      dueThisMonth: Number(duThisMonth[0]?.count || 0),
      byMethod: convertBigIntsToNumbers(byMethod)
    };

    res.json(convertBigIntsToNumbers(response));
  } catch (error: any) {
    console.error('Error fetching depreciation stats:', error);
    res.status(500).json({
      error: 'Failed to fetch depreciation statistics',
      message: error.message
    });
  }
});

// GET /api/depreciation/due - Get depreciation due this month
router.get('/due', authenticate, async (req: Request, res) => {
  try {
    const dueItems = await prisma.$queryRaw`
      SELECT * FROM "DepreciationDueThisMonth"
    `;

    res.json({ items: dueItems });
  } catch (error: any) {
    console.error('Error fetching due depreciation:', error);
    res.status(500).json({
      error: 'Failed to fetch due depreciation',
      message: error.message
    });
  }
});

// GET /api/depreciation/:id - Get single depreciation record
router.get('/:id', authenticate, async (req: Request, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.assetDepreciation.findUnique({
      where: { id },
      include: {
        asset: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        schedule: {
          orderBy: {
            periodNumber: 'asc'
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Depreciation record not found' });
    }

    res.json(record);
  } catch (error: any) {
    console.error('Error fetching depreciation record:', error);
    res.status(500).json({
      error: 'Failed to fetch depreciation record',
      message: error.message
    });
  }
});

// POST /api/depreciation - Create depreciation record
router.post('/', authenticate, requireRole(['ADMIN']), async (req: Request, res) => {
  try {
    const {
      assetId,
      depreciationMethod,
      purchasePrice,
      salvageValue,
      usefulLifeYears,
      usefulLifeMonths = 0,
      purchaseDate,
      depreciationStartDate,
      annualDepreciationRate,
      notes
    } = req.body;

    // Validate required fields
    if (!assetId || !depreciationMethod || !purchasePrice || !usefulLifeYears || !purchaseDate || !depreciationStartDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'assetId, depreciationMethod, purchasePrice, usefulLifeYears, purchaseDate, and depreciationStartDate are required'
      });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Calculate depreciation values
    const totalMonths = (usefulLifeYears * 12) + (usefulLifeMonths || 0);
    const depreciableAmount = parseFloat(purchasePrice) - parseFloat(salvageValue || '0');

    let monthlyDepreciation = 0;
    let currentBookValue = parseFloat(purchasePrice);

    if (depreciationMethod === 'straight_line') {
      monthlyDepreciation = depreciableAmount / totalMonths;
    } else if (depreciationMethod === 'declining_balance') {
      // For declining balance, use annual rate
      monthlyDepreciation = (parseFloat(purchasePrice) * (parseFloat(annualDepreciationRate) / 100)) / 12;
    }

    // Create depreciation record
    const record = await prisma.assetDepreciation.create({
      data: {
        assetId,
        depreciationMethod,
        purchasePrice: parseFloat(purchasePrice),
        salvageValue: parseFloat(salvageValue || '0'),
        usefulLifeYears,
        usefulLifeMonths: usefulLifeMonths || 0,
        purchaseDate: new Date(purchaseDate),
        depreciationStartDate: new Date(depreciationStartDate),
        currentBookValue,
        accumulatedDepreciation: 0,
        annualDepreciationRate: annualDepreciationRate ? parseFloat(annualDepreciationRate) : null,
        monthlyDepreciationAmount: monthlyDepreciation,
        notes,
        createdById: req.user.id
      },
      include: {
        asset: true
      }
    });

    // Update asset
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate: new Date(purchaseDate),
        currentBookValue,
        isDepreciable: true,
        depreciationStatus: 'depreciating'
      }
    });

    // Generate depreciation schedule
    await prisma.$executeRaw`SELECT generate_depreciation_schedule(${record.id})`;

    // Log audit
    await logAudit(req, 'CREATE', 'AssetDepreciation', record.id, {
      assetId,
      depreciationMethod,
      purchasePrice
    });

    res.status(201).json({
      message: 'Depreciation record created successfully',
      record
    });
  } catch (error: any) {
    console.error('Error creating depreciation record:', error);
    res.status(500).json({
      error: 'Failed to create depreciation record',
      message: error.message
    });
  }
});

// PUT /api/depreciation/:id - Update depreciation record
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: Request, res) => {
  try {
    const { id } = req.params;
    const { salvageValue, notes, isActive } = req.body;

    const record = await prisma.assetDepreciation.update({
      where: { id },
      data: {
        salvageValue: salvageValue ? parseFloat(salvageValue) : undefined,
        notes,
        isActive,
        updatedAt: new Date()
      },
      include: {
        asset: true
      }
    });

    // Log audit
    await logAudit(req, 'UPDATE', 'AssetDepreciation', id, req.body);

    res.json({
      message: 'Depreciation record updated successfully',
      record
    });
  } catch (error: any) {
    console.error('Error updating depreciation record:', error);
    res.status(500).json({
      error: 'Failed to update depreciation record',
      message: error.message
    });
  }
});

// POST /api/depreciation/:id/post - Post depreciation for period
router.post('/:id/post', authenticate, requireRole(['ADMIN']), async (req: Request, res) => {
  try {
    const { id } = req.params;
    const { periodId } = req.body;

    if (!periodId) {
      return res.status(400).json({ error: 'Period ID is required' });
    }

    // Get schedule entry
    const schedule = await prisma.depreciationSchedule.findUnique({
      where: { id: periodId },
      include: {
        depreciation: true
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }

    if (schedule.isPosted) {
      return res.status(400).json({ error: 'Period already posted' });
    }

    // Update schedule entry
    await prisma.depreciationSchedule.update({
      where: { id: periodId },
      data: {
        isPosted: true,
        postedAt: new Date(),
        postedById: req.user.id
      }
    });

    // Update depreciation record
    await prisma.assetDepreciation.update({
      where: { id },
      data: {
        currentBookValue: schedule.closingBookValue,
        accumulatedDepreciation: schedule.accumulatedDepreciation,
        lastCalculatedAt: new Date()
      }
    });

    // Log audit
    await logAudit(req, 'POST_DEPRECIATION', 'DepreciationSchedule', periodId, {
      depreciationId: id,
      amount: schedule.depreciationAmount
    });

    res.json({
      message: 'Depreciation posted successfully',
      schedule
    });
  } catch (error: any) {
    console.error('Error posting depreciation:', error);
    res.status(500).json({
      error: 'Failed to post depreciation',
      message: error.message
    });
  }
});

// =====================================================
// ASSET VALUATION ENDPOINTS
// =====================================================

// POST /api/depreciation/valuations - Create valuation
router.post('/valuations', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: Request, res) => {
  try {
    const {
      assetId,
      valuationDate,
      valuationType,
      bookValue,
      marketValue,
      replacementValue,
      condition,
      appraisedBy,
      notes
    } = req.body;

    if (!assetId || !valuationDate || !valuationType || !bookValue) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'assetId, valuationDate, valuationType, and bookValue are required'
      });
    }

    const valuation = await prisma.assetValuation.create({
      data: {
        assetId,
        valuationDate: new Date(valuationDate),
        valuationType,
        bookValue: parseFloat(bookValue),
        marketValue: marketValue ? parseFloat(marketValue) : null,
        replacementValue: replacementValue ? parseFloat(replacementValue) : null,
        condition,
        appraisedBy,
        notes,
        valuedById: req.user.id
      }
    });

    await logAudit(req, 'CREATE', 'AssetValuation', valuation.id, { assetId });

    res.status(201).json({
      message: 'Valuation created successfully',
      valuation
    });
  } catch (error: any) {
    console.error('Error creating valuation:', error);
    res.status(500).json({
      error: 'Failed to create valuation',
      message: error.message
    });
  }
});

// GET /api/depreciation/valuations/:assetId - Get valuations for asset
router.get('/valuations/:assetId', authenticate, async (req: Request, res) => {
  try {
    const { assetId } = req.params;

    const valuations = await prisma.assetValuation.findMany({
      where: { assetId },
      include: {
        valuedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        valuationDate: 'desc'
      }
    });

    res.json({ valuations });
  } catch (error: any) {
    console.error('Error fetching valuations:', error);
    res.status(500).json({
      error: 'Failed to fetch valuations',
      message: error.message
    });
  }
});

// =====================================================
// ASSET DISPOSAL ENDPOINTS
// =====================================================

// POST /api/depreciation/disposals - Create disposal record
router.post('/disposals', authenticate, requireRole(['ADMIN']), async (req: Request, res) => {
  try {
    const {
      assetId,
      disposalDate,
      disposalMethod,
      reason,
      bookValueAtDisposal,
      disposalProceeds = 0,
      disposedToParty,
      notes
    } = req.body;

    if (!assetId || !disposalDate || !disposalMethod || !reason || !bookValueAtDisposal) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const gainLoss = parseFloat(disposalProceeds) - parseFloat(bookValueAtDisposal);

    const disposal = await prisma.assetDisposal.create({
      data: {
        assetId,
        disposalDate: new Date(disposalDate),
        disposalMethod,
        reason,
        bookValueAtDisposal: parseFloat(bookValueAtDisposal),
        disposalProceeds: parseFloat(disposalProceeds),
        gainLoss,
        disposedToParty,
        notes,
        createdById: req.user.id
      }
    });

    // Update asset status
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: 'disposed',
        depreciationStatus: 'disposed'
      }
    });

    await logAudit(req, 'CREATE', 'AssetDisposal', disposal.id, { assetId });

    res.status(201).json({
      message: 'Disposal record created successfully',
      disposal
    });
  } catch (error: any) {
    console.error('Error creating disposal:', error);
    res.status(500).json({
      error: 'Failed to create disposal record',
      message: error.message
    });
  }
});

// GET /api/depreciation/disposals - List disposals
router.get('/disposals', authenticate, async (req: Request, res) => {
  try {
    const disposals = await prisma.assetDisposal.findMany({
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            asset_code: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        disposalDate: 'desc'
      }
    });

    res.json({ disposals });
  } catch (error: any) {
    console.error('Error fetching disposals:', error);
    res.status(500).json({
      error: 'Failed to fetch disposals',
      message: error.message
    });
  }
});

export default router;
