import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all trips for current user
router.get('/', authenticate, async (req: Request, res) => {
  try {
    const userRole = req.user!.role;
    
    // Build where clause
    const whereClause: any = {
      userId: req.user!.id,
    };
    
    // PEG users can only see PEG routes
    if (userRole === 'PEG') {
      whereClause.isPegRoute = true;
    }
    
    const trips = await prisma.trip.findMany({
      where: whereClause,
      orderBy: {
        startDate: 'desc',
      },
    });

    res.json(trips);
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    res.status(500).json({ 
      error: 'Failed to fetch trips',
      details: error?.message || 'Unknown error'
    });
  }
});

// Get single trip
router.get('/:id', authenticate, async (req: Request, res) => {
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
router.post('/', authenticate, async (req: Request, res) => {
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
router.put('/:id', authenticate, async (req: Request, res) => {
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
router.delete('/:id', authenticate, async (req: Request, res) => {
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

// Create PEG client route
router.post('/peg-route', authenticate, async (req: Request, res) => {
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
      routeStops,
    } = req.body;

    // Validation
    if (!destination || !startDate || !endDate || !routeStops || !Array.isArray(routeStops) || routeStops.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: destination, startDate, endDate, routeStops',
      });
    }

    // Validate route stops
    for (const stop of routeStops) {
      if (!stop.clientId || !stop.visitDate || !stop.visitTime || stop.order === undefined) {
        return res.status(400).json({
          error: 'Each route stop must have clientId, visitDate, visitTime, and order',
        });
      }
    }

    // Create trip with route stops
    const trip = await prisma.trip.create({
      data: {
        destination,
        country: country || 'South Africa',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        category: category || 'business',
        status: status || 'upcoming',
        budget: parseFloat(budget) || 0,
        spent: parseFloat(spent) || 0,
        notes: notes || null,
        isPegRoute: true,
        userId: req.user!.id,
        routeStops: {
          create: routeStops.map((stop: any) => ({
            clientId: stop.clientId,
            visitDate: new Date(stop.visitDate),
            visitTime: stop.visitTime,
            duration: stop.duration || 60,
            notes: stop.notes || null,
            order: stop.order,
            status: 'planned',
          })),
        },
      },
      include: {
        routeStops: {
          include: {
            client: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating PEG route:', error);
    res.status(500).json({ error: 'Failed to create PEG route', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get trip with route stops
router.get('/:id/route', authenticate, async (req: Request, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        isPegRoute: true,
      },
      include: {
        routeStops: {
          include: {
            client: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'PEG route not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Error fetching PEG route:', error);
    res.status(500).json({ error: 'Failed to fetch PEG route' });
  }
});

// Update route stop
router.put('/route-stops/:id', authenticate, async (req: Request, res) => {
  try {
    const { visitDate, visitTime, duration, notes, order, status } = req.body;

    // Verify the route stop belongs to a trip owned by the user
    const routeStop = await prisma.tripRouteStop.findUnique({
      where: { id: req.params.id },
      include: {
        trip: true,
      },
    });

    if (!routeStop || routeStop.trip.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Route stop not found' });
    }

    const updated = await prisma.tripRouteStop.update({
      where: { id: req.params.id },
      data: {
        visitDate: visitDate ? new Date(visitDate) : undefined,
        visitTime,
        duration,
        notes,
        order,
        status,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating route stop:', error);
    res.status(500).json({ error: 'Failed to update route stop' });
  }
});

// Get trip statistics
router.get('/stats/summary', authenticate, async (req: Request, res) => {
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
