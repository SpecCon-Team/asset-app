import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * File Upload Security Module
 * Implements advanced security checks for file uploads
 */

// File type magic numbers (first few bytes that identify file type)
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  'image/jpeg': [
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE2]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE3]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE8])
  ],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  'image/gif': [
    Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]),
    Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])], // RIFF
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  'application/zip': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]),
    Buffer.from([0x50, 0x4B, 0x05, 0x06]),
    Buffer.from([0x50, 0x4B, 0x07, 0x08])
  ],
  // Office documents (also ZIP-based)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04])
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04])
  ],
  // Old Office formats
  'application/msword': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])],
  'application/vnd.ms-excel': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])],
  'text/plain': [] // Text files don't have magic numbers
};

/**
 * Verify file content matches declared MIME type using magic numbers
 */
export function verifyFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];

  if (!signatures) {
    console.warn(`No signature verification available for MIME type: ${mimeType}`);
    return true; // Allow if we don't have signatures
  }

  if (signatures.length === 0) {
    return true; // Text files, CSV, etc.
  }

  // Check if file starts with any of the valid signatures
  return signatures.some(signature => {
    if (buffer.length < signature.length) {
      return false;
    }
    return buffer.slice(0, signature.length).equals(signature);
  });
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  let sanitized = path.basename(filename);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove any directory traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');

  // Remove special characters except alphanumeric, dash, underscore, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevent multiple consecutive dots
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // Prevent starting with dot (hidden files)
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized;
  }

  // Limit length
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const maxNameLength = 200;

  if (name.length > maxNameLength) {
    sanitized = name.substring(0, maxNameLength) + ext;
  }

  return sanitized;
}

/**
 * Generate secure unique filename
 */
export function generateSecureFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);

  // Add cryptographic hash and timestamp
  const hash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();

  return `${name}-${timestamp}-${hash}${ext}`;
}

/**
 * Validate image dimensions (prevent zip bombs in images)
 */
export function validateImageSize(
  buffer: Buffer,
  maxWidth: number = 8000,
  maxHeight: number = 8000
): { valid: boolean; error?: string } {
  // This is a basic check - for production, use a library like 'sharp' or 'jimp'
  // that can safely parse image metadata without loading the full image

  // For now, just check file size as a proxy
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  if (buffer.length > maxFileSize) {
    return { valid: false, error: 'Image file size too large' };
  }

  return { valid: true };
}

/**
 * Check for embedded executables or scripts in files
 */
export function scanForExecutableContent(buffer: Buffer, filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();

  // Dangerous extensions that should never be allowed
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
    '.jar', '.msi', '.app', '.deb', '.rpm', '.dmg', '.sh', '.ps1'
  ];

  if (dangerousExtensions.includes(ext)) {
    return true; // Contains executable
  }

  // Scan for common executable signatures
  const executableSignatures = [
    Buffer.from('MZ'), // Windows PE
    Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF (Linux)
    Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O (macOS)
    Buffer.from('#!/'), // Shell script
  ];

  for (const signature of executableSignatures) {
    if (buffer.slice(0, signature.length).equals(signature)) {
      return true;
    }
  }

  // Check for script tags in text-based files
  const dangerousPatterns = [
    /<script[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers
    /eval\s*\(/gi,
    /expression\s*\(/gi // CSS expression
  ];

  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  return false; // Safe
}

/**
 * Rate limiter for file uploads (per user)
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per window
  message: 'Too many file uploads. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID for rate limiting if authenticated, otherwise undefined for IP-based limiting
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id ? `user:${user.id}` : undefined;
  }
});

/**
 * Comprehensive file validation
 */
export async function validateUploadedFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check file signature
  if (!verifyFileSignature(buffer, mimeType)) {
    errors.push('File content does not match declared type');
  }

  // Check for executable content
  if (scanForExecutableContent(buffer, filename)) {
    errors.push('File contains executable or script content');
  }

  // Validate filename
  const sanitized = sanitizeFilename(filename);
  if (sanitized !== filename) {
    errors.push('Filename contains invalid characters');
  }

  // Check image dimensions for image files
  if (mimeType.startsWith('image/')) {
    const sizeCheck = validateImageSize(buffer);
    if (!sizeCheck.valid) {
      errors.push(sizeCheck.error || 'Image validation failed');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate file hash for deduplication and integrity checking
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Check if file extension matches MIME type
 */
export function validateExtensionMimeMatch(filename: string, mimeType: string): boolean {
  const ext = path.extname(filename).toLowerCase();

  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  };

  const validExtensions = mimeToExt[mimeType];
  if (!validExtensions) {
    return false;
  }

  return validExtensions.includes(ext);
}
