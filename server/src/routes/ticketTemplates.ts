import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';

const router = Router();

// Validation schema
const templateSchema = z.object({
  name: z.string().nonempty('Name is required'),
  description: z.string().optional(),
  title: z.string().nonempty('Title is required'),
  ticketDescription: z.string().nonempty('Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  assignedToId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

// Get all templates
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category, isActive } = req.query;

    const whereClause: any = {};

    // Filter by category if provided
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Filter by active status (default to active only)
    if (isActive !== 'false') {
      whereClause.isActive = true;
    }

    const templates = await prisma.ticketTemplate.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.ticketTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    res.status(500).json({ message: 'Failed to fetch template' });
  }
});

// Create template (Admin/Technician only)
router.post('/', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  try {
    const template = await prisma.ticketTemplate.create({
      data: {
        ...parsed.data,
        createdById: req.user!.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit trail
    await logAudit(req, 'CREATE', 'TicketTemplate', template.id, undefined, {
      name: template.name,
      category: template.category,
    });

    console.log(`✅ Created ticket template: ${template.name}`);
    res.status(201).json(template);
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
});

// Update template (Admin/Technician only)
router.patch('/:id', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  const parsed = templateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  try {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await prisma.ticketTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check permission (creator or admin can edit)
    if (
      req.user!.role !== 'ADMIN' &&
      existingTemplate.createdById !== req.user!.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const template = await prisma.ticketTemplate.update({
      where: { id },
      data: parsed.data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit trail
    await logAudit(req, 'UPDATE', 'TicketTemplate', template.id, existingTemplate, {
      name: template.name,
      changes: parsed.data,
    });

    console.log(`✅ Updated ticket template: ${template.name}`);
    res.json(template);
  } catch (error) {
    console.error('Failed to update template:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
});

// Delete template (Admin/Technician only)
router.delete('/:id', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await prisma.ticketTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check permission (creator or admin can delete)
    if (
      req.user!.role !== 'ADMIN' &&
      existingTemplate.createdById !== req.user!.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.ticketTemplate.delete({
      where: { id },
    });

    // Log audit trail
    await logAudit(req, 'DELETE', 'TicketTemplate', id, existingTemplate, {
      name: existingTemplate.name,
    });

    console.log(`✅ Deleted ticket template: ${existingTemplate.name}`);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
});

// Archive/restore template
router.patch('/:id/archive', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const template = await prisma.ticketTemplate.update({
      where: { id },
      data: { isActive },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit trail
    await logAudit(req, 'UPDATE', 'TicketTemplate', id, undefined, {
      name: template.name,
      action: isActive ? 'restored' : 'archived',
    });

    console.log(`✅ ${isActive ? 'Restored' : 'Archived'} template: ${template.name}`);
    res.json(template);
  } catch (error) {
    console.error('Failed to archive/restore template:', error);
    res.status(500).json({ message: 'Failed to update template status' });
  }
});

// Get template categories (for filtering)
router.get('/meta/categories', authenticate, async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.ticketTemplate.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    const categories = templates
      .map((t) => t.category)
      .filter((c): c is string => c !== null)
      .sort();

    res.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Use template - create ticket from template
router.post('/:id/use', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { assetId } = req.body;

    const template = await prisma.ticketTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (!template.isActive) {
      return res.status(400).json({ message: 'Template is archived' });
    }

    // Generate unique ticket number
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const number = `TKT-${timestamp}-${randomSuffix}`;

    // Create ticket from template
    const ticket = await prisma.ticket.create({
      data: {
        number,
        title: template.title,
        description: template.ticketDescription,
        priority: template.priority,
        createdById: req.user!.id,
        assignedToId: template.assignedToId,
        assetId: assetId || null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        asset: true,
      },
    });

    // Log audit trail
    await logAudit(req, 'CREATE', 'Ticket', ticket.id, undefined, {
      ticketNumber: ticket.number,
      fromTemplate: template.name,
      templateId: template.id,
    });

    console.log(`✅ Created ticket from template: ${template.name} -> ${ticket.number}`);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Failed to create ticket from template:', error);
    res.status(500).json({ message: 'Failed to create ticket from template' });
  }
});

export default router;
