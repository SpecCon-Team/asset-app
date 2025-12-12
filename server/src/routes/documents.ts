import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

interface DocumentUploadBody {
  title: string;
  description?: string;
  categoryId?: string;
  tags?: string; // JSON string
  metadata?: string; // JSON string
}

interface DocumentUpdateBody {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[]; // Assuming it's parsed as string[]
  metadata?: object; // Assuming it's parsed as object
  status?: string;
}

interface DocumentVersionBody {
  versionLabel?: string;
}

interface DocumentCategoryBody {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentCategoryId?: string;
  sortOrder?: number;
}

interface DocumentShareBody {
  sharedWithUserId?: string;
  sharedWithRole?: string;
  permissions?: string[];
  expiresAt?: string; // ISO date string
  message?: string;
}

interface DocumentCommentBody {
  comment: string;
  parentCommentId?: string;
}

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

// Configure multer for file uploads (store in memory for database storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents, images, and spreadsheets are allowed.'));
    }
  }
});

// =====================================================
// DOCUMENT ENDPOINTS
// =====================================================

// GET /api/documents - List all documents
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { categoryId, status = 'active', search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isLatestVersion: true
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalFileName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          category: true,
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.document.count({ where })
    ]);

    // Convert BigInt values to numbers for JSON serialization
    res.json(convertBigIntsToNumbers({
      documents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }));
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      message: error.message
    });
  }
});

