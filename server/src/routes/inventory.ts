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
// INVENTORY ITEMS ENDPOINTS
// =====================================================

// GET /api/inventory - List all inventory items
router.get('/', authenticate, async (req: any, res) => {
  try {
    const {
      search,
      category,
      status,
      page = '1',
      limit = '50',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { itemCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status === 'low') {
      where.currentStock = { lte: prisma.inventoryItem.fields.reorderPoint };
    } else if (status === 'out') {
      where.currentStock = 0;
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          createdBy: {
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
      prisma.inventoryItem.count({ where })
    ]);

    // Calculate stock status for each item
    const itemsWithStatus = items.map(item => ({
      ...item,
      stockStatus:
        item.currentStock <= 0 ? 'out_of_stock' :
        item.currentStock <= item.reorderPoint ? 'reorder_now' :
        item.currentStock <= item.minimumStock ? 'low_stock' : 'sufficient'
    }));

    res.json({
      items: itemsWithStatus,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory items',
      message: error.message
    });
  }
});

// GET /api/inventory/low-stock - Get low stock items
router.get('/low-stock', authenticate, async (req: any, res) => {
  try {
    const items = await prisma.$queryRaw`
      SELECT * FROM "LowStockItems"
    `;

    res.json({ items });
  } catch (error: any) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      error: 'Failed to fetch low stock items',
      message: error.message
    });
  }
});

// GET /api/inventory/stats - Get inventory statistics
router.get('/stats', authenticate, async (req: any, res) => {
  try {
    const [
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
      categories,
      recentTransactions
    ] = await Promise.all([
      prisma.inventoryItem.count({ where: { isActive: true } }),

      prisma.$queryRaw`
        SELECT COALESCE(SUM("currentStock" * "unitPrice"), 0) as total
        FROM "InventoryItem"
        WHERE "isActive" = true AND "unitPrice" IS NOT NULL
      `,

      prisma.inventoryItem.count({
        where: {
          isActive: true,
          currentStock: { lte: prisma.inventoryItem.fields.minimumStock }
        }
      }),

      prisma.inventoryItem.count({
        where: {
          isActive: true,
          currentStock: 0
        }
      }),

      prisma.inventoryItem.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true
      }),

      prisma.stockTransaction.count({
        where: {
          transactionDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    // Convert BigInt values to numbers for JSON serialization
    const response = {
      totalItems,
      totalValue: Number(totalValue[0]?.total || 0),
      lowStockCount,
      outOfStockCount,
      categories: convertBigIntsToNumbers(categories),
      recentTransactions: convertBigIntsToNumbers(recentTransactions)
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory statistics',
      message: error.message
    });
  }
});

// GET /api/inventory/:id - Get single inventory item
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: {
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            supplier: {
              select: {
                id: true,
                name: true,
                supplierCode: true
              }
            }
          },
          orderBy: {
            transactionDate: 'desc'
          },
          take: 50
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const stockStatus =
      item.currentStock <= 0 ? 'out_of_stock' :
      item.currentStock <= item.reorderPoint ? 'reorder_now' :
      item.currentStock <= item.minimumStock ? 'low_stock' : 'sufficient';

    res.json({
      ...item,
      stockStatus
    });
  } catch (error: any) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory item',
      message: error.message
    });
  }
});

// POST /api/inventory - Create new inventory item
router.post('/', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const {
      itemCode,
      name,
      description,
      category,
      subcategory,
      unit,
      unitPrice,
      currentStock,
      minimumStock,
      maximumStock,
      reorderPoint,
      reorderQuantity,
      location,
      barcode,
      manufacturer,
      tags,
      imageUrl
    } = req.body;

    // Validate required fields
    if (!itemCode || !name || !category || !unit) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'itemCode, name, category, and unit are required'
      });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        itemCode,
        name,
        description,
        category,
        subcategory,
        unit,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        currentStock: currentStock || 0,
        minimumStock: minimumStock || 0,
        maximumStock: maximumStock ? parseInt(maximumStock) : null,
        reorderPoint: reorderPoint || 0,
        reorderQuantity: reorderQuantity || 0,
        location,
        barcode,
        manufacturer,
        tags,
        imageUrl,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log audit
    await logAudit(req.user.id, 'CREATE', 'InventoryItem', item.id, {
      itemCode,
      name,
      category
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      item
    });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Item already exists',
        message: 'An item with this code or barcode already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create inventory item',
      message: error.message
    });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      subcategory,
      unit,
      unitPrice,
      minimumStock,
      maximumStock,
      reorderPoint,
      reorderQuantity,
      location,
      manufacturer,
      tags,
      imageUrl,
      isActive
    } = req.body;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        description,
        category,
        subcategory,
        unit,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        minimumStock: minimumStock ? parseInt(minimumStock) : undefined,
        maximumStock: maximumStock ? parseInt(maximumStock) : undefined,
        reorderPoint: reorderPoint ? parseInt(reorderPoint) : undefined,
        reorderQuantity: reorderQuantity ? parseInt(reorderQuantity) : undefined,
        location,
        manufacturer,
        tags,
        imageUrl,
        isActive,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log audit
    await logAudit(req.user.id, 'UPDATE', 'InventoryItem', id, req.body);

    res.json({
      message: 'Inventory item updated successfully',
      item
    });
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      error: 'Failed to update inventory item',
      message: error.message
    });
  }
});

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;

    await prisma.inventoryItem.delete({
      where: { id }
    });

    // Log audit
    await logAudit(req.user.id, 'DELETE', 'InventoryItem', id, {});

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      error: 'Failed to delete inventory item',
      message: error.message
    });
  }
});

