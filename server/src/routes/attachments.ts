import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import {
  validateUploadedFile,
  sanitizeFilename,
  generateSecureFilename,
  uploadRateLimiter,
  calculateFileHash,
  validateExtensionMimeMatch
} from '../lib/fileUploadSecurity.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'tickets');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and common document formats are allowed.'));
    }
  }
});

// Upload attachment to ticket
router.post('/:ticketId', authenticate, uploadRateLimiter, upload.single('file'), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const user = (req as any).user;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate extension matches MIME type
    if (!validateExtensionMimeMatch(req.file.originalname, req.file.mimetype)) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'File extension does not match file type' });
    }

    // Read file buffer for validation
    const buffer = await fs.readFile(req.file.path);

    // Comprehensive security validation
    const validation = await validateUploadedFile(
      buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!validation.valid) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: 'File validation failed',
        details: validation.errors
      });
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(req.file.originalname);
    const newPath = path.join(path.dirname(req.file.path), secureFilename);

    // Rename file to secure name
    await fs.rename(req.file.path, newPath);

    // Calculate file hash for integrity checking
    const fileHash = calculateFileHash(buffer);

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        filename: secureFilename,
        originalName: sanitizeFilename(req.file.originalname),
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/tickets/${secureFilename}`,
        ticketId,
        uploadedBy: user.id,
      }
    });

    console.log(`✅ File uploaded securely: ${secureFilename} (hash: ${fileHash.substring(0, 16)}...)`);

    res.json(attachment);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// Get attachments for a ticket
router.get('/ticket/:ticketId', authenticate, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const attachments = await prisma.attachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Delete attachment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        ticket: true
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Only allow deletion by uploader, ticket creator, admin, or assigned technician
    const ticket = attachment.ticket;
    const isAuthorized =
      attachment.uploadedBy === user.id ||
      ticket.createdById === user.id ||
      ticket.assignedToId === user.id ||
      user.role === 'ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to delete this attachment' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', 'tickets', attachment.filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
      // Continue even if file deletion fails
    }

    // Delete database record
    await prisma.attachment.delete({
      where: { id }
    });

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;
