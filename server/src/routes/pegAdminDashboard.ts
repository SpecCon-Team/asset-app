import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePegAdmin } from '../middleware/requirePegAdmin';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * GET /api/peg-admin/dashboard
 * Get dashboard statistics for PEG Admin
 */
router.get('/dashboard', authenticate, requirePegAdmin, async (req: Request, res: Response) => {
  try {
    // Get total client count across all provinces
    const totalClients = await prisma.pEGClient.count();

    // Get clients grouped by province
    const clientsByProvince = await prisma.pEGClient.groupBy({
      by: ['provinceId'],
      _count: true,
    });

    // Get recent clients (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentClients = await prisma.pEGClient.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    res.json({
      totalClients,
      recentClients,
      clientsByProvince: clientsByProvince.map(p => ({
        provinceId: p.provinceId,
        count: p._count
      }))
    });
  } catch (error) {
    console.error('Error fetching PEG admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
