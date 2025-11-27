import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';
import { createNotificationIfNotExists } from '../lib/notificationHelper';
import { slaEngine } from '../lib/slaEngine';
import crypto from 'crypto';

const router = Router();

// In-memory lock to prevent concurrent duplicate comment creation
const commentCreationLocks = new Map<string, Promise<any>>();

// Track recently processed request IDs to prevent duplicates
const processedRequests = new Map<string, { timestamp: number; commentId: string }>();

// Clean up old processed requests every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of processedRequests.entries()) {
    if (now - value.timestamp > 60000) { // 1 minute
      processedRequests.delete(key);
    }
  }
}, 60000);

const createCommentSchema = z.object({
  content: z.string().min(1),
  ticketId: z.string(),
  authorId: z.string(),
});

// Get all comments for a ticket
router.get('/ticket/:ticketId', authenticate, async (req: Request, res) => {
  try {
    // First check if user has access to this ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.ticketId },
      select: { createdById: true, assignedToId: true },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to this ticket's comments
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TECHNICIAN') {
      if (ticket.createdById !== req.user?.id && ticket.assignedToId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const comments = await prisma.comment.findMany({
      where: { ticketId: req.params.ticketId },
      include: {
        author: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Create a comment
router.post('/', authenticate, async (req: Request, res) => {
  // LOG EVERY INCOMING REQUEST IMMEDIATELY
  const requestId = req.headers['x-request-id'] as string;
  const timestamp = new Date().toISOString();
  console.log(`\n========================================`);
  console.log(`[INCOMING] 🔵 POST /api/comments at ${timestamp}`);
  console.log(`[INCOMING] Request ID: ${requestId || 'none'}`);
  console.log(`[INCOMING] Content: "${req.body.content}"`);
  console.log(`[INCOMING] Author ID: ${req.body.authorId}`);
  console.log(`[INCOMING] Ticket ID: ${req.body.ticketId}`);
  console.log(`========================================\n`);

  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    // Get request ID from header (sent by frontend)

    // Check if this exact request was already processed
    if (requestId && processedRequests.has(requestId)) {
      const processed = processedRequests.get(requestId)!;
      console.log(`[DUPLICATE PREVENTED] ❌ Request ID ${requestId} already processed - returning cached result`);

      // Return the previously created comment
      const existingComment = await prisma.comment.findUnique({
        where: { id: processed.commentId },
        include: {
          author: {
            select: { id: true, email: true, name: true, role: true },
          },
          ticket: {
            include: {
              createdBy: true,
            },
          },
        },
      });

      if (existingComment) {
        return res.status(200).json(existingComment);
      }
    }

    console.log(`[REQUEST] Processing new comment request - ID: ${requestId || 'none'}`);

    // Verify user has access to the ticket before allowing comment
    const ticket = await prisma.ticket.findUnique({
      where: { id: parsed.data.ticketId },
      select: { createdById: true, assignedToId: true },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to comment on this ticket
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TECHNICIAN') {
      if (ticket.createdById !== req.user?.id && ticket.assignedToId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Create content hash for duplicate detection
    const contentHash = crypto
      .createHash('md5')
      .update(parsed.data.content + parsed.data.ticketId + parsed.data.authorId)
      .digest('hex');

    console.log(`[HASH] Content hash: ${contentHash}`);

    // FIRST: Check database for recent duplicates (within last 30 seconds)
    const recentTime = new Date(Date.now() - 30000);
    console.log(`[DB CHECK] Checking for duplicates since ${recentTime.toISOString()}...`);

    const existingComment = await prisma.comment.findFirst({
      where: {
        content: parsed.data.content,
        ticketId: parsed.data.ticketId,
        authorId: parsed.data.authorId,
        createdAt: {
          gte: recentTime,
        },
      },
      include: {
        author: {
          select: { id: true, email: true, name: true, role: true },
        },
        ticket: {
          include: {
            createdBy: true,
          },
        },
      },
    });

    // If duplicate found in DB, return it immediately
    if (existingComment) {
      console.log(`[DUPLICATE PREVENTED] ❌ Identical comment found in DB within 30s (ID: ${existingComment.id})`);

      // Cache this request ID
      if (requestId) {
        processedRequests.set(requestId, {
          timestamp: Date.now(),
          commentId: existingComment.id,
        });
      }

      return res.status(200).json(existingComment);
    }

    console.log(`[DB CHECK] ✅ No duplicate found in DB - proceeding to lock check`);

    // Create a unique lock key using hash
    const lockKey = contentHash;

    // ATOMIC LOCK CHECK-AND-SET
    // We must check for lock AND set it in the same synchronous tick
    // to prevent race conditions where two requests both see no lock
    console.log(`[LOCK CHECK] Checking if lock exists for hash: ${lockKey}`);

    let creationPromise = commentCreationLocks.get(lockKey);

    if (creationPromise) {
      // Lock already exists - wait for the existing creation to complete
      console.log(`[DUPLICATE PREVENTED] ❌ Request already in progress - waiting for completion`);
      try {
        const comment = await creationPromise;

        // Cache this request ID
        if (requestId) {
          processedRequests.set(requestId, {
            timestamp: Date.now(),
            commentId: comment.id,
          });
        }

        return res.status(200).json(comment);
      } catch (error) {
        console.error('[LOCK ERROR] Failed to get existing comment:', error);
        return res.status(409).json({ message: 'Duplicate request in progress' });
      }
    }

    // No lock exists - create one IMMEDIATELY (same synchronous execution)
    console.log(`[LOCK CHECK] ✅ No lock found - setting lock NOW`);

    let resolveCreation: (value: any) => void;
    let rejectCreation: (reason: any) => void;

    creationPromise = new Promise<any>((resolve, reject) => {
      resolveCreation = resolve;
      rejectCreation = reject;
    });

    // SET LOCK IMMEDIATELY in the same synchronous execution as the check above
    commentCreationLocks.set(lockKey, creationPromise);
    console.log(`[LOCK] 🔒 Lock set for hash: ${lockKey}`);

    // Now do the actual comment creation
    try {
      console.log(`[CREATE] Creating new comment...`);

      const comment = await prisma.comment.create({
        data: {
          ...parsed.data,
          contentHash, // Store hash for duplicate detection
        },
        include: {
          author: {
            select: { id: true, email: true, name: true, role: true },
          },
          ticket: {
            include: {
              createdBy: true,
            },
          },
        },
      });

      console.log(`[SUCCESS] ✅ Comment created - ID: ${comment.id}, Author: ${comment.author.name || comment.author.email}`);

      // Cache this request ID
      if (requestId) {
        processedRequests.set(requestId, {
          timestamp: Date.now(),
          commentId: comment.id,
        });
        console.log(`[CACHE] Stored request ID: ${requestId}`);
      }

      // Resolve the promise so any waiting requests get the comment
      resolveCreation!(comment);

      // Keep lock for 30 seconds to prevent immediate duplicates
      setTimeout(() => {
        commentCreationLocks.delete(lockKey);
        console.log(`[LOCK] Released lock after 30s: ${lockKey}`);
      }, 30000);
    } catch (error) {
      console.error(`[CREATE ERROR] Failed to create comment:`, error);
      // Reject the promise and remove lock immediately
      rejectCreation!(error);
      commentCreationLocks.delete(lockKey);
      console.log(`[LOCK] Released lock due to error: ${lockKey}`);
      throw error;
    }

    const comment = await creationPromise;

    // Determine who should be notified based on commenter role
    const commentAuthorRole = comment.author.role;
    const ticketCreatorId = comment.ticket.createdBy?.id;
    const notificationPromises: Promise<any>[] = [];

    console.log(`\n[NOTIFICATIONS] Processing notifications for comment by ${commentAuthorRole}`);
    console.log(`[NOTIFICATIONS] Author ID: ${comment.authorId}`);
    console.log(`[NOTIFICATIONS] Ticket Creator ID: ${ticketCreatorId}`);

    // Always notify the ticket creator (if not commenting on their own ticket)
    if (ticketCreatorId !== comment.authorId) {
      console.log(`[NOTIFICATIONS] Adding notification for ticket creator: ${ticketCreatorId}`);
      notificationPromises.push(
        createNotificationIfNotExists({
          type: 'comment',
          title: 'New comment on your ticket',
          message: `${comment.author.name || comment.author.email} commented: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
          userId: ticketCreatorId,
          senderId: comment.authorId,
          ticketId: comment.ticketId,
        })
      );
    } else {
      console.log(`[NOTIFICATIONS] Skipping ticket creator (commenting on own ticket)`);
    }

    // If TECHNICIAN comments → also notify all ADMINS
    if (commentAuthorRole === 'TECHNICIAN') {
      console.log(`[NOTIFICATIONS] Technician comment detected, fetching admins...`);
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true },
      });

      console.log(`[NOTIFICATIONS] Found ${admins.length} admins:`, admins.map(a => a.name || a.email));

      admins.forEach(admin => {
        if (admin.id !== comment.authorId) { // Don't notify self
          console.log(`[NOTIFICATIONS] Adding notification for admin: ${admin.name || admin.email} (${admin.id})`);
          notificationPromises.push(
            createNotificationIfNotExists({
              type: 'comment',
              title: 'Technician commented on ticket',
              message: `${comment.author.name || comment.author.email} commented: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
              userId: admin.id,
              senderId: comment.authorId,
              ticketId: comment.ticketId,
            })
          );
        } else {
          console.log(`[NOTIFICATIONS] Skipping self-notification for admin: ${admin.name || admin.email}`);
        }
      });

      console.log(`✅ Queued ${notificationPromises.length} notifications for admins`);
    }

    // If ADMIN comments → also notify all TECHNICIANS
    if (commentAuthorRole === 'ADMIN') {
      const technicians = await prisma.user.findMany({
        where: { role: 'TECHNICIAN' },
        select: { id: true },
      });

      technicians.forEach(tech => {
        if (tech.id !== comment.authorId) { // Don't notify self
          notificationPromises.push(
            createNotificationIfNotExists({
              type: 'comment',
              title: 'Admin commented on ticket',
              message: `${comment.author.name || comment.author.email} commented: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
              userId: tech.id,
              senderId: comment.authorId,
              ticketId: comment.ticketId,
            })
          );
        }
      });

      console.log(`✅ Notifying ${technicians.length} technicians about admin comment`);
    }

    // If USER comments → notify all admins and technicians
    if (commentAuthorRole === 'USER') {
      const adminsAndTechs = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'TECHNICIAN'] },
        },
        select: { id: true },
      });

      adminsAndTechs.forEach(user => {
        notificationPromises.push(
          createNotificationIfNotExists({
            type: 'comment',
            title: 'User replied to ticket',
            message: `${comment.author.name || comment.author.email} commented: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
            userId: user.id,
            senderId: comment.authorId,
            ticketId: comment.ticketId,
          })
        );
      });

      console.log(`✅ Notifying ${adminsAndTechs.length} admins/technicians about user comment`);
    }

    // Send all notifications
    console.log(`[NOTIFICATIONS] Sending ${notificationPromises.length} total notifications...`);
    await Promise.all(notificationPromises);
    console.log(`[NOTIFICATIONS] ✅ All notifications sent\n`);

    // Log audit trail
    await logAudit(req, 'CREATE', 'Comment', comment.id, undefined, {
      ticketId: comment.ticketId,
      contentPreview: comment.content.substring(0, 100),
    });

    // Record first response for SLA if comment is from admin/technician
    if (commentAuthorRole === 'ADMIN' || commentAuthorRole === 'TECHNICIAN') {
      slaEngine.recordFirstResponse(comment.ticketId).catch(err => {
        console.error('SLA first response recording error:', err);
      });
    }

    res.json(comment);
  } catch (error) {
    console.error('Failed to create comment:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

// Delete a comment
router.delete('/:id', authenticate, async (req: Request, res) => {
  try {
    // Get the comment first to check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      select: {
        authorId: true,
        ticketId: true,
        content: true
      },
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only comment author or admin can delete
    if (req.user?.role !== 'ADMIN' && comment.authorId !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.comment.delete({
      where: { id: req.params.id },
    });

    // Log audit trail
    await logAudit(req, 'DELETE', 'Comment', req.params.id, undefined, {
      ticketId: comment.ticketId,
      contentPreview: comment.content.substring(0, 100),
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: 'Comment not found' });
  }
});

export default router;