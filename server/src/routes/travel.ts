import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all trips for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get single trip
router.get('/:id', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Create new trip
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      destination,
      country,
      startDate,
      endDate,
      category,
      status,
      budget,
      spent,
      notes,
      itinerary,
    } = req.body;

    // Validation
    if (!destination || !startDate || !endDate || !category) {
      return res.status(400).json({
        error: 'Missing required fields: destination, startDate, endDate, category',
      });
    }

    const trip = await prisma.trip.create({
      data: {
        destination,
        country: country || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        category,
        status: status || 'upcoming',
        budget: parseFloat(budget) || 0,
        spent: parseFloat(spent) || 0,
        notes: notes || null,
        itinerary: itinerary || null,
        userId: req.user!.id,
      },
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Update trip
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      destination,
      country,
      startDate,
      endDate,
      category,
      status,
      budget,
      spent,
      notes,
      itinerary,
    } = req.body;

    // Check if trip exists and belongs to user
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existingTrip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = await prisma.trip.update({
      where: {
        id: req.params.id,
      },
      data: {
        destination,
        country,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        category,
        status,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        spent: spent !== undefined ? parseFloat(spent) : undefined,
        notes,
        itinerary,
      },
    });

    res.json(trip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete trip
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check if trip exists and belongs to user
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existingTrip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await prisma.trip.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// Get trip statistics
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId: req.user!.id,
      },
    });

    const stats = {
      total: trips.length,
      upcoming: trips.filter(t => t.status === 'upcoming').length,
      ongoing: trips.filter(t => t.status === 'ongoing').length,
      completed: trips.filter(t => t.status === 'completed').length,
      cancelled: trips.filter(t => t.status === 'cancelled').length,
      totalBudget: trips.reduce((sum, t) => sum + t.budget, 0),
      totalSpent: trips.reduce((sum, t) => sum + t.spent, 0),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching trip stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
