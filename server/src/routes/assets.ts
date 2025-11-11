import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// Validation schema
const createSchema = z.object({
  asset_code: z.string(),
  name: z.string(),
  asset_type: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  status: z.string().default('available'),
  assigned_to: z.string().optional().nullable(),
  scanned_by: z.string().optional().nullable(),
  scan_datetime: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  ownership: z.string().optional().nullable(),
  office_location: z.string().optional().nullable(),
  extension: z.string().optional().nullable(),
  deskphones: z.string().optional().nullable(),
  mouse: z.string().optional().nullable(),
  keyboard: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial();

// GET /api/assets - List all assets
router.get('/', async (req, res) => {
  try {
    console.log('Assets GET request received');
    const search = (req.query.search as string) || undefined;
    const status = (req.query.status as string) || undefined;
    
    const assets = await prisma.asset.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { asset_code: { contains: search, mode: 'insensitive' } },
              { asset_type: { contains: search, mode: 'insensitive' } },
            ],
          } : {},
          status ? { status } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`Found ${assets.length} assets`);
    res.json(assets);
  } catch (error) {
    console.error('GET /api/assets error:', error);
    res.status(500).json({ message: 'Failed to fetch assets', error: String(error) });
  }
});

// GET /api/assets/:id - Get single asset
router.get('/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        tickets: true,
      },
    });
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    console.error('GET /api/assets/:id error:', error);
    res.status(500).json({ message: 'Failed to fetch asset', error: String(error) });
  }
});

// POST /api/assets - Create new asset
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/assets - Request body:', req.body);
    
    const validatedData = createSchema.parse(req.body);
    
    const asset = await prisma.asset.create({
      data: validatedData,
    });
    
    console.log('Asset created:', asset);
    res.status(201).json(asset);
  } catch (error) {
    console.error('POST /api/assets error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to create asset', error: String(error) });
  }
});

// PUT /api/assets/:id - Update asset
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/assets/:id - Request body:', req.body);
    
    const validatedData = updateSchema.parse(req.body);
    
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: validatedData,
    });
    
    console.log('Asset updated:', asset);
    res.json(asset);
  } catch (error) {
    console.error('PUT /api/assets/:id error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to update asset', error: String(error) });
  }
});

// DELETE /api/assets/:id - Delete asset
router.delete('/:id', async (req, res) => {
  try {
    await prisma.asset.delete({
      where: { id: req.params.id },
    });
    
    console.log('Asset deleted:', req.params.id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/assets/:id error:', error);
    res.status(500).json({ message: 'Failed to delete asset', error: String(error) });
  }
});

// POST /api/assets/bulk - Bulk create assets (for CSV import)
router.post('/bulk', async (req, res) => {
  try {
    console.log('POST /api/assets/bulk - Request body:', req.body);
    
    const assetsData = z.array(createSchema).parse(req.body);
    
    const assets = await prisma.asset.createMany({
      data: assetsData,
      skipDuplicates: true,
    });
    
    console.log(`Bulk created ${assets.count} assets`);
    res.status(201).json({ count: assets.count, message: `Created ${assets.count} assets` });
  } catch (error) {
    console.error('POST /api/assets/bulk error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to bulk create assets', error: String(error) });
  }
});

export default router;