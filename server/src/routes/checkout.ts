import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';
import QRCode from 'qrcode';

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
// GET /api/checkout - List all checkouts
// =====================================================

router.get('/', authenticate, async (req: any, res) => {
  try {
    const {
      status,
      assetId,
      userId,
      overdue,
      page = '1',
      limit = '50',
      sortBy = 'checkoutDate',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (overdue === 'true') {
      where.status = 'checked_out';
      where.expectedReturnDate = {
        lt: new Date()
      };
    }

    const [checkouts, total] = await Promise.all([
      prisma.assetCheckout.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              asset_code: true,
              asset_type: true,
              image_url: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          checkedOutBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          checkedInBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limitNum
      }),
      prisma.assetCheckout.count({ where })
    ]);

    // Calculate overdue status
    const checkoutsWithOverdue = checkouts.map(checkout => ({
      ...checkout,
      isOverdue: checkout.status === 'checked_out' &&
                 checkout.expectedReturnDate &&
                 new Date(checkout.expectedReturnDate) < new Date(),
      daysOverdue: checkout.expectedReturnDate
        ? Math.floor((Date.now() - checkout.expectedReturnDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0
    }));

    res.json({
      checkouts: checkoutsWithOverdue,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching checkouts:', error);
    res.status(500).json({
      error: 'Failed to fetch checkouts',
      message: error.message
    });
  }
});

// =====================================================
// GET /api/checkout/current - Get current checkouts
// =====================================================

router.get('/current', authenticate, async (req: any, res) => {
  try {
    const checkouts = await prisma.$queryRaw`
      SELECT * FROM "CurrentCheckouts"
      ORDER BY "checkoutDate" DESC
    `;

    res.json({ checkouts });
  } catch (error: any) {
    console.error('Error fetching current checkouts:', error);
    res.status(500).json({
      error: 'Failed to fetch current checkouts',
      message: error.message
    });
  }
});

// =====================================================
// GET /api/checkout/overdue - Get overdue checkouts
// =====================================================

router.get('/overdue', authenticate, async (req: any, res) => {
  try {
    const checkouts = await prisma.$queryRaw`
      SELECT * FROM "OverdueCheckouts"
    `;

    res.json({ checkouts });
  } catch (error: any) {
    console.error('Error fetching overdue checkouts:', error);
    res.status(500).json({
      error: 'Failed to fetch overdue checkouts',
      message: error.message
    });
  }
});

// =====================================================
// GET /api/checkout/history - Get checkout history
// =====================================================

router.get('/history', authenticate, async (req: any, res) => {
  try {
    const { assetId, userId, limit = '100' } = req.query;

    let query = `SELECT * FROM "CheckoutHistory"`;
    const conditions: string[] = [];

    if (assetId) {
      conditions.push(`"assetId" = '${assetId}'`);
    }

    if (userId) {
      conditions.push(`"userId" = '${userId}'`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` LIMIT ${limit}`;

    const history = await prisma.$queryRawUnsafe(query);

    res.json({ history });
  } catch (error: any) {
    console.error('Error fetching checkout history:', error);
    res.status(500).json({
      error: 'Failed to fetch checkout history',
      message: error.message
    });
  }
});

// =====================================================
// GET /api/checkout/stats - Get checkout statistics
// =====================================================

router.get('/stats', authenticate, async (req: any, res) => {
  try {
    const [
      totalCheckouts,
      currentCheckouts,
      overdueCheckouts,
      totalReturned,
      avgCheckoutDays,
      topAssets,
      topUsers
    ] = await Promise.all([
      // Total checkouts
      prisma.assetCheckout.count(),

      // Current checkouts
      prisma.assetCheckout.count({
        where: { status: 'checked_out' }
      }),

      // Overdue checkouts
      prisma.assetCheckout.count({
        where: {
          status: 'checked_out',
          expectedReturnDate: {
            lt: new Date()
          }
        }
      }),

      // Total returned
      prisma.assetCheckout.count({
        where: { status: 'checked_in' }
      }),

      // Average checkout days
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(DAY FROM (COALESCE("actualReturnDate", NOW()) - "checkoutDate"))) as avg_days
        FROM "AssetCheckout"
        WHERE status IN ('checked_in', 'checked_out')
      `,

      // Top checked out assets
      prisma.$queryRaw`
        SELECT
          a.id,
          a.name,
          a.asset_code,
          COUNT(ac.id) as checkout_count
        FROM "Asset" a
        JOIN "AssetCheckout" ac ON a.id = ac."assetId"
        GROUP BY a.id, a.name, a.asset_code
        ORDER BY checkout_count DESC
        LIMIT 5
      `,

      // Top users by checkout count
      prisma.$queryRaw`
        SELECT
          u.id,
          u.name,
          u.email,
          COUNT(ac.id) as checkout_count
        FROM "User" u
        JOIN "AssetCheckout" ac ON u.id = ac."userId"
        GROUP BY u.id, u.name, u.email
        ORDER BY checkout_count DESC
        LIMIT 5
      `
    ]);

    const response = {
      totalCheckouts,
      currentCheckouts,
      overdueCheckouts,
      totalReturned,
      avgCheckoutDays: Number(avgCheckoutDays[0]?.avg_days || 0),
      topAssets: convertBigIntsToNumbers(topAssets),
      topUsers: convertBigIntsToNumbers(topUsers)
    };

    res.json(convertBigIntsToNumbers(response));
  } catch (error: any) {
    console.error('Error fetching checkout stats:', error);
    res.status(500).json({
      error: 'Failed to fetch checkout statistics',
      message: error.message
    });
  }
});

// =====================================================
// GET /api/checkout/:id - Get single checkout
// =====================================================

router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;

    const checkout = await prisma.assetCheckout.findUnique({
      where: { id },
      include: {
        asset: {
          include: {
            qrCodes: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
          }
        },
        checkedOutBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        checkedInBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        locationHistory: {
          include: {
            movedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            movedAt: 'desc'
          }
        }
      }
    });

    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    // Calculate overdue status
    const isOverdue = checkout.status === 'checked_out' &&
                      checkout.expectedReturnDate &&
                      new Date(checkout.expectedReturnDate) < new Date();

    const daysOverdue = checkout.expectedReturnDate
      ? Math.floor((Date.now() - checkout.expectedReturnDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      ...checkout,
      isOverdue,
      daysOverdue
    });
  } catch (error: any) {
    console.error('Error fetching checkout:', error);
    res.status(500).json({
      error: 'Failed to fetch checkout',
      message: error.message
    });
  }
});

// =====================================================
// POST /api/checkout - Create new checkout
// =====================================================

router.post('/', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const {
      assetId,
      userId,
      expectedReturnDate,
      location,
      purpose,
      notes,
      condition
    } = req.body;

    // Validate required fields
    if (!assetId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'assetId and userId are required'
      });
    }

    // Check if asset exists and is available
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.checkoutStatus === 'checked_out') {
      return res.status(400).json({
        error: 'Asset already checked out',
        message: 'This asset is currently checked out to another user'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create checkout record
    const checkout = await prisma.assetCheckout.create({
      data: {
        assetId,
        userId,
        checkedOutById: req.user.id,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        location: location || asset.currentLocation,
        purpose,
        notes,
        condition: condition || 'good',
        status: 'checked_out'
      },
      include: {
        asset: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create location history if location changed
    if (location && location !== asset.currentLocation) {
      await prisma.assetLocationHistory.create({
        data: {
          assetId,
          checkoutId: checkout.id,
          location,
          previousLocation: asset.currentLocation,
          movedById: req.user.id,
          reason: 'Asset checked out',
          notes: `Asset checked out to ${user.name || user.email}`
        }
      });

      // Update asset location
      await prisma.asset.update({
        where: { id: assetId },
        data: { currentLocation: location }
      });
    }

    // Create reminder if expected return date is set
    if (expectedReturnDate) {
      const returnDate = new Date(expectedReturnDate);
      const reminderDate = new Date(returnDate);
      reminderDate.setDate(reminderDate.getDate() - 1); // Remind 1 day before

      await prisma.checkoutReminder.create({
        data: {
          checkoutId: checkout.id,
          reminderDate,
          reminderType: 'return_reminder'
        }
      });
    }

    // Log audit
    await logAudit(req.user.id, 'CHECKOUT', 'AssetCheckout', checkout.id, {
      assetId,
      userId,
      expectedReturnDate,
      location,
      purpose
    });

    res.status(201).json({
      message: 'Asset checked out successfully',
      checkout
    });
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    res.status(500).json({
      error: 'Failed to create checkout',
      message: error.message
    });
  }
});

// =====================================================
// POST /api/checkout/:id/checkin - Check in asset
// =====================================================

router.post('/:id/checkin', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      returnCondition,
      returnNotes,
      location
    } = req.body;

    // Get checkout record
    const checkout = await prisma.assetCheckout.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    if (checkout.status !== 'checked_out') {
      return res.status(400).json({
        error: 'Asset not checked out',
        message: 'This asset is not currently checked out'
      });
    }

    // Update checkout record
    const updatedCheckout = await prisma.assetCheckout.update({
      where: { id },
      data: {
        status: 'checked_in',
        actualReturnDate: new Date(),
        checkinDate: new Date(),
        checkedInById: req.user.id,
        returnCondition: returnCondition || 'good',
        returnNotes
      },
      include: {
        asset: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create location history if location changed
    if (location && location !== checkout.asset.currentLocation) {
      await prisma.assetLocationHistory.create({
        data: {
          assetId: checkout.assetId,
          checkoutId: checkout.id,
          location,
          previousLocation: checkout.asset.currentLocation,
          movedById: req.user.id,
          reason: 'Asset checked in',
          notes: returnNotes
        }
      });

      // Update asset location
      await prisma.asset.update({
        where: { id: checkout.assetId },
        data: { currentLocation: location }
      });
    }

    // Log audit
    await logAudit(req.user.id, 'CHECKIN', 'AssetCheckout', id, {
      returnCondition,
      returnNotes,
      location
    });

    res.json({
      message: 'Asset checked in successfully',
      checkout: updatedCheckout
    });
  } catch (error: any) {
    console.error('Error checking in asset:', error);
    res.status(500).json({
      error: 'Failed to check in asset',
      message: error.message
    });
  }
});

// =====================================================
// PUT /api/checkout/:id - Update checkout
// =====================================================

router.put('/:id', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      expectedReturnDate,
      location,
      purpose,
      notes,
      condition
    } = req.body;

    const checkout = await prisma.assetCheckout.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    // Update checkout
    const updatedCheckout = await prisma.assetCheckout.update({
      where: { id },
      data: {
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : checkout.expectedReturnDate,
        location: location || checkout.location,
        purpose: purpose || checkout.purpose,
        notes: notes !== undefined ? notes : checkout.notes,
        condition: condition || checkout.condition,
        updatedAt: new Date()
      },
      include: {
        asset: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create location history if location changed
    if (location && location !== checkout.location) {
      await prisma.assetLocationHistory.create({
        data: {
          assetId: checkout.assetId,
          checkoutId: checkout.id,
          location,
          previousLocation: checkout.location,
          movedById: req.user.id,
          reason: 'Location updated',
          notes
        }
      });

      // Update asset location
      await prisma.asset.update({
        where: { id: checkout.assetId },
        data: { currentLocation: location }
      });
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE', 'AssetCheckout', id, req.body);

    res.json({
      message: 'Checkout updated successfully',
      checkout: updatedCheckout
    });
  } catch (error: any) {
    console.error('Error updating checkout:', error);
    res.status(500).json({
      error: 'Failed to update checkout',
      message: error.message
    });
  }
});

// =====================================================
// DELETE /api/checkout/:id - Delete checkout
// =====================================================

router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;

    const checkout = await prisma.assetCheckout.findUnique({
      where: { id }
    });

    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    // Delete checkout
    await prisma.assetCheckout.delete({
      where: { id }
    });

    // Log audit
    await logAudit(req.user.id, 'DELETE', 'AssetCheckout', id, checkout);

    res.json({ message: 'Checkout deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting checkout:', error);
    res.status(500).json({
      error: 'Failed to delete checkout',
      message: error.message
    });
  }
});

// =====================================================
// QR CODE ENDPOINTS
// =====================================================

// GET /api/checkout/qr/asset/:assetId - Get QR code for asset
router.get('/qr/asset/:assetId', authenticate, async (req: any, res) => {
  try {
    const { assetId } = req.params;

    const qrCode = await prisma.assetQRCode.findFirst({
      where: {
        assetId,
        isActive: true
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            asset_code: true
          }
        }
      }
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found for this asset' });
    }

    res.json({ qrCode });
  } catch (error: any) {
    console.error('Error fetching QR code:', error);
    res.status(500).json({
      error: 'Failed to fetch QR code',
      message: error.message
    });
  }
});

// POST /api/checkout/qr/generate - Generate QR code for asset
router.post('/qr/generate', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const { assetId } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: 'Asset ID is required' });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Check if QR code already exists
    const existingQR = await prisma.assetQRCode.findFirst({
      where: {
        assetId,
        isActive: true
      }
    });

    if (existingQR) {
      return res.status(400).json({
        error: 'QR code already exists',
        message: 'Use the existing QR code or deactivate it first'
      });
    }

    // Generate QR code data
    const qrData = `ASSET:${asset.asset_code}:${assetId}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });

    // Create QR code record
    const qrCode = await prisma.assetQRCode.create({
      data: {
        assetId,
        qrCode: qrData,
        qrCodeUrl,
        generatedById: req.user.id
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            asset_code: true
          }
        }
      }
    });

    // Log audit
    await logAudit(req.user.id, 'CREATE', 'AssetQRCode', qrCode.id, { assetId });

    res.status(201).json({
      message: 'QR code generated successfully',
      qrCode
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      error: 'Failed to generate QR code',
      message: error.message
    });
  }
});

// POST /api/checkout/qr/scan - Scan QR code
router.post('/qr/scan', authenticate, async (req: any, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ error: 'QR code data is required' });
    }

    // Find QR code
    const qrRecord = await prisma.assetQRCode.findUnique({
      where: { qrCode },
      include: {
        asset: true
      }
    });

    if (!qrRecord) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    if (!qrRecord.isActive) {
      return res.status(400).json({ error: 'QR code is inactive' });
    }

    // Update scan count and last scanned time
    await prisma.assetQRCode.update({
      where: { id: qrRecord.id },
      data: {
        lastScannedAt: new Date(),
        scanCount: qrRecord.scanCount + 1
      }
    });

    res.json({
      message: 'QR code scanned successfully',
      asset: qrRecord.asset
    });
  } catch (error: any) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({
      error: 'Failed to scan QR code',
      message: error.message
    });
  }
});

// =====================================================
// LOCATION HISTORY ENDPOINTS
// =====================================================

// GET /api/checkout/location/history/:assetId - Get location history for asset
router.get('/location/history/:assetId', authenticate, async (req: any, res) => {
  try {
    const { assetId } = req.params;

    const history = await prisma.assetLocationHistory.findMany({
      where: { assetId },
      include: {
        movedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        checkout: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        movedAt: 'desc'
      }
    });

    res.json({ history });
  } catch (error: any) {
    console.error('Error fetching location history:', error);
    res.status(500).json({
      error: 'Failed to fetch location history',
      message: error.message
    });
  }
});

export default router;
