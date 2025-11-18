import React from 'react';
import { useFieldPermissions } from '@/hooks/useFieldPermissions';

interface ProtectedFieldProps {
  entityType: 'asset' | 'user' | 'ticket';
  fieldName: string;
  value: any;
  requiredPermission?: 'read' | 'write';
  children?: React.ReactNode;
  maskValue?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render fields based on user permissions
 * Usage:
 *   <ProtectedField entityType="asset" fieldName="remote_id" value={asset.remote_id}>
 *     <span>{asset.remote_id}</span>
 *   </ProtectedField>
 */
export default function ProtectedField({
  entityType,
  fieldName,
  value,
  requiredPermission = 'read',
  children,
  maskValue = false,
  fallback = null,
}: ProtectedFieldProps) {
  const { canView, canEdit } = useFieldPermissions(entityType);

  // Check permission
  const hasPermission = requiredPermission === 'write'
    ? canEdit(fieldName)
    : canView(fieldName);

  // If no permission, show fallback or nothing
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  // If masking is requested, show masked value
  if (maskValue && value) {
    return <span className="text-gray-400">***</span>;
  }

  // Render children if provided, otherwise render value
  if (children) {
    return <>{children}</>;
  }

  // Default rendering of value
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400 dark:text-gray-500">N/A</span>;
  }

  return <span>{String(value)}</span>;
}

/**
 * Wrapper for form inputs with permission checks
 */
interface ProtectedInputProps {
  entityType: 'asset' | 'user' | 'ticket';
  fieldName: string;
  children: React.ReactElement;
  showReadOnly?: boolean;
}

export function ProtectedInput({
  entityType,
  fieldName,
  children,
  showReadOnly = true,
}: ProtectedInputProps) {
  const { canEdit, canView } = useFieldPermissions(entityType);

  // No permission to view at all
  if (!canView(fieldName)) {
    return null;
  }

  // Read-only access
  if (!canEdit(fieldName)) {
    if (!showReadOnly) {
      return null;
    }

    // Clone the child and add disabled prop
    return React.cloneElement(children, {
      disabled: true,
      className: `${children.props.className || ''} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`,
    });
  }

  // Full write access
  return children;
}
