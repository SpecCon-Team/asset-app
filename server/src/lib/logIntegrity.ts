import crypto from 'crypto';
import { prisma } from '../lib/prisma';

/**
 * Log Integrity and Security System
 * Implements log protection, integrity verification, and rotation
 */

// Log integrity configuration
interface LogIntegrityConfig {
  enableEncryption: boolean;
  encryptionKey: string;
  retentionDays: number;
  enableHashing: boolean;
  enableSigning: boolean;
}

const LOG_CONFIG: LogIntegrityConfig = {
  enableEncryption: process.env.LOG_ENCRYPTION === 'true',
  encryptionKey: process.env.LOG_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90'),
  enableHashing: process.env.LOG_HASHING !== 'false',
  enableSigning: process.env.LOG_SIGNING === 'true'
};

// Encrypt log entry
export function encryptLogEntry(entry: any): string {
  if (!LOG_CONFIG.enableEncryption) {
    return JSON.stringify(entry);
  }
  
  try {
    const cipher = crypto.createCipher('aes-256-gcm', LOG_CONFIG.encryptionKey);
    const iv = crypto.randomBytes(16);
    
    let encrypted = cipher.update(JSON.stringify(entry), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted data
    const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;
    
    return combined;
  } catch (error) {
    console.error('Log encryption error:', error);
    return JSON.stringify(entry);
  }
}

// Decrypt log entry
export function decryptLogEntry(encryptedData: string): any {
  if (!LOG_CONFIG.enableEncryption) {
    return JSON.parse(encryptedData);
  }
  
  try {
    const iv = Buffer.from(encryptedData.substring(0, 32), 'hex');
    const authTag = Buffer.from(encryptedData.substring(32, 64), 'hex');
    const encrypted = encryptedData.substring(64);
    
    const decipher = crypto.createDecipher('aes-256-gcm', LOG_CONFIG.encryptionKey);
    decipher.setAuthTag(authTag);
    decipher.setIV(iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Log decryption error:', error);
    return null;
  }
}

// Generate log hash for integrity verification
export function generateLogHash(entry: any): string {
  if (!LOG_CONFIG.enableHashing) {
    return '';
  }
  
  const logString = JSON.stringify(entry);
  return crypto.createHash('sha256').update(logString).digest('hex');
}

// Sign log entry for non-repudiation
export function signLogEntry(entry: any): { signature: string; timestamp: number } {
  if (!LOG_CONFIG.enableSigning) {
    return { signature: '', timestamp: Date.now() };
  }
  
  const logString = JSON.stringify(entry);
  const timestamp = Date.now();
  const dataToSign = logString + timestamp;
  
  const signature = crypto
    .createHmac('sha256', LOG_CONFIG.encryptionKey)
    .update(dataToSign)
    .digest('hex');
  
  return { signature, timestamp };
}

// Verify log signature
export function verifyLogSignature(entry: any, signature: string, timestamp: number): boolean {
  if (!LOG_CONFIG.enableSigning) {
    return true;
  }
  
  const logString = JSON.stringify(entry);
  const dataToSign = logString + timestamp;
  
  const expectedSignature = crypto
    .createHmac('sha256', LOG_CONFIG.encryptionKey)
    .update(dataToSign)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Enhanced audit log creation with integrity
export async function createSecureAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: 'success' | 'failure' | 'warning';
}): Promise<void> {
  try {
    const timestamp = new Date();
    
    // Add integrity metadata
    const logEntry = {
      ...params,
      timestamp: timestamp.toISOString(),
      logId: crypto.randomUUID(),
      sequence: await getNextLogSequence(),
      integrity: {
        hash: generateLogHash(params),
        signature: signLogEntry(params),
        checksum: crypto.createHash('md5').update(JSON.stringify(params)).digest('hex')
      }
    };
    
    // Store encrypted log
    const encryptedEntry = encryptLogEntry(logEntry);
    
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        changes: params.changes ? JSON.stringify(params.changes) : null,
        metadata: params.metadata ? JSON.stringify({
          ...params.metadata,
          encrypted: true,
          integrity: logEntry.integrity
        }) : null,
        status: params.status || 'success',
        // Store encrypted data in a custom field or separate table
        encryptedData: LOG_CONFIG.enableEncryption ? encryptedEntry : null
      }
    });
    
    console.log('🔒 Secure audit log created:', {
      logId: logEntry.logId,
      action: params.action,
      entityType: params.entityType,
      encrypted: LOG_CONFIG.enableEncryption
    });
    
  } catch (error) {
    console.error('Failed to create secure audit log:', error);
    // Don't throw error to avoid breaking main application flow
  }
}

