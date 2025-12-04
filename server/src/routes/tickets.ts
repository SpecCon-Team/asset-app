import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';
import { applyFieldVisibility } from '../middleware/fieldVisibility';
import { validateFieldUpdates, Role } from '../lib/permissions';
import { whatsappService } from '../lib/whatsapp';
import { createNotificationIfNotExists } from '../lib/notificationHelper';
import { workflowEngine } from '../lib/workflowEngine';
import { autoAssignmentEngine } from '../lib/autoAssignment';
import { slaEngine } from '../lib/slaEngine';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

// Type for ticket with all relations - matches what we actually fetch
type TicketWithAllRelations = {
  id: string;
  number: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  resolution: string;
  createdById: string;
  assignedToId: string | null;
  assetId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; email: string; name: string | null; role: string } | null;
  assignedTo: { id: string; email: string; name: string | null } | null;
  asset: any | null;
};

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const createSchema = z.object({
  title: z.string().nonempty("Title is required"),
  description: z.string().nonempty("Description is required"),
  priority: z.string().default('medium'),
  createdById: z.string().nonempty("createdById is required"),
  assetId: z.string().nullable().optional(),
});

router.get('/', authenticate, cacheMiddleware(20000), applyFieldVisibility('ticket'), async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '100' } = req.query;

    // Users see their own tickets, admins/technicians see all tickets
    const whereClause: any = {};

    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TECHNICIAN') {
      whereClause.createdById = req.user?.id;
    }

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalCount = await prisma.ticket.count({ where: whereClause });

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
        asset: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: limitNum === -1 ? undefined : skip,  // -1 means no pagination
      take: limitNum === -1 ? undefined : limitNum
    });

    // Return with pagination metadata
    res.json({
      data: tickets,
      pagination: limitNum === -1 ? null : {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

router.get('/:id', authenticate, applyFieldVisibility('ticket'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by ticket number if it starts with TKT-
    let ticket;
    if (id.startsWith('TKT-')) {
      ticket = await prisma.ticket.findUnique({
        where: { number: id },
        include: { createdBy: true, assignedTo: true, asset: true },
      });
    } else {
      ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { createdBy: true, assignedTo: true, asset: true },
      });
    }

    if (!ticket) return res.status(404).json({ message: 'Not found' });

    // Check if user has access to this ticket
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TECHNICIAN') {
      if (ticket.createdById !== req.user?.id && ticket.assignedToId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(ticket);
  } catch (error) {
    console.error('Failed to fetch ticket:', error);
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    // Generate a unique ticket number with milliseconds and random suffix
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const number = `TKT-${timestamp}-${randomSuffix}`;

    // Create the ticket
    const ticket: TicketWithAllRelations = await prisma.ticket.create({
      data: {
        number: number,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        createdById: parsed.data.createdById,
        assetId: parsed.data.assetId,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true, role: true },
        },
        assignedTo: { select: { id: true, email: true, name: true } },
        asset: true,
      },
    });

    // Notify all admins and technicians about the new ticket
    const adminsAndTechs = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'TECHNICIAN'],
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Create notifications for all admins/technicians
    const notificationPromises = adminsAndTechs.map(admin =>
      prisma.notification.create({
        data: {
          type: 'ticket_status',
          title: 'New ticket created',
          message: `${ticket.createdBy.name || ticket.createdBy.email} created a new ticket: "${ticket.title}"`, 
          userId: admin.id,
          senderId: ticket.createdById,
          ticketId: ticket.id,
        },
      })
    );

    await Promise.all(notificationPromises);
    console.log(`✅ Created notifications for ${adminsAndTechs.length} admins/technicians`);

    // Log audit trail
    await logAudit(req, 'CREATE', 'Ticket', ticket.id, undefined, {
      ticketNumber: ticket.number,
      title: ticket.title,
      priority: ticket.priority,
    });

    // Execute workflow automation (async - don't wait)
    workflowEngine.executeWorkflows('ticket', 'created', ticket.id, ticket).catch(err => {
      console.error('Workflow execution error:', err);
    });

    // Create SLA tracker
    slaEngine.createSLA(ticket.id).catch(err => {
      console.error('SLA creation error:', err);
    });

    // Auto-assign ticket if enabled
    autoAssignmentEngine.autoAssignTicket(ticket.id).catch(err => {
      console.error('Auto-assignment error:', err);
    });

    // Invalidate cache
    invalidateCache('/api/tickets');
    invalidateCache('/api/notifications');

    res.json(ticket);
  } catch (error) {
    console.error('Failed to create ticket:', error);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
});

