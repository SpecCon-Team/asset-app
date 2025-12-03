import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';

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
// For ADMIN, TECHNICIAN, and PEG_ADMIN roles, show merged data from all admins and technicians
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let clients;

    // If user is ADMIN, TECHNICIAN, or PEG_ADMIN, show all clients from admins and technicians
    if (userRole === 'ADMIN' || userRole === 'TECHNICIAN' || userRole === 'PEG_ADMIN') {
      // First, get all users who are admins, technicians, or pegadmins
      const adminTechUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'TECHNICIAN', 'PEG_ADMIN']
          }
        },
        select: { id: true }
      });

      const userIds = adminTechUsers.map(u => u.id);

      // Get all PEG clients created by any admin, technician, or peg admin
      clients = await prisma.pEGClient.findMany({
        where: {
          userId: {
            in: userIds
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Regular users only see their own clients
      clients = await prisma.pEGClient.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(clients);
  } catch (error) {
    console.error('Error fetching PEG clients:', error);
    res.status(500).json({ error: 'Failed to fetch PEG clients' });
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

export default router;