// Get next log sequence number
async function getNextLogSequence(): Promise<number> {
  try {
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });
    
    // Generate sequence from timestamp and random component
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return timestamp + random;
  } catch (error) {
    console.error('Failed to get log sequence:', error);
    return Date.now();
  }
}

// Verify log integrity
export async function verifyLogIntegrity(logId: string): Promise<{
  valid: boolean;
  issues: string[];
}> {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id: logId }
    });
    
    if (!log) {
      return { valid: false, issues: ['Log not found'] };
    }
    
    const issues: string[] = [];
    
    // Verify hash if enabled
    if (LOG_CONFIG.enableHashing && log.metadata) {
      const metadata = JSON.parse(log.metadata);
      if (metadata.integrity?.hash) {
        const expectedHash = generateLogHash({
          action: log.action,
          entityType: log.entityType,
          changes: log.changes ? JSON.parse(log.changes) : null
        });
        
        if (expectedHash !== metadata.integrity.hash) {
          issues.push('Hash mismatch - log may have been tampered with');
        }
      }
    }
    
    // Verify signature if enabled
    if (LOG_CONFIG.enableSigning && log.metadata) {
      const metadata = JSON.parse(log.metadata);
      if (metadata.integrity?.signature) {
        const isValid = verifyLogSignature(
          {
            action: log.action,
            entityType: log.entityType,
            changes: log.changes ? JSON.parse(log.changes) : null
          },
          metadata.integrity.signature.signature,
          metadata.integrity.signature.timestamp
        );
        
        if (!isValid) {
          issues.push('Signature verification failed - log authenticity compromised');
        }
      }
    }
    
    return { valid: issues.length === 0, issues };
    
  } catch (error) {
    console.error('Log integrity verification error:', error);
    return { valid: false, issues: ['Verification error'] };
  }
}

// Rotate old logs
export async function rotateLogs(): Promise<{
  deleted: number;
  archived: number;
  errors: string[];
}> {
  const result = { deleted: 0, archived: 0, errors: [] as string[] };
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOG_CONFIG.retentionDays);
    
    // Archive logs before cutoff date
    const logsToArchive = await prisma.auditLog.findMany({
      where: {
        createdAt: { lt: cutoffDate }
      },
      take: 1000 // Process in batches
    });
    
    if (logsToArchive.length > 0) {
      // In a real implementation, move to archive table or separate storage
      console.log(`📦 Archiving ${logsToArchive.length} old log entries`);
      
      // For now, we'll just mark them as archived
      await prisma.auditLog.updateMany({
        where: {
          id: { in: logsToArchive.map(log => log.id) }
        },
        data: {
          metadata: JSON.stringify({
            archived: true,
            archivedDate: new Date().toISOString(),
            archivedBy: 'system'
          })
        }
      });
      
      result.archived = logsToArchive.length;
    }
    
    // Delete very old logs (beyond extended retention)
    const extendedCutoff = new Date();
    extendedCutoff.setDate(extendedCutoff.getDate() - (LOG_CONFIG.retentionDays * 2));
    
    const deleteResult = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: extendedCutoff }
      }
    });
    
    result.deleted = deleteResult.count;
    
    console.log(`🗑️  Log rotation completed:`, {
      archived: result.archived,
      deleted: result.deleted,
      retentionDays: LOG_CONFIG.retentionDays
    });
    
  } catch (error) {
    result.errors.push(error.message);
    console.error('Log rotation error:', error);
  }
  
  return result;
}

// Get log integrity report
export async function getLogIntegrityReport(): Promise<{
  totalLogs: number;
  encryptedLogs: number;
  signedLogs: number;
  integrityIssues: number;
  lastRotation: Date | null;
}> {
  try {
    const [totalLogs, encryptedLogs, signedLogs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          metadata: { contains: 'encrypted' }
        }
      }),
      prisma.auditLog.count({
        where: {
          metadata: { contains: 'signature' }
        }
      })
    ]);
    
    // Check for integrity issues
    const integrityIssues = await prisma.auditLog.count({
      where: {
        metadata: { contains: 'tampered' }
      }
    });
    
    return {
      totalLogs,
      encryptedLogs,
      signedLogs,
      integrityIssues,
      lastRotation: null // This would be tracked separately
    };
    
  } catch (error) {
    console.error('Log integrity report error:', error);
    return {
      totalLogs: 0,
      encryptedLogs: 0,
      signedLogs: 0,
      integrityIssues: 0,
      lastRotation: null
    };
  }
}