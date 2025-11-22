import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { applyFieldVisibility } from '../middleware/fieldVisibility';
import { validateFieldUpdates, Role } from '../lib/permissions';
import { logAudit } from '../lib/auditLog';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to generate unique asset code
async function generateAssetCode(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const code = `AST-${timestamp}-${random}`;

  // Check if code already exists (very unlikely but just in case)
  const existing = await prisma.asset.findUnique({
    where: { asset_code: code }
  });

  if (existing) {
    // Recursively try again if duplicate found
    return generateAssetCode();
  }

  return code;
}

// Helper to transform empty strings to null
const emptyStringToNull = z.string().transform(val => val === '' ? null : val).nullable().optional();

// Validation schema - asset_code is now optional (will be auto-generated)
const createSchema = z.object({
  asset_code: z.string().optional(),
  name: z.string(),
  serial_number: emptyStringToNull,
  remote_id: emptyStringToNull,
  asset_type: emptyStringToNull,
  condition: emptyStringToNull,
  status: z.string().default('available'),
  assigned_to: emptyStringToNull,
  scanned_by: emptyStringToNull,
  scan_datetime: emptyStringToNull,
  description: emptyStringToNull,
  ownership: emptyStringToNull,
  office_location: emptyStringToNull,
  extension: emptyStringToNull,
  deskphones: emptyStringToNull,
  mouse: emptyStringToNull,
  keyboard: emptyStringToNull,
  department: emptyStringToNull,
  notes: emptyStringToNull,
  ownerId: emptyStringToNull,
});

const updateSchema = createSchema.partial();

// GET /api/assets - List all assets
router.get('/', authenticate, cacheMiddleware(30000), applyFieldVisibility('asset'), async (req: AuthRequest, res) => {
  try {
    console.log('Assets GET request received');
    const search = (req.query.search as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const ownerId = (req.query.ownerId as string) || undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : -1;

    // Regular users can only see their own assets, admins/technicians see all
    const whereClause: any = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { asset_code: { contains: search, mode: 'insensitive' } },
            { asset_type: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        status ? { status } : {},
        ownerId ? { ownerId } : {},
      ],
    };

    // All users can view all assets (permissions control what they can edit)

    // Calculate pagination
    const skip = limit === -1 ? undefined : (page - 1) * limit;
    const take = limit === -1 ? undefined : limit;

    // Get total count for pagination metadata
    const totalCount = await prisma.asset.count({ where: whereClause });

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    console.log(`Found ${assets.length} assets (total: ${totalCount})`);

    // Return with pagination metadata
    res.json({
      data: assets,
      pagination: limit === -1 ? null : {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/assets error:', error);
    res.status(500).json({ message: 'Failed to fetch assets', error: String(error) });
  }
});

// GET /api/assets/:id - Get single asset
router.get('/:id', authenticate, applyFieldVisibility('asset'), async (req: AuthRequest, res) => {
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

    // Check if user has access to this asset
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TECHNICIAN' && asset.ownerId !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(asset);
  } catch (error) {
    console.error('GET /api/assets/:id error:', error);
    res.status(500).json({ message: 'Failed to fetch asset', error: String(error) });
  }
});

// POST /api/assets - Create new asset (ADMIN or TECHNICIAN only)
router.post('/', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    console.log('POST /api/assets - Request body:', req.body);

    const validatedData = createSchema.parse(req.body);

    // Auto-generate asset code if not provided
    if (!validatedData.asset_code) {
      validatedData.asset_code = await generateAssetCode();
    }

    const asset = await prisma.asset.create({
      data: validatedData as any,
    });

    // Log audit trail
    await logAudit(req, 'CREATE', 'Asset', asset.id, undefined, {
      assetCode: asset.asset_code,
      name: asset.name,
    });

    // Invalidate cache
    invalidateCache('/api/assets');

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

// PUT /api/assets/:id - Update asset (ADMIN or TECHNICIAN only)
router.put('/:id', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    console.log('PUT /api/assets/:id - User:', req.user?.email, 'Role:', req.user?.role);
    console.log('PUT /api/assets/:id - Request body:', req.body);

    const validatedData = updateSchema.parse(req.body);

    // Check field-level permissions
    const userRole = req.user!.role as Role;
    const permissionCheck = validateFieldUpdates(userRole, 'asset', validatedData);

    if (!permissionCheck.valid) {
      console.error('Permission denied for fields:', permissionCheck.invalidFields);
      return res.status(403).json({
        message: 'You do not have permission to update some fields',
        invalidFields: permissionCheck.invalidFields
      });
    }

    // Get old asset data for audit trail
    const oldAsset = await prisma.asset.findUnique({
      where: { id: req.params.id },
    });

    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: validatedData,
    });

    // Invalidate cache
    invalidateCache('/api/assets');

    // Log audit trail
    await logAudit(req, 'UPDATE', 'Asset', asset.id, validatedData, {
      assetCode: asset.asset_code,
      name: asset.name,
      oldData: oldAsset,
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

// DELETE /api/assets/:id - Delete asset (ADMIN only)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    // Get asset data before deletion for audit trail
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
    });

    await prisma.asset.delete({
      where: { id: req.params.id },
    });

    // Log audit trail
    if (asset) {
      await logAudit(req, 'DELETE', 'Asset', asset.id, undefined, {
        assetCode: asset.asset_code,
        name: asset.name,
      });
    }

    console.log('Asset deleted:', req.params.id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/assets/:id error:', error);
    res.status(500).json({ message: 'Failed to delete asset', error: String(error) });
  }
});