// =====================================================
// STOCK TRANSACTIONS ENDPOINTS
// =====================================================

// POST /api/inventory/:id/transaction - Create stock transaction
router.post('/:id/transaction', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      transactionType,
      quantity,
      unitPrice,
      reference,
      notes,
      supplierId,
      issuedToId,
      issuedToAssetId
    } = req.body;

    if (!transactionType || !quantity) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'transactionType and quantity are required'
      });
    }

    // Get current item
    const item = await prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const quantityNum = parseInt(quantity);
    const balanceBefore = item.currentStock;

    let balanceAfter = balanceBefore;
    if (['purchase', 'adjustment_in', 'return'].includes(transactionType)) {
      balanceAfter = balanceBefore + quantityNum;
    } else if (['issue', 'adjustment_out', 'waste', 'damaged'].includes(transactionType)) {
      balanceAfter = balanceBefore - quantityNum;
    }

    const totalCost = unitPrice ? parseFloat(unitPrice) * quantityNum : null;

    // Create transaction
    const transaction = await prisma.stockTransaction.create({
      data: {
        itemId: id,
        transactionType,
        quantity: quantityNum,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        totalCost,
        balanceBefore,
        balanceAfter,
        reference,
        notes,
        supplierId,
        issuedToId,
        issuedToAssetId,
        performedById: req.user.id
      },
      include: {
        item: true,
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log audit
    await logAudit(req.user.id, 'STOCK_TRANSACTION', 'StockTransaction', transaction.id, {
      itemId: id,
      transactionType,
      quantity,
      balanceAfter
    });

    res.status(201).json({
      message: 'Stock transaction created successfully',
      transaction
    });
  } catch (error: any) {
    console.error('Error creating stock transaction:', error);
    res.status(500).json({
      error: 'Failed to create stock transaction',
      message: error.message
    });
  }
});

// GET /api/inventory/:id/transactions - Get transactions for item
router.get('/:id/transactions', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { limit = '100' } = req.query;

    const transactions = await prisma.stockTransaction.findMany({
      where: { itemId: id },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true
          }
        },
        issuedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        transactionDate: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({ transactions });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message
    });
  }
});

// =====================================================
// SUPPLIERS ENDPOINTS
// =====================================================

// GET /api/inventory/suppliers - List all suppliers
router.get('/suppliers/list', authenticate, async (req: any, res) => {
  try {
    const { search, active } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { supplierCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            purchaseOrders: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ suppliers });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      error: 'Failed to fetch suppliers',
      message: error.message
    });
  }
});

// POST /api/inventory/suppliers - Create supplier
router.post('/suppliers/create', authenticate, requireRole(['ADMIN', 'TECHNICIAN']), async (req: any, res) => {
  try {
    const {
      supplierCode,
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      country,
      notes
    } = req.body;

    if (!supplierCode || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'supplierCode and name are required'
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        country,
        notes,
        createdById: req.user.id
      }
    });

    await logAudit(req.user.id, 'CREATE', 'Supplier', supplier.id, { supplierCode, name });

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier
    });
  } catch (error: any) {
    console.error('Error creating supplier:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Supplier already exists',
        message: 'A supplier with this code already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create supplier',
      message: error.message
    });
  }
});

// =====================================================
// ALERTS ENDPOINTS
// =====================================================

// GET /api/inventory/alerts - Get stock alerts
router.get('/alerts/list', authenticate, async (req: any, res) => {
  try {
    const { resolved } = req.query;

    const where: any = {};

    if (resolved !== undefined) {
      where.resolved = resolved === 'true';
    }

    const alerts = await prisma.stockAlert.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            itemCode: true,
            name: true,
            currentStock: true,
            reorderPoint: true
          }
        },
        acknowledgedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        triggeredAt: 'desc'
      },
      take: 100
    });

    res.json({ alerts });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// POST /api/inventory/alerts/:id/acknowledge - Acknowledge alert
router.post('/alerts/:id/acknowledge', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;

    const alert = await prisma.stockAlert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedById: req.user.id,
        acknowledgedAt: new Date()
      }
    });

    res.json({
      message: 'Alert acknowledged successfully',
      alert
    });
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

export default router;
