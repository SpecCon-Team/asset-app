import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';
import { invalidateCache } from '../middleware/cache';
import { Role } from '@prisma/client';

const router = Router();

// Validation schema for PEG client
const pegClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  provinceId: z.string().min(1, 'Province is required'),
  clientCode: z.string().optional(), // Accept client code from frontend
});

// Get all PEG clients for the authenticated user
// For ADMIN, TECHNICIAN, and PEG roles, show merged data from all admins and technicians
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let clients;

    // If user is ADMIN, TECHNICIAN, or PEG, show all clients from admins and technicians
    if (userRole === 'ADMIN' || userRole === 'TECHNICIAN' || userRole === 'PEG') {
      try {
        // First, get all users who are admins, technicians, or peg users
        // Try with PEG role first, fallback to just ADMIN and TECHNICIAN if PEG doesn't exist in enum
        let adminTechUsers;
        try {
          adminTechUsers = await prisma.user.findMany({
            where: {
              role: {
                in: [Role.ADMIN, Role.TECHNICIAN, Role.PEG]
              }
            },
            select: { id: true }
          });
        } catch (prismaError: any) {
          // If PEG role doesn't exist in database enum, fallback to just ADMIN and TECHNICIAN
          if (prismaError?.code === 'P2001' || prismaError?.code === 'P2025' || prismaError?.message?.includes('Invalid value') || prismaError?.message?.includes('enum')) {
            console.warn('PEG role not found in database enum, falling back to ADMIN and TECHNICIAN only');
            adminTechUsers = await prisma.user.findMany({
              where: {
                role: {
                  in: [Role.ADMIN, Role.TECHNICIAN]
                }
              },
              select: { id: true }
            });
            // Also include the current user if they are PEG (even if enum doesn't support it yet)
            if (userRole === 'PEG') {
              const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true }
              });
              if (currentUser && !adminTechUsers.find(u => u.id === currentUser.id)) {
                adminTechUsers.push(currentUser);
              }
            }
          } else {
            throw prismaError;
          }
        }

        const userIds = adminTechUsers.map(u => u.id);

        // Handle empty userIds array - if no admin/tech users exist, return empty array
        if (userIds.length === 0) {
          clients = [];
        } else {
          // Get all PEG clients created by any admin, technician, or peg admin
          clients = await prisma.pEGClient.findMany({
            where: {
              userId: {
                in: userIds
              }
            },
            orderBy: { createdAt: 'desc' },
          });
        }
      } catch (queryError: any) {
        console.error('Error querying users for PEG clients:', queryError);
        // Fallback: if query fails, just return empty array or user's own clients
        if (userRole === 'PEG') {
          // For PEG users, try to get their own clients as fallback
          clients = await prisma.pEGClient.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
          });
        } else {
          clients = [];
        }
      }
    } else {
      // Regular users only see their own clients
      clients = await prisma.pEGClient.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(clients);
  } catch (error: any) {
    console.error('Error fetching PEG clients:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    });
    res.status(500).json({ 
      error: 'Failed to fetch PEG clients',
      message: error?.message || 'Unknown error occurred'
    });
  }
});

// Get clients by province
router.get('/province/:provinceId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { provinceId } = req.params;

    const clients = await prisma.pEGClient.findMany({
      where: {
        userId,
        provinceId,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(clients);
  } catch (error) {
    console.error('Error fetching province clients:', error);
    res.status(500).json({ error: 'Failed to fetch province clients' });
  }
});

// Create a new PEG client
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedData = pegClientSchema.parse(req.body);

    // Use provided clientCode, or auto-generate if not provided
    let clientCode = validatedData.clientCode;
    if (!clientCode) {
      const clientCount = await prisma.pEGClient.count();
      clientCode = `CLT-${String(clientCount + 1).padStart(3, '0')}`;
    }

    const client = await prisma.pEGClient.create({
      data: {
        clientCode,
        name: validatedData.name,
        location: validatedData.location,
        contactPerson: validatedData.contactPerson || null,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        provinceId: validatedData.provinceId,
        userId: userId,
      },
    });

    await logAudit(
      req,
      'CREATE',
      'PEGClient',
      client.id,
      { new: client }
    );

    res.status(201).json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating PEG client:', error);
    res.status(500).json({ error: 'Failed to create PEG client' });
  }
});