// GET /api/documents/stats - Get document statistics
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const [
      totalDocs,
      totalSize,
      byCategory,
      recentUploads
    ] = await Promise.all([
      prisma.document.count({
        where: { isLatestVersion: true, status: 'active' }
      }),

      prisma.$queryRaw`
        SELECT SUM("fileSize") as total
        FROM "Document"
        WHERE "isLatestVersion" = true AND status = 'active'
      `,

      prisma.document.groupBy({
        by: ['categoryId'],
        where: { isLatestVersion: true, status: 'active' },
        _count: true,
        _sum: {
          fileSize: true
        }
      }),

      prisma.document.count({
        where: {
          isLatestVersion: true,
          status: 'active',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    // Enrich category data
    const categoryIds = byCategory.map(c => c.categoryId).filter(Boolean);
    const categories = await prisma.documentCategory.findMany({
      where: { id: { in: categoryIds as string[] } }
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const enrichedCategories = byCategory.map(cat => ({
      ...cat,
      category: cat.categoryId ? categoryMap.get(cat.categoryId) : null
    }));

    const response = {
      totalDocuments: totalDocs,
      totalSize: Number(totalSize[0]?.total || 0),
      recentUploads,
      byCategory: convertBigIntsToNumbers(enrichedCategories)
    };

    res.json(convertBigIntsToNumbers(response));
  } catch (error: any) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({
      error: 'Failed to fetch document statistics',
      message: error.message
    });
  }
});

// GET /api/documents/recent - Get recent documents
router.get('/recent', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;

    const documents = await prisma.document.findMany({
      where: {
        isLatestVersion: true,
        status: 'active'
      },
      include: {
        category: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Convert BigInt values to numbers for JSON serialization
    res.json(convertBigIntsToNumbers({ documents }));
  } catch (error: any) {
    console.error('Error fetching recent documents:', error);
    res.status(500).json({
      error: 'Failed to fetch recent documents',
      message: error.message
    });
  }
});

// IMPORTANT: More specific routes must come BEFORE the generic /:id route
// GET /api/documents/:id/download - Download document
router.get('/:id/download', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('📥 Download request for document ID:', id, 'User:', req.user?.id);

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      console.log('❌ Document not found for ID:', id);
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if file content exists
    if (!document.fileContent) {
      console.error('❌ File content not found for document ID:', id);
      return res.status(404).json({
        error: 'File not found',
        message: 'The document file is missing from the server'
      });
    }

    // Log download (non-blocking)
    try {
      await prisma.documentAccessLog.create({
        data: {
          documentId: id,
          userId: req.user?.id || 'unknown',
          action: 'download',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      console.warn('⚠️  Failed to log document download:', logError);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFileName}"`);
    res.setHeader('Content-Length', document.fileContent.length);

    // Send the file content
    res.send(document.fileContent);
  } catch (error: any) {
    console.error('❌ Error downloading document:', error, 'ID:', req.params.id, 'User:', req.user?.id);
    res.status(500).json({
      error: 'Server Error',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/documents/:id/versions - Get version history
router.get('/:id/versions', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const versions = await prisma.document.findMany({
      where: {
        OR: [
          { id },
          { parentDocumentId: id }
        ]
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        version: 'desc'
      }
    });

    res.json({ versions });
  } catch (error: any) {
    console.error('Error fetching versions:', error);
    res.status(500).json({
      error: 'Failed to fetch versions',
      message: error.message
    });
  }
});

// GET /api/documents/:id - Get single document (must be last)
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('📄 Fetching document with ID:', id);
    console.log('👤 User:', req.user?.id || 'unknown', req.user?.email || 'unknown');

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        category: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        associations: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        shares: {
          include: {
            sharedBy: {
              select: {
                id: true,
                name: true
              }
            },
            sharedWithUser: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!document) {
      console.log('Document not found for ID:', id);
      // Check if document exists at all (maybe it's a different version)
      const anyVersion = await prisma.document.findFirst({
        where: { id },
        select: { id: true, title: true, isLatestVersion: true }
      });
      if (anyVersion) {
        console.log('Document exists but query returned null. Document:', anyVersion);
      }
      return res.status(404).json({ error: 'Document not found' });
    }

    // Log access (non-blocking - don't fail if logging fails)
    try {
      await prisma.documentAccessLog.create({
        data: {
          documentId: id,
          userId: req.user?.id || 'unknown',
          action: 'view',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      // Log error but don't fail the request
      console.warn('Failed to log document access:', logError);
    }

    // Convert BigInt values to numbers for JSON serialization
    res.json(convertBigIntsToNumbers(document));
  } catch (error: any) {
    console.error('Error fetching document:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to fetch document',
      message: error.message
    });
  }
});

// POST /api/documents/upload - Upload new document
router.post('/upload', authenticate, upload.single('file'), async (req: Request<{}, {}, DocumentUploadBody>, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, categoryId, tags, metadata } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const document = await prisma.document.create({
      data: {
        title,
        description,
        categoryId: categoryId || null,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        filePath: null, // No longer storing on disk
        fileContent: req.file.buffer, // Store file content in database
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tags: tags ? JSON.parse(tags) : [],
        metadata: metadata ? JSON.parse(metadata) : {},
        uploadedById: req.user.id,
        uploadedAt: new Date()
      },
      include: {
        category: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await logAudit(req, 'CREATE', 'Document', document.id, {
      title,
      fileName: req.file.originalname
    });

    // Convert BigInt values to numbers for JSON serialization
    res.status(201).json(convertBigIntsToNumbers({
      message: 'Document uploaded successfully',
      document
    }));
  } catch (error: any) {
    console.error('Error uploading document:', error);

    res.status(500).json({
      error: 'Failed to upload document',
      message: error.message
    });
  }
});

// PUT /api/documents/:id - Update document metadata
router.put('/:id', authenticate, async (req: Request<{ id: string }, {}, DocumentUpdateBody>, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, tags, metadata, status } = req.body;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Only owner or admins can update
    if (document.uploadedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this document' });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        title,
        description,
        categoryId,
        tags: tags || document.tags,
        metadata: metadata || document.metadata,
        status
      },
      include: {
        category: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await logAudit(req, 'UPDATE', 'Document', id, req.body);

    // Convert BigInt values to numbers for JSON serialization
    res.json(convertBigIntsToNumbers({
      message: 'Document updated successfully',
      document: updated
    }));
  } catch (error: any) {
    console.error('Error updating document:', error);
    res.status(500).json({
      error: 'Failed to update document',
      message: error.message
    });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Only owner or admins can delete
    if (document.uploadedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this document' });
    }

    // Soft delete by setting status
    await prisma.document.update({
      where: { id },
      data: { status: 'deleted' }
    });

    await logAudit(req, 'DELETE', 'Document', id, {});

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

// POST /api/documents/:id/version - Upload new version
router.post('/:id/version', authenticate, upload.single('file'), async (req: Request<{ id: string }, {}, DocumentVersionBody>, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { id } = req.params;
    const { versionLabel } = req.body;

    const parentDoc = await prisma.document.findUnique({
      where: { id }
    });

    if (!parentDoc) {
      return res.status(404).json({ error: 'Parent document not found' });
    }

    // Mark current version as not latest
    await prisma.document.updateMany({
      where: {
        OR: [
          { id },
          { parentDocumentId: id }
        ],
        isLatestVersion: true
      },
      data: { isLatestVersion: false }
    });

    // Create new version
    const newVersion = await prisma.document.create({
      data: {
        title: parentDoc.title,
        description: parentDoc.description,
        categoryId: parentDoc.categoryId,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        filePath: null, // No longer storing on disk
        fileContent: req.file.buffer, // Store file content in database
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        version: parentDoc.version + 1,
        versionLabel,
        isLatestVersion: true,
        parentDocumentId: parentDoc.parentDocumentId || id,
        status: parentDoc.status,
        tags: parentDoc.tags,
        metadata: parentDoc.metadata,
        uploadedById: req.user.id
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    await logAudit(req, 'VERSION', 'Document', id, {
      newVersion: newVersion.version
    });

    res.status(201).json({
      message: 'New version uploaded successfully',
      document: newVersion
    });
  } catch (error: any) {
    console.error('Error uploading version:', error);

    res.status(500).json({
      error: 'Failed to upload new version',
      message: error.message
    });
  }
});

// =====================================================
// DOCUMENT CATEGORY ENDPOINTS
// =====================================================

// GET /api/documents/categories/all - List all categories
router.get('/categories/all', authenticate, async (req: Request, res: Response) => {
  try {
    const categories = await prisma.documentCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// POST /api/documents/categories - Create category
router.post('/categories', authenticate, requireRole('ADMIN'), async (req: Request<{}, {}, DocumentCategoryBody>, res: Response) => {
  try {
    const { name, description, icon, color, parentCategoryId, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.documentCategory.create({
      data: {
        name,
        description,
        icon,
        color,
        parentCategoryId,
        sortOrder: sortOrder || 0
      }
    });

    await logAudit(req, 'CREATE', 'DocumentCategory', category.id, { name });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({
      error: 'Failed to create category',
      message: error.message
    });
  }
});

// =====================================================
// DOCUMENT SHARE ENDPOINTS
// =====================================================

// POST /api/documents/:id/share - Share document
router.post('/:id/share', authenticate, async (req: Request<{ id: string }, {}, DocumentShareBody>, res: Response) => {
  try {
    const { id } = req.params;
    const { sharedWithUserId, sharedWithRole, permissions, expiresAt, message } = req.body;

    if (!sharedWithUserId && !sharedWithRole) {
      return res.status(400).json({
        error: 'Either sharedWithUserId or sharedWithRole is required'
      });
    }

    const share = await prisma.documentShare.create({
      data: {
        documentId: id,
        sharedWithUserId,
        sharedWithRole,
        permissions: permissions || ['view'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        message,
        sharedById: req.user.id
      },
      include: {
        sharedBy: {
          select: { id: true, name: true }
        },
        sharedWithUser: {
          select: { id: true, name: true }
        }
      }
    });

    await logAudit(req, 'SHARE', 'Document', id, {
      sharedWith: sharedWithUserId || sharedWithRole
    });

    res.status(201).json({
      message: 'Document shared successfully',
      share
    });
  } catch (error: any) {
    console.error('Error sharing document:', error);
    res.status(500).json({
      error: 'Failed to share document',
      message: error.message
    });
  }
});

// =====================================================
// DOCUMENT COMMENT ENDPOINTS
// =====================================================

// POST /api/documents/:id/comments - Add comment
router.post('/:id/comments', authenticate, async (req: Request<{ id: string }, {}, DocumentCommentBody>, res: Response) => {
  try {
    const { id } = req.params;
    const { comment, parentCommentId } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const newComment = await prisma.documentComment.create({
      data: {
        documentId: id,
        userId: req.user.id,
        comment,
        parentCommentId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message
    });
  }
});

export default router;
