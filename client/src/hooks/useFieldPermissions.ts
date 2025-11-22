import { useState, useEffect } from 'react';
import { canViewField, canEditField, getCurrentUserRole, Role } from '@/lib/permissions';

/**
 * Hook to check field permissions for the current user
 */
export function useFieldPermissions(entityType: 'asset' | 'user' | 'ticket') {
  const [userRole, setUserRole] = useState<Role>('USER');

  useEffect(() => {
    setUserRole(getCurrentUserRole());
  }, []);

  return {
    role: userRole,
    canView: (fieldName: string) => canViewField(userRole, entityType, fieldName),
    canEdit: (fieldName: string) => canEditField(userRole, entityType, fieldName),
    isAdmin: userRole === 'ADMIN',
    isTechnician: userRole === 'TECHNICIAN',
    isUser: userRole === 'USER',
  };
}