// Update a PEG client
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const validatedData = pegClientSchema.parse(req.body);

    // Check if the client belongs to the user
    const existingClient = await prisma.pEGClient.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (existingClient.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this client' });
    }

    const updatedClient = await prisma.pEGClient.update({
      where: { id },
      data: {
        ...validatedData,
        email: validatedData.email || null,
        contactPerson: validatedData.contactPerson || null,
        phone: validatedData.phone || null,
      },
    });

    await logAudit(
      req,
      'UPDATE',
      'PEGClient',
      id,
      { old: existingClient, new: updatedClient }
    );

    res.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating PEG client:', error);
    res.status(500).json({ error: 'Failed to update PEG client' });
  }
});

// Delete a PEG client
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if the client belongs to the user
    const existingClient = await prisma.pEGClient.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (existingClient.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this client' });
    }

    await prisma.pEGClient.delete({
      where: { id },
    });

    await logAudit(
      req,
      'DELETE',
      'PEGClient',
      id,
      { deleted: existingClient }
    );

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting PEG client:', error);
    res.status(500).json({ error: 'Failed to delete PEG client' });
  }
});

// Bulk delete all clients for the user
router.delete('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await prisma.pEGClient.deleteMany({
      where: { userId },
    });

    await logAudit(
      req,
      'DELETE',
      'PEGClient',
      'bulk',
      { deletedCount: result.count }
    );

    res.json({ message: `${result.count} clients deleted successfully`, count: result.count });
  } catch (error) {
    console.error('Error deleting all PEG clients:', error);
    res.status(500).json({ error: 'Failed to delete PEG clients' });
  }
});

// Get all assets assigned to a PEG client
router.get('/:clientId/assets', authenticate, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    // Verify client exists
    const client = await prisma.pEGClient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get all assets assigned to this client
    const assets = await prisma.asset.findMany({
      where: {
        pegClientId: clientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(assets);
  } catch (error) {
    console.error('Error fetching client assets:', error);
    res.status(500).json({ error: 'Failed to fetch client assets' });
  }
});

// Assign asset to PEG client
router.post('/:clientId/assets', authenticate, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { assetId } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: 'Asset ID is required' });
    }

    // Verify client exists
    const client = await prisma.pEGClient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Verify asset exists and is available
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Check if asset is already assigned to another client
    if (asset.pegClientId && asset.pegClientId !== clientId) {
      return res.status(400).json({ error: 'Asset is already assigned to another client' });
    }

    // Check if asset status is available
    if (asset.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available for assignment' });
    }

    // Assign asset to client
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        pegClientId: clientId,
        status: 'assigned',
      },
    });

    await logAudit(
      req,
      'UPDATE',
      'Asset',
      assetId,
      { 
        action: 'ASSIGN_TO_PEG_CLIENT',
        clientId,
        old: { pegClientId: asset.pegClientId, status: asset.status },
        new: { pegClientId: updatedAsset.pegClientId, status: updatedAsset.status }
      }
    );

    // Invalidate assets cache to ensure updated data is returned
    invalidateCache('/api/assets');
    invalidateCache('/api/assets/available');

    res.json(updatedAsset);
  } catch (error) {
    console.error('Error assigning asset to client:', error);
    res.status(500).json({ error: 'Failed to assign asset to client' });
  }
});

// Unassign asset from PEG client
router.delete('/:clientId/assets/:assetId', authenticate, async (req: Request, res: Response) => {
  try {
    const { clientId, assetId } = req.params;

    // Verify client exists
    const client = await prisma.pEGClient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Verify asset exists and is assigned to this client
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.pegClientId !== clientId) {
      return res.status(400).json({ error: 'Asset is not assigned to this client' });
    }

    // Unassign asset from client
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        pegClientId: null,
        status: 'available',
      },
    });

    await logAudit(
      req,
      'UPDATE',
      'Asset',
      assetId,
      { 
        action: 'UNASSIGN_FROM_PEG_CLIENT',
        clientId,
        old: { pegClientId: asset.pegClientId, status: asset.status },
        new: { pegClientId: updatedAsset.pegClientId, status: updatedAsset.status }
      }
    );

    // Invalidate assets cache to ensure updated data is returned
    invalidateCache('/api/assets');
    invalidateCache('/api/assets/available');

    res.json({ message: 'Asset unassigned successfully', asset: updatedAsset });
  } catch (error) {
    console.error('Error unassigning asset from client:', error);
    res.status(500).json({ error: 'Failed to unassign asset from client' });
  }
});

export default router;