router.patch('/bulk', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: Request, res: Response) => {
  const schema = z.object({
    ticketIds: z.array(z.string()),
    updates: z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      assignedToId: z.string().nullable().optional(),
    }),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    await prisma.ticket.updateMany({
      where: { id: { in: parsed.data.ticketIds } },
      data: parsed.data.updates,
    });

    const updatedTickets = await prisma.ticket.findMany({
      where: { id: { in: parsed.data.ticketIds } },
      include: {
        createdBy: { select: { id: true, email: true } },
        assignedTo: { select: { id: true, email: true } },
        asset: true,
      },
    });

    // Invalidate cache
    invalidateCache('/api/tickets');

    res.json(updatedTickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tickets' });
  }
});

router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const parsed = createSchema.partial().extend({
    status: z.string().optional(),
    resolution: z.string().optional(),
    assignedToId: z.string().nullable().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const { id } = req.params;

    // Get the current ticket data before update
    // Try to find by ID first, then by ticket number if it starts with TKT-
    let oldTicket;
    if (id.startsWith('TKT-')) {
      oldTicket = await prisma.ticket.findUnique({
        where: { number: id },
        include: { createdBy: true, assignedTo: true },
      });
    } else {
      oldTicket = await prisma.ticket.findUnique({
        where: { id },
        include: { createdBy: true, assignedTo: true },
      });
    }

    if (!oldTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has permission to update this ticket
    // Creator, assigned technician, or admin can update
    const isCreator = oldTicket.createdById === req.user?.id;
    const isAssignedTech = oldTicket.assignedToId === req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';
    const isTechnician = req.user?.role === 'TECHNICIAN';

    if (!isCreator && !isAssignedTech && !isAdmin && !isTechnician) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check field-level permissions
    const userRole = req.user!.role as Role;
    const permissionCheck = validateFieldUpdates(userRole, 'ticket', parsed.data);

    if (!permissionCheck.valid) {
      return res.status(403).json({
        message: 'You do not have permission to update some fields',
        invalidFields: permissionCheck.invalidFields
      });
    }

    // Update the ticket (use the actual database ID from oldTicket)
    const ticket: TicketWithAllRelations = await prisma.ticket.update({
      where: { id: oldTicket.id },
      data: parsed.data,
      include: { createdBy: true, assignedTo: true, asset: true },
    });

    // Send notification if status changed
    if (parsed.data.status && oldTicket && parsed.data.status !== oldTicket.status) {
      // Notify the ticket creator
      await createNotificationIfNotExists({
        type: 'ticket_status',
        title: 'Ticket status updated',
        message: `Your ticket status has been changed from "${oldTicket.status}" to "${parsed.data.status}"`, 
        userId: ticket.createdById,
        senderId: ticket.assignedToId,
        ticketId: ticket.id,
      });

      // Send WhatsApp notification if ticket is resolved or closed
      if (parsed.data.status === 'resolved' || parsed.data.status === 'closed') {
        const creator = await prisma.user.findUnique({
          where: { id: ticket.createdById },
          select: {
            id: true,
            name: true,
            phone: true,
            isWhatsAppUser: true,
            whatsAppNotifications: true
          }
        });

        // Send WhatsApp notification if user is a WhatsApp user and has notifications enabled
        if (creator && creator.isWhatsAppUser && creator.whatsAppNotifications && creator.phone) {
          console.log(`📱 Sending WhatsApp notification for ticket ${ticket.number} to ${creator.phone}`);

          const statusEmoji = parsed.data.status === 'resolved' ? '✅' : '🔒';
          const statusText = parsed.data.status === 'resolved' ? 'RESOLVED' : 'CLOSED';

          await whatsappService.sendTextMessage({
            to: creator.phone,
            message: `${statusEmoji} *Ticket ${statusText}*

📋 Ticket #${ticket.number}
📌 Title: ${ticket.title}
📊 Status: ${statusText}
${ticket.resolution ? `\n📝 Resolution: ${ticket.resolution}` : ''}

${parsed.data.status === 'resolved'
  ? 'Your issue has been resolved! If you have any concerns, you can reopen this ticket.'
  : 'Your ticket has been closed. Thank you for using our support service!'}

🔗 View details: ${process.env.CLIENT_URL || 'https://yourdomain.com'}/tickets

Type *MENU* for more options.`,
          });

          console.log(`✅ WhatsApp notification sent for ticket ${ticket.number}`);
        }
      }

      // Notify all admins when ticket is closed
      if (parsed.data.status === 'closed') {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });

        const adminNotifications = admins.map(admin =>
          createNotificationIfNotExists({
            type: 'ticket_status',
            title: 'Ticket closed',
            message: `${ticket.assignedTo?.name || 'A technician'} closed ticket: "${ticket.title}" (${ticket.number})`, 
            userId: admin.id,
            senderId: ticket.assignedToId,
            ticketId: ticket.id,
          })
        );

        await Promise.all(adminNotifications);
      }
    }

    // Send notification if ticket was assigned
    if (parsed.data.assignedToId && oldTicket && parsed.data.assignedToId !== oldTicket.assignedToId) {
      // Notify the ticket creator
      await createNotificationIfNotExists({
        type: 'ticket_assigned',
        title: 'Ticket assigned',
        message: `Your ticket has been assigned to ${ticket.assignedTo?.name || ticket.assignedTo?.email || 'a technician'}`, 
        userId: ticket.createdById,
        senderId: parsed.data.assignedToId,
        ticketId: ticket.id,
      });

      // Notify the assigned technician
      if (parsed.data.assignedToId) {
        await createNotificationIfNotExists({
          type: 'ticket_assigned',
          title: 'New ticket assigned to you',
          message: `You have been assigned to ticket: ${ticket.title}`, 
          userId: parsed.data.assignedToId,
          senderId: ticket.createdById,
          ticketId: ticket.id,
        });
      }
    }

    // Trigger workflows based on what changed
    if (parsed.data.status && parsed.data.status !== oldTicket.status) {
      // Status changed workflow
      workflowEngine.executeWorkflows('ticket', 'status_changed', ticket.id, ticket, oldTicket).catch(err => {
        console.error('Workflow execution error:', err);
      });

      // Record SLA events
      if (parsed.data.status === 'resolved' || parsed.data.status === 'closed') {
        slaEngine.recordResolution(ticket.id).catch(err => {
          console.error('SLA resolution recording error:', err);
        });
      }
    }

    if (parsed.data.assignedToId && parsed.data.assignedToId !== oldTicket.assignedToId) {
      // Assignment changed workflow
      workflowEngine.executeWorkflows('ticket', 'assigned', ticket.id, ticket, oldTicket).catch(err => {
        console.error('Workflow execution error:', err);
      });
    }

    if (parsed.data.priority && parsed.data.priority !== oldTicket.priority) {
      // Priority changed workflow
      workflowEngine.executeWorkflows('ticket', 'priority_changed', ticket.id, ticket, oldTicket).catch(err => {
        console.error('Workflow execution error:', err);
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Failed to update ticket:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

// Bulk delete tickets (general - first instance)
router.delete('/bulk', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const schema = z.object({
    ticketIds: z.array(z.string()),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const { ticketIds } = parsed.data;

    // Get ticket details before deletion for audit log
    const ticketsToDelete = await prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
      select: {
        id: true,
        number: true,
        title: true,
        createdById: true,
      },
    });

    // Delete related records first (due to foreign key constraints)
    await prisma.notification.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.comment.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.attachment.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.ticketSLA.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.workflowExecution.deleteMany({
      where: { entityType: 'ticket', entityId: { in: ticketIds } },
    });

    // Delete the tickets
    await prisma.ticket.deleteMany({
      where: { id: { in: ticketIds } },
    });

    // Log audit trail
    await logAudit(req, 'DELETE', 'Ticket', 'BULK', undefined, {
      action: 'bulk_delete',
      count: ticketIds.length,
      tickets: ticketsToDelete,
    });

    console.log(`✅ Bulk deleted ${ticketIds.length} tickets`);
    res.json({
      message: `Successfully deleted ${ticketIds.length} tickets`,
      count: ticketIds.length,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Failed to delete tickets' });
  }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find the ticket first to get the actual database ID
    let ticket;
    if (id.startsWith('TKT-')) {
      ticket = await prisma.ticket.findUnique({
        where: { number: id },
        select: { id: true },
      });
    } else {
      ticket = await prisma.ticket.findUnique({
        where: { id },
        select: { id: true },
      });
    }

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticketId = ticket.id;

    // Delete related notifications first
    await prisma.notification.deleteMany({
      where: { ticketId },
    });

    // Delete related comments
    await prisma.comment.deleteMany({
      where: { ticketId },
    });

    await prisma.ticket.delete({
      where: { id: ticketId },
    });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    res.status(500).json({ message: 'Failed to delete ticket' });
  }
});

// POST /api/tickets/import-csv - Import tickets from CSV (ADMIN or TECHNICIAN only)
router.post('/import-csv', authenticate, requireRole('ADMIN', 'TECHNICIAN'), upload.single('file'), async (req: Request, res: Response) => {
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

    // Get the user from request (assuming authentication middleware adds it)
    const createdById = req.body.createdById;
    if (!createdById) {
      return res.status(400).json({ message: 'createdById is required' });
    }

    // Transform CSV data to match ticket schema
    const ticketsData = await Promise.all(records.map(async (record: any) => {
      let assetId = null;
      let assignedToId = null;

      // Find asset by code if provided
      const assetCode = record['Asset Code (Optional)'] || record['Asset Code'];
      if (assetCode) {
        const asset = await prisma.asset.findUnique({
          where: { asset_code: assetCode },
        });
        assetId = asset?.id || null;
      }

      // Find user by email if provided
      const assigneeEmail = record['Assignee Email (Optional)'] || record['Assignee Email'];
      if (assigneeEmail) {
        const user = await prisma.user.findUnique({
          where: { email: assigneeEmail },
        });
        assignedToId = user?.id || null;
      }

      return {
        title: record['Title (Required)'] || record['Title'],
        description: record['Description (Required)'] || record['Description'],
        priority: record['Priority (low/medium/high/critical)'] || record['Priority'] || 'medium',
        status: record['Status (open/in_progress/closed)'] || record['Status'] || 'open',
        department: record['Department'] || null,
        createdById,
        assetId,
        assignedToId,
      };
    }));

    // Create tickets
    const createdTickets = await Promise.all(
      ticketsData.map(ticket => prisma.ticket.create({ data: ticket as any }))
    );

    console.log(`Successfully imported ${createdTickets.length} tickets from CSV`);
    res.status(201).json({
      count: createdTickets.length,
      message: `Successfully imported ${createdTickets.length} tickets`,
      total: records.length,
    });
  } catch (error) {
    console.error('POST /api/tickets/import-csv error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error in CSV data',
        errors: error.errors
      });
    }

    res.status(500).json({
      message: 'Failed to import tickets from CSV',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Bulk close tickets
router.post('/bulk/close', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: Request, res: Response) => {
  const schema = z.object({
    ticketIds: z.array(z.string()),
    resolution: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const { ticketIds, resolution } = parsed.data;

    // Update all tickets to closed status
    await prisma.ticket.updateMany({
      where: { id: { in: ticketIds } },
      data: {
        status: 'closed',
        resolution: resolution || 'Bulk closed',
      },
    });

    // Get updated tickets for response
    const closedTickets: TicketWithAllRelations[] = await prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        asset: true,
      },
    });

    // Send notifications to ticket creators
    const notificationPromises = closedTickets.map(ticket =>
      createNotificationIfNotExists({
        type: 'ticket_status',
        title: 'Ticket closed',
        message: `Your ticket "${ticket.title}" has been closed`, 
        userId: ticket.createdById,
        senderId: req.user!.id,
        ticketId: ticket.id,
      })
    );

    await Promise.all(notificationPromises);

    // Log audit trail
    await logAudit(req, 'UPDATE', 'Ticket', 'BULK', undefined, {
      action: 'bulk_close',
      count: ticketIds.length,
      ticketIds,
    });

    console.log(`✅ Bulk closed ${ticketIds.length} tickets`);
    res.json({
      message: `Successfully closed ${ticketIds.length} tickets`,
      count: ticketIds.length,
      tickets: closedTickets,
    });
  } catch (error) {
    console.error('Bulk close error:', error);
    res.status(500).json({ message: 'Failed to close tickets' });
  }
});

// Bulk export tickets
router.post('/bulk/export', authenticate, async (req: Request, res: Response) => {
  const schema = z.object({
    ticketIds: z.array(z.string()),
    format: z.enum(['json', 'csv']).default('json'),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const { ticketIds, format } = parsed.data;

    // Check access - users can only export their own tickets unless admin/tech
    const whereClause: any = { id: { in: ticketIds } };
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TECHNICIAN') {
      whereClause.createdById = req.user?.id;
    }

    const tickets: TicketWithAllRelations[] = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        asset: { select: { id: true, name: true, serial_number: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Ticket Number',
        'Title',
        'Description',
        'Status',
        'Priority',
        'Created By',
        'Assigned To',
        'Asset',
        'Created At',
        'Updated At',
      ];

      const rows = tickets.map(ticket => [
        ticket.number,
        ticket.title,
        ticket.description,
        ticket.status,
        ticket.priority,
        ticket.createdBy?.name || ticket.createdBy?.email || '',
        ticket.assignedTo?.name || ticket.assignedTo?.email || '',
        ticket.asset?.name || '',
        ticket.createdAt.toISOString(),
        ticket.updatedAt.toISOString(),
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tickets-export-${Date.now()}.csv"`);
      return res.send(csv);
    }

    // Return JSON format
    res.json({
      count: tickets.length,
      exportedAt: new Date().toISOString(),
      tickets,
    });
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({ message: 'Failed to export tickets' });
  }
});

// Bulk delete tickets (admin only)
router.delete('/bulk', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const schema = z.object({
    ticketIds: z.array(z.string()),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const { ticketIds } = parsed.data;

    // Get ticket details before deletion for audit log
    const ticketsToDelete = await prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
      select: {
        id: true,
        number: true,
        title: true,
        createdById: true,
      },
    });

    // Delete related records first (due to foreign key constraints)
    await prisma.notification.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.comment.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.attachment.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.ticketSLA.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.workflowExecution.deleteMany({
      where: { entityType: 'ticket', entityId: { in: ticketIds } },
    });

    // Delete the tickets
    await prisma.ticket.deleteMany({
      where: { id: { in: ticketIds } },
    });

    // Log audit trail
    await logAudit(req, 'DELETE', 'Ticket', 'BULK', undefined, {
      action: 'bulk_delete',
      count: ticketIds.length,
      tickets: ticketsToDelete,
    });

    console.log(`✅ Bulk deleted ${ticketIds.length} tickets`);
    res.json({
      message: `Successfully deleted ${ticketIds.length} tickets`,
      count: ticketIds.length,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Failed to delete tickets' });
  }
});

export default router;