// POST /api/assets/bulk - Bulk create assets (for CSV import)
// POST /api/assets/import-csv - Import assets from CSV (ADMIN or TECHNICIAN only)
router.post('/import-csv', authenticate, requireRole('ADMIN', 'TECHNICIAN'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');

    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Parsed ${records.length} records from CSV`);

    // Transform CSV data to match asset schema
    const assetsData = records.map((record: any) => ({
      asset_code: record['Asset Code (Required)'] || record['Asset Code'] || undefined,
      name: record['Name (Required)'] || record['Name'],
      asset_type: record['Asset Type'] || null,
      serial_number: record['Serial Number'] || null,
      manufacturer: record['Manufacturer'] || null,
      model_number: record['Model Number'] || null,
      status: record['Status (available/assigned/maintenance/repair/retired)'] || record['Status'] || 'available',
      condition: record['Condition (new/good/fair/poor)'] || record['Condition'] || null,
      purchase_date: record['Purchase Date (YYYY-MM-DD)'] || record['Purchase Date'] || null,
      purchase_price: record['Purchase Price'] || null,
      warranty_expiry: record['Warranty Expiry (YYYY-MM-DD)'] || record['Warranty Expiry'] || null,
      office_location: record['Office Location'] || null,
      department: record['Department'] || null,
      notes: record['Notes'] || null,
    }));

    // Validate the data
    const validatedData = z.array(createSchema).parse(assetsData);

    // Auto-generate asset codes for any missing ones
    const assetsWithCodes = await Promise.all(
      validatedData.map(async (asset) => ({
        ...asset,
        asset_code: asset.asset_code || await generateAssetCode(),
      }))
    );

    // Create assets
    const result = await prisma.asset.createMany({
      data: assetsWithCodes as any,
      skipDuplicates: true,
    });

    console.log(`Successfully imported ${result.count} assets from CSV`);
    res.status(201).json({
      count: result.count,
      message: `Successfully imported ${result.count} assets`,
      total: records.length,
    });
  } catch (error) {
    console.error('POST /api/assets/import-csv error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error in CSV data',
        errors: error.errors
      });
    }

    res.status(500).json({
      message: 'Failed to import assets from CSV',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post('/bulk', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    console.log('POST /api/assets/bulk - Request body:', req.body);

    const assetsData = z.array(createSchema).parse(req.body);

    // Auto-generate asset codes for any missing ones
    const assetsWithCodes = await Promise.all(
      assetsData.map(async (asset) => ({
        ...asset,
        asset_code: asset.asset_code || await generateAssetCode(),
      }))
    );

    const assets = await prisma.asset.createMany({
      data: assetsWithCodes as any,
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