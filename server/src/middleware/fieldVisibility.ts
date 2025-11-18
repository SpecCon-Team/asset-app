/**
 * Field Visibility Middleware
 * Automatically filters response data based on user role permissions
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { filterFieldsByPermission, Role } from '../lib/permissions';

/**
 * Middleware to filter response data based on field permissions
 */
export function applyFieldVisibility(entityType: 'asset' | 'user' | 'ticket') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    const userRole = req.user?.role as Role || 'USER';

    res.json = function (body: any): Response {
      // Skip filtering for error responses
      if (body?.error || body?.message) {
        return originalJson(body);
      }

      // Filter single object
      if (body && typeof body === 'object' && !Array.isArray(body) && !body.data) {
        const filtered = filterFieldsByPermission(body, userRole, entityType, 'read');
        return originalJson(filtered);
      }

      // Filter array of objects
      if (Array.isArray(body)) {
        const filtered = body.map(item =>
          filterFieldsByPermission(item, userRole, entityType, 'read')
        );
        return originalJson(filtered);
      }

      // Filter paginated response (has data array)
      if (body?.data && Array.isArray(body.data)) {
        const filtered = body.data.map((item: any) =>
          filterFieldsByPermission(item, userRole, entityType, 'read')
        );
        return originalJson({ ...body, data: filtered });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Helper to mask sensitive fields with placeholder
 */
export function maskSensitiveField(value: any, fieldName: string): string {
  if (value === null || value === undefined) {
    return value;
  }

  // Different masking strategies based on field type
  if (fieldName.includes('phone')) {
    return '***-***-****';
  }

  if (fieldName.includes('email')) {
    return '***@***.***';
  }

  if (fieldName.includes('password') || fieldName.includes('secret') || fieldName.includes('token')) {
    return '[REDACTED]';
  }

  if (typeof value === 'string' && value.length > 0) {
    return '***';
  }

  return '[HIDDEN]';
}

/**
 * Manually apply field filtering to data
 */
export function filterResponseData<T extends Record<string, any>>(
  data: T | T[],
  role: Role,
  entityType: 'asset' | 'user' | 'ticket'
): Partial<T> | Partial<T>[] {
  if (Array.isArray(data)) {
    return data.map(item => filterFieldsByPermission(item, role, entityType, 'read'));
  }

  return filterFieldsByPermission(data, role, entityType, 'read');
}
