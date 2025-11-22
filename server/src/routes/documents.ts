import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/auditLog';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
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
router.get('/', authenticate, async (req: any, res) => {
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

    res.json({
      documents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      message: error.message
    });
  }
});

// GET /api/documents/stats - Get document statistics
router.get('/stats', authenticate, async (req: any, res) => {
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
router.get('/recent', authenticate, async (req: any, res) => {
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

    res.json({ documents });
  } catch (error: any) {
    console.error('Error fetching recent documents:', error);
    res.status(500).json({
      error: 'Failed to fetch recent documents',
      message: error.message
    });
  }
});

// GET /api/documents/:id - Get single document
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ error: 'Document not found' });
    }

    // Log access
    await prisma.documentAccessLog.create({
      data: {
        documentId: id,
        userId: req.user.id,
        action: 'view',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json(document);
  } catch (error: any) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      error: 'Failed to fetch document',
      message: error.message
    });
  }
});

// POST /api/documents/upload - Upload new document
router.post('/upload', authenticate, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, categoryId, tags, metadata } = req.body;

    if (!title) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Title is required' });
    }

    const document = await prisma.document.create({
      data: {
        title,
        description,
        categoryId: categoryId || null,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tags: tags ? JSON.parse(tags) : [],
        metadata: metadata ? JSON.parse(metadata) : {},
        uploadedById: req.user.id
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

    await logAudit(req.user.id, 'CREATE', 'Document', document.id, {
      title,
      fileName: req.file.originalname
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);

    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'Failed to upload document',
      message: error.message
    });
  }
});

// PUT /api/documents/:id - Update document metadata
router.put('/:id', authenticate, async (req: any, res) => {
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

    await logAudit(req.user.id, 'UPDATE', 'Document', id, req.body);

    res.json({
      message: 'Document updated successfully',
      document: updated
    });
  } catch (error: any) {
    console.error('Error updating document:', error);
    res.status(500).json({
      error: 'Failed to update document',
      message: error.message
    });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', authenticate, async (req: any, res) => {
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

    await logAudit(req.user.id, 'DELETE', 'Document', id, {});

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

// GET /api/documents/:id/download - Download document
router.get('/:id/download', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Log download
    await prisma.documentAccessLog.create({
      data: {
        documentId: id,
        userId: req.user.id,
        action: 'download',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.download(document.filePath, document.originalFileName);
  } catch (error: any) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      error: 'Failed to download document',
      message: error.message
    });
  }
});

// POST /api/documents/:id/version - Upload new version
router.post('/:id/version', authenticate, upload.single('file'), async (req: any, res) => {
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
      await fs.unlink(req.file.path);
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
        filePath: req.file.path,
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

    await logAudit(req.user.id, 'VERSION', 'Document', id, {
      newVersion: newVersion.version
    });

    res.status(201).json({
      message: 'New version uploaded successfully',
      document: newVersion
    });
  } catch (error: any) {
    console.error('Error uploading version:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'Failed to upload new version',
      message: error.message
    });
  }
});

// GET /api/documents/:id/versions - Get version history
router.get('/:id/versions', authenticate, async (req: any, res) => {
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

// =====================================================
// DOCUMENT CATEGORY ENDPOINTS
// =====================================================

// GET /api/documents/categories/all - List all categories
router.get('/categories/all', authenticate, async (req: any, res) => {
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
router.post('/categories', authenticate, requireRole(['ADMIN']), async (req: any, res) => {
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

    await logAudit(req.user.id, 'CREATE', 'DocumentCategory', category.id, { name });

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
router.post('/:id/share', authenticate, async (req: any, res) => {
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

    await logAudit(req.user.id, 'SHARE', 'Document', id, {
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
router.post('/:id/comments', authenticate, async (req: any, res) => {
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
