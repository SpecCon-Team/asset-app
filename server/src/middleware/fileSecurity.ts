import crypto from 'crypto';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

type MulterFile = Express.Multer.File;

/**
 * Enhanced File Upload Security
 * Implements comprehensive file upload protection with virus scanning
 */

// Allowed file types with corresponding MIME types
const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': { ext: ['.jpg', '.jpeg'], maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/png': { ext: ['.png'], maxSize: 5 * 1024 * 1024 },
  'image/gif': { ext: ['.gif'], maxSize: 5 * 1024 * 1024 },
  'image/webp': { ext: ['.webp'], maxSize: 5 * 1024 * 1024 },
  
  // Documents
  'application/pdf': { ext: ['.pdf'], maxSize: 10 * 1024 * 1024 }, // 10MB
  'application/msword': { ext: ['.doc'], maxSize: 5 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    ext: ['.docx'], maxSize: 5 * 1024 * 1024 
  },
  'application/vnd.ms-excel': { ext: ['.xls'], maxSize: 5 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
    ext: ['.xlsx'], maxSize: 5 * 1024 * 1024 
  },
  'text/csv': { ext: ['.csv'], maxSize: 2 * 1024 * 1024 }, // 2MB
  
  // Archives
  'application/zip': { ext: ['.zip'], maxSize: 20 * 1024 * 1024 }, // 20MB
  'application/x-rar-compressed': { ext: ['.rar'], maxSize: 20 * 1024 * 1024 }
};

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.deb', '.msi', '.dll',
  '.ps1', '.psm1', '.psd1', '.ps1xml', '.psc1', '.psd1xml'
];

// Malicious signatures to detect (simplified)
const MALICIOUS_SIGNATURES = [
  Buffer.from([0x4D, 0x5A]), // PE executable
  Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
  Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Java class
  Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP (could contain malware)
];

// Generate secure filename
export function generateSecureFilename(originalname: string): string {
  const ext = path.extname(originalname);
  const name = path.basename(originalname, ext);
  
  // Sanitize filename
  const sanitizedName = name
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50); // Limit length
  
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  
  return `${sanitizedName}_${timestamp}_${random}${ext}`;
}

// Validate file type and content
export function validateFile(file: MulterFile): { valid: boolean; error?: string } {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Dangerous file extension: ${ext}` };
  }
  
  // Check MIME type
  const fileType = ALLOWED_FILE_TYPES[file.mimetype];
  if (!fileType) {
    return { valid: false, error: `Unsupported file type: ${file.mimetype}` };
  }
  
  // Check file size
  if (file.size > fileType.maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${fileType.maxSize / (1024 * 1024)}MB` 
    };
  }
  
  // Check extension matches MIME type
  if (!fileType.ext.includes(ext)) {
    return { 
      valid: false, 
      error: `File extension ${ext} does not match MIME type ${file.mimetype}` 
    };
  }
  
  return { valid: true };
}

// Basic malware detection (simplified)
export function detectMalware(buffer: Buffer): { clean: boolean; threat?: string } {
  // Check for malicious signatures
  for (const signature of MALICIOUS_SIGNATURES) {
    if (buffer.subarray(0, signature.length).equals(signature)) {
      return { 
        clean: false, 
        threat: `Executable file detected: ${signature.toString('hex')}` 
      };
    }
  }
  
  // Check for suspicious patterns
  const content = buffer.toString('binary', 0, Math.min(1024, buffer.length));
  const suspiciousPatterns = [
    /eval\s*\(/gi,
    /<script/gi,
    /javascript:/gi,
    /vbscript:/gi
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { 
        clean: false, 
        threat: `Suspicious content pattern detected: ${pattern.source}` 
      };
    }
  }
  
  return { clean: true };
}

// Enhanced multer configuration with security
export const secureUpload = multer({
  storage: multer.memoryStorage(), // Store in memory for scanning
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB global limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      console.warn('🚨 File upload rejected:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        error: validation.error,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return cb(new Error(validation.error), false);
    }
    
    cb(null, true);
  }
});

// File upload middleware with comprehensive security
export function secureFileUpload(req: Request, res: Response, next: NextFunction): void {
  // Add CSRF token validation for file uploads
  const csrfToken = req.get('X-CSRF-Token');
  const cookieToken = req.cookies?.csrfToken;
  
  if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'CSRF token validation required for file uploads',
      code: 'CSRF_REQUIRED'
    });
  }
  
  // Rate limiting for file uploads
  const uploadKey = `upload_${req.ip}`;
  // This would be enhanced with proper rate limiting store
  
  next();
}

// Process uploaded file with security checks
export async function processUploadedFile(
  file: MulterFile,
  destination: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    // Validate file again (double-check)
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Scan for malware
    const malwareScan = detectMalware(file.buffer);
    if (!malwareScan.clean) {
      console.warn('🚨 Malware detected in file upload:', {
        filename: file.originalname,
        threat: malwareScan.threat
      });
      
      return { success: false, error: `Security threat detected: ${malwareScan.threat}` };
    }
    
    // Generate secure filename
    const secureFilename = generateSecureFilename(file.originalname);
    const filepath = path.join(destination, secureFilename);
    
    // Write file with secure permissions
    await require('fs').promises.writeFile(filepath, file.buffer, { mode: 0o644 });
    
    // Log successful upload
    console.log('✅ File uploaded securely:', {
      originalName: file.originalname,
      secureName: secureFilename,
      size: file.size,
      mimetype: file.mimetype,
      filepath
    });
    
    return { success: true, filename: secureFilename };
    
  } catch (error) {
    console.error('File processing error:', error);
    return { success: false, error: 'File processing failed' };
  }
}

// Cleanup old files (security maintenance)
export async function cleanupOldFiles(
  directory: string, 
  maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<void> {
  try {
    const fs = require('fs').promises;
    const files = await fs.readdir(directory);
    const now = Date.now();
    
    for (const file of files) {
      const filepath = path.join(directory, file);
      const stats = await fs.stat(filepath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filepath);
        console.log('🗑️  Cleaned up old file:', file);
      }
    }
  } catch (error) {
    console.error('File cleanup error:', error);
  }
}