import { prisma } from './prisma';
import type { Request } from 'express';

interface AuditLogParams {
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
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
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
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        status: params.status || 'success',
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Helper to log from Express request
 */
export async function logAudit(
  req: Request,
  action: string,
  entityType: string,
  entityId?: string,
  changes?: Record<string, any>,
  metadata?: Record<string, any>
) {
  const user = (req as any).user;

  await createAuditLog({
    action,
    entityType,
    entityId,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name,
    ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
    userAgent: req.get('user-agent'),
    changes,
    metadata,
  });
}

/**
 * Log user authentication events
 */
export async function logAuth(
  action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_RESET' | 'LOGIN_FAILED',
  email: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
) {
  await createAuditLog({
    action,
    entityType: 'User',
    entityId: userId,
    userId,
    userEmail: email,
    ipAddress,
    userAgent,
    metadata,
    status: action.includes('FAILED') ? 'failure' : 'success',
  });
}

/**
 * Log data export events (GDPR compliance)
 */
export async function logExport(
  userId: string,
  userEmail: string,
  exportType: string,
  ipAddress?: string,
  metadata?: Record<string, any>
) {
  await createAuditLog({
    action: 'EXPORT',
    entityType: exportType,
    userId,
    userEmail,
    ipAddress,
    metadata,
  });
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
