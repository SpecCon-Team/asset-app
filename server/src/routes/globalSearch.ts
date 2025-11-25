import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Global search across all modules
router.get('/global', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const searchQuery = String(q || '').trim();

    if (searchQuery.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Search assets
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { asset_code: { contains: searchQuery, mode: 'insensitive' } },
          { serial_number: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        asset_code: true,
        status: true,
      },
    });

    // Search tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { number: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
      },
    });

    // Search inventory items
    const inventory = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { itemCode: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        itemCode: true,
        name: true,
        currentStock: true,
      },
    });

    // Search users (only if admin)
    let users = [];
    if (req.user?.role === 'ADMIN') {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    }

    res.json({
      assets,
      tickets,
      inventory,
      users,
      totalResults: assets.length + tickets.length + inventory.length + users.length,
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

export default router;
