import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const createSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.string().default('medium'),
  createdById: z.string(),
  assetId: z.string().nullable().optional(),
});

router.get('/', async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    include: {
      createdBy: { select: { id: true, email: true } },
      assignedTo: { select: { id: true, email: true } },
      asset: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tickets);
});

router.get('/:id', async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: { createdBy: true, assignedTo: true, asset: true },
  });
  if (!ticket) return res.status(404).json({ message: 'Not found' });
  res.json(ticket);
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const seq = Math.floor(Date.now() / 1000);
    const number = `TKT-${seq}`;

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: { ...parsed.data, number },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true, role: true },
        },
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

    res.json(ticket);
  } catch (error) {
    console.error('Failed to create ticket:', error);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
});

router.patch('/bulk', async (req, res) => {
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

    res.json(updatedTickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tickets' });
  }
});

router.patch('/:id', async (req, res) => {
  const parsed = createSchema.partial().extend({
    status: z.string().optional(),
    resolution: z.string().optional(),
    assignedToId: z.string().nullable().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    // Get the current ticket data before update
    const oldTicket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { createdBy: true, assignedTo: true },
    });

    // Update the ticket
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { createdBy: true, assignedTo: true },
    });

    // Send notification if status changed
    if (parsed.data.status && oldTicket && parsed.data.status !== oldTicket.status) {
      await prisma.notification.create({
        data: {
          type: 'ticket_status',
          title: 'Ticket status updated',
          message: `Your ticket status has been changed from "${oldTicket.status}" to "${parsed.data.status}"`,
          userId: ticket.createdById,
          senderId: ticket.assignedToId,
          ticketId: ticket.id,
        },
      });
    }

    // Send notification if ticket was assigned
    if (parsed.data.assignedToId && oldTicket && parsed.data.assignedToId !== oldTicket.assignedToId) {
      // Notify the ticket creator
      await prisma.notification.create({
        data: {
          type: 'ticket_assigned',
          title: 'Ticket assigned',
          message: `Your ticket has been assigned to ${ticket.assignedTo?.name || ticket.assignedTo?.email || 'a technician'}`,
          userId: ticket.createdById,
          senderId: parsed.data.assignedToId,
          ticketId: ticket.id,
        },
      });

      // Notify the assigned technician
      if (parsed.data.assignedToId) {
        await prisma.notification.create({
          data: {
            type: 'ticket_assigned',
            title: 'New ticket assigned to you',
            message: `You have been assigned to ticket: ${ticket.title}`,
            userId: parsed.data.assignedToId,
            senderId: ticket.createdById,
            ticketId: ticket.id,
          },
        });
      }
    }

    res.json(ticket);
  } catch (error) {
    console.error('Failed to update ticket:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

router.delete('/bulk', async (req, res) => {
  const schema = z.object({
    ticketIds: z.array(z.string()),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    // Delete related notifications first to avoid foreign key constraint issues
    await prisma.notification.deleteMany({
      where: { ticketId: { in: parsed.data.ticketIds } },
    });

    // Delete related comments
    await prisma.comment.deleteMany({
      where: { ticketId: { in: parsed.data.ticketIds } },
    });

    // Delete the tickets
    const result = await prisma.ticket.deleteMany({
      where: { id: { in: parsed.data.ticketIds } },
    });

    res.json({
      message: `Successfully deleted ${result.count} ticket(s)`,
      count: result.count
    });
  } catch (error) {
    console.error('Failed to delete tickets:', error);
    res.status(500).json({ message: 'Failed to delete tickets' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Delete related notifications first
    await prisma.notification.deleteMany({
      where: { ticketId: req.params.id },
    });

    // Delete related comments
    await prisma.comment.deleteMany({
      where: { ticketId: req.params.id },
    });

    await prisma.ticket.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: 'Ticket not found' });
  }
});

export default router;