import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all reservations (with filters)
router.get('/', authenticate, async (req: Request, res) => {
  try {
    const { assetId, userId, status } = req.query;

    const where: any = {};
    if (assetId) where.assetId = String(assetId);
    if (userId) where.userId = String(userId);
    if (status) where.status = String(status);

    const reservations = await prisma.assetReservation.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            asset_code: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ reservations });
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Create new reservation
router.post('/', authenticate, async (req: Request, res) => {
  try {
    const { assetId, reservationStart, reservationEnd, purpose, notes } = req.body;

    // Check if asset is available for the date range
    const conflictingReservations = await prisma.assetReservation.findMany({
      where: {
        assetId,
        status: { in: ['pending', 'approved'] },
        OR: [
          {
            AND: [
              { reservationStart: { lte: new Date(reservationStart) } },
              { reservationEnd: { gte: new Date(reservationStart) } },
            ],
          },
          {
            AND: [
              { reservationStart: { lte: new Date(reservationEnd) } },
              { reservationEnd: { gte: new Date(reservationEnd) } },
            ],
          },
        ],
      },
    });

    if (conflictingReservations.length > 0) {
      return res.status(409).json({
        error: 'Asset is already reserved for the selected date range',
      });
    }

    const reservation = await prisma.assetReservation.create({
      data: {
        assetId,
        userId: req.user!.id,
        reservationStart: new Date(reservationStart),
        reservationEnd: new Date(reservationEnd),
        purpose,
        notes,
        status: 'pending',
      },
      include: {
        asset: true,
        user: true,
      },
    });

    res.status(201).json({ reservation });
  } catch (error) {
    console.error('Failed to create reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// Update reservation status (approve/reject)
router.patch('/:id/status', authenticate, async (req: Request, res) => {
  try {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;

    // Only admins can approve/reject
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {
      status,
      approvedById: req.user.id,
      approvedAt: new Date(),
    };

    if (status === 'rejected' && rejectedReason) {
      updateData.rejectedReason = rejectedReason;
    }

    const reservation = await prisma.assetReservation.update({
      where: { id },
      data: updateData,
      include: {
        asset: true,
        user: true,
        approvedBy: true,
      },
    });

    res.json({ reservation });
  } catch (error) {
    console.error('Failed to update reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// Cancel reservation
router.delete('/:id', authenticate, async (req: Request, res) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.assetReservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Users can only cancel their own reservations
    if (reservation.userId !== req.user!.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.assetReservation.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Failed to cancel reservation:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

export default router;
