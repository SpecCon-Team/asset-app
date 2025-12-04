/**
 * Frontend Field Visibility System
 * Mirrors backend permissions for consistent UI/UX
 */

export type Role = 'ADMIN' | 'TECHNICIAN' | 'USER' | 'PEG';
export type Permission = 'read' | 'write' | 'none';

interface FieldPermissions {
  [key: string]: {
    [role in Role]: Permission;
  };
}

/**
 * Asset Field Permissions (matches backend)
 */
export const assetFieldPermissions: FieldPermissions = {
  // Basic fields
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

  // Sensitive fields
  remote_id: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },
  ownership: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },
  extension: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },

  // Assignment
  assigned_to: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  scanned_by: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },
  scan_datetime: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },

  // Peripherals
  deskphones: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  mouse: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  keyboard: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },

  // Metadata
  createdAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  updatedAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
};

/**
 * User Field Permissions (matches backend)
 */
export const userFieldPermissions: FieldPermissions = {
  id: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  email: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'read' },
  name: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'write' },
  role: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'read' },
  isAvailable: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  profilePicture: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  bio: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  phone: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'none', USER: 'none' },
  department: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'read' },
  location: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'read', USER: 'read' },
  twoFactorEnabled: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'none', USER: 'none' },
  createdAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  updatedAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
};

/**
 * Ticket Field Permissions (matches backend)
 */
export const ticketFieldPermissions: FieldPermissions = {
  id: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  number: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  title: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  description: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'write' },
  status: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  priority: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  resolution: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  createdById: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  assignedToId: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'none' },
  assetId: { ADMIN: 'write', PEG: 'write', TECHNICIAN: 'write', USER: 'read' },
  createdAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
  updatedAt: { ADMIN: 'read', PEG: 'read', TECHNICIAN: 'read', USER: 'read' },
};

/**
 * Check if user can view a field
 */
export function canViewField(
  role: Role,
  entityType: 'asset' | 'user' | 'ticket',
  fieldName: string
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

  const permission = permissions[fieldName]?.[role];
  return permission === 'read' || permission === 'write';
}

/**
 * Check if user can edit a field
 */
export function canEditField(
  role: Role,
  entityType: 'asset' | 'user' | 'ticket',
  fieldName: string
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

  return permissions[fieldName]?.[role] === 'write';
}

/**
 * Get user role from localStorage
 */
export function getCurrentUserRole(): Role {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role as Role;
    }
  } catch (error) {
    console.error('Failed to get user role:', error);
  }
  return 'USER'; // Default to most restrictive
}

/**
 * Field label mapping (user-friendly names)
 */
export const fieldLabels: Record<string, string> = {
  // Asset fields
  asset_code: 'Asset Code',
  name: 'Name',
  serial_number: 'Serial Number',
  remote_id: 'Remote ID',
  asset_type: 'Type',
  condition: 'Condition',
  status: 'Status',
  assigned_to: 'Assigned To',
  scanned_by: 'Scanned By',
  scan_datetime: 'Scan Date/Time',
  description: 'Description',
  ownership: 'Ownership',
  office_location: 'Office Location',
  extension: 'Extension',
  deskphones: 'Desk Phones',
  mouse: 'Mouse',
  keyboard: 'Keyboard',
  department: 'Department',
  notes: 'Internal Notes',

  // User fields
  email: 'Email',
  phone: 'Phone',
  role: 'Role',
  isAvailable: 'Available',
  profilePicture: 'Profile Picture',
  bio: 'Bio',
  location: 'Location',
  twoFactorEnabled: '2FA Enabled',

  // Ticket fields
  number: 'Ticket Number',
  title: 'Title',
  priority: 'Priority',
  resolution: 'Resolution',
  createdById: 'Created By',
  assignedToId: 'Assigned To',
  assetId: 'Related Asset',

  // Common fields
  createdAt: 'Created',
  updatedAt: 'Updated',
};
