/**
 * Role-Based Field Visibility System
 * Controls which fields users can view/edit based on their role
 */

export type Role = 'ADMIN' | 'TECHNICIAN' | 'USER' | 'PEG';
export type Permission = 'read' | 'write' | 'none';

interface FieldPermissions {
  [key: string]: {
    [role in Role]: Permission;
  };
}

/**
 * Asset Field Permissions
 */
export const assetFieldPermissions: FieldPermissions = {
  // Basic fields - all roles can read
  id: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  asset_code: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  name: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  serial_number: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  asset_type: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  condition: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  status: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  description: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  office_location: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  department: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  notes: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'none' },

  // Sensitive fields - admin only (but allow technicians to write remote_id)
  remote_id: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },
  ownership: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },
  extension: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },

  // Assignment fields - allow technicians to assign assets
  assigned_to: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  ownerId: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  pegClientId: { ADMIN: 'write', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  scanned_by: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },
  scan_datetime: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },

  // Peripheral equipment
  deskphones: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  mouse: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  keyboard: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },

  // Metadata
  createdAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  updatedAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
};

/**
 * User Field Permissions
 */
export const userFieldPermissions: FieldPermissions = {
  // Basic public fields
  id: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  email: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'read' },
  name: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'write' },
  role: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'read' },
  isAvailable: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  profilePicture: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  bio: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },

  // Sensitive personal info - admin and self only
  phone: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'none', USER: 'none' },
  department: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'read' },
  location: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'read' },

  // WhatsApp integration fields
  isWhatsAppUser: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  whatsAppNotifications: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'write' },

  // Security fields - admin only
  password: { ADMIN: 'none', PEG: 'none', TECHNICIAN: 'none', USER: 'none' }, // Never expose
  twoFactorEnabled: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'none', USER: 'none' },
  twoFactorSecret: { ADMIN: 'none', PEG: 'none', TECHNICIAN: 'none', USER: 'none' }, // Never expose
  backupCodes: { ADMIN: 'none', PEG: 'none', TECHNICIAN: 'none', USER: 'none' }, // Never expose
  resetPasswordToken: { ADMIN: 'none', PEG: 'none', TECHNICIAN: 'none', USER: 'none' },
  verificationOTP: { ADMIN: 'none', PEG: 'none', TECHNICIAN: 'none', USER: 'none' },
  loginAttempts: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'none', USER: 'none' },
  lockoutUntil: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'none', USER: 'none' },

  // Metadata
  createdAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  updatedAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
};

/**
 * Ticket Field Permissions
 */
export const ticketFieldPermissions: FieldPermissions = {
  // Basic fields
  id: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  number: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  title: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  description: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  status: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  priority: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  resolution: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },

  // Assignment
  createdById: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  assignedToId: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },
  assetId: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },

  // Nested relations - allow all roles to read
  createdBy: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  assignedTo: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  asset: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },

  // Metadata
  createdAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  updatedAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
};

/**
 * Check if a user has permission to access a field
 */
export function hasFieldPermission(
  role: Role,
  entityType: 'asset' | 'user' | 'ticket',
  fieldName: string,
  requiredPermission: 'read' | 'write'
): boolean {
  let permissions: FieldPermissions;

  switch (entityType) {
    case 'asset':
      permissions = assetFieldPermissions;
      break;
    case 'user':
      permissions = userFieldPermissions;
      break;
    case 'ticket':
      permissions = ticketFieldPermissions;
      break;
    default:
      return false;
  }

  const fieldPermission = permissions[fieldName]?.[role];

  if (!fieldPermission || fieldPermission === 'none') {
    return false;
  }

  if (requiredPermission === 'write') {
    return fieldPermission === 'write';
  }

  // For read, both 'read' and 'write' permissions work
  return fieldPermission === 'read' || fieldPermission === 'write';
}

/**
 * Filter object fields based on user role and permission
 */
export function filterFieldsByPermission<T extends Record<string, any>>(
  data: T,
  role: Role,
  entityType: 'asset' | 'user' | 'ticket',
  requiredPermission: 'read' | 'write' = 'read'
): Partial<T> {
  const filtered: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    if (hasFieldPermission(role, entityType, key, requiredPermission)) {
      filtered[key as keyof T] = value;
    }
  }

  return filtered;
}

/**
 * Get list of readable fields for a role
 */
export function getReadableFields(
  role: Role,
  entityType: 'asset' | 'user' | 'ticket'
): string[] {
  let permissions: FieldPermissions;

  switch (entityType) {
    case 'asset':
      permissions = assetFieldPermissions;
      break;
    case 'user':
      permissions = userFieldPermissions;
      break;
    case 'ticket':
      permissions = ticketFieldPermissions;
      break;
    default:
      return [];
  }

  return Object.entries(permissions)
    .filter(([_, rolePerms]) => {
      const perm = rolePerms[role];
      return perm === 'read' || perm === 'write';
    })
    .map(([field]) => field);
}

/**
 * Get list of writable fields for a role
 */
export function getWritableFields(
  role: Role,
  entityType: 'asset' | 'user' | 'ticket'
): string[] {
  let permissions: FieldPermissions;

  switch (entityType) {
    case 'asset':
      permissions = assetFieldPermissions;
      break;
    case 'user':
      permissions = userFieldPermissions;
      break;
    case 'ticket':
      permissions = ticketFieldPermissions;
      break;
    default:
      return [];
  }

  return Object.entries(permissions)
    .filter(([_, rolePerms]) => rolePerms[role] === 'write')
    .map(([field]) => field);
}

/**
 * Validate if user can update specific fields
 */
export function validateFieldUpdates(
  role: Role,
  entityType: 'asset' | 'user' | 'ticket',
  updates: Record<string, any>
): { valid: boolean; invalidFields: string[] } {
  const invalidFields: string[] = [];

  for (const fieldName of Object.keys(updates)) {
    if (!hasFieldPermission(role, entityType, fieldName, 'write')) {
      invalidFields.push(fieldName);
    }
  }

  return {
    valid: invalidFields.length === 0,
    invalidFields,
  };
}

/**
 * Get sensitive fields that should be masked for a role
 */
export function getSensitiveFields(
  role: Role,
  entityType: 'asset' | 'user' | 'ticket'
): string[] {
  let permissions: FieldPermissions;

  switch (entityType) {
    case 'asset':
      permissions = assetFieldPermissions;
      break;
    case 'user':
      permissions = userFieldPermissions;
      break;
    case 'ticket':
      permissions = ticketFieldPermissions;
      break;
    default:
      return [];
  }

  return Object.entries(permissions)
    .filter(([_, rolePerms]) => rolePerms[role] === 'none')
    .map(([field]) => field);
}
