/**
 * Export Utilities for CSV and Excel-like format
 * Provides data export functionality for assets, tickets, and other entities
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

/**
 * Convert data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Create CSV header
  const headers = columns.map(col => col.label).join(',');

  // Create CSV rows
  const rows = data.map(item => {
    return columns
      .map(col => {
        let value = item[col.key];

        // Apply custom formatter if provided
        if (col.format && value !== null && value !== undefined) {
          value = col.format(value);
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }

        // Convert to string and escape
        const stringValue = String(value);

        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
}

/**
 * Format boolean for export
 */
export function formatBooleanForExport(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'Yes' : 'No';
}

/**
 * Format array for export
 */
export function formatArrayForExport(arr: any[] | null | undefined): string {
  if (!arr || arr.length === 0) return '';
  return arr.join('; ');
}

/**
 * Format nested object for export
 */
export function formatObjectForExport(obj: any, key: string): string {
  if (!obj) return '';
  return obj[key] || '';
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: 'csv' | 'xlsx' = 'csv'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Download CSV template with headers only (for bulk import)
 */
export function downloadCSVTemplate(columns: ExportColumn[], filename: string): void {
  // Create CSV header only
  const headers = columns.map(col => col.label).join(',');

  // Add one example row with placeholder data to show format
  const exampleRow = columns.map(col => {
    // Provide example values based on label
    const label = col.label.toLowerCase();
    if (label.includes('email')) return 'example@email.com';
    if (label.includes('date')) return '2024-01-15';
    if (label.includes('status')) return 'active';
    if (label.includes('priority')) return 'medium';
    if (label.includes('code')) return 'ASSET-001';
    if (label.includes('number')) return '1';
    if (label.includes('price') || label.includes('value')) return '1000.00';
    if (label.includes('phone')) return '+1234567890';
    if (label.includes('yes/no') || label.includes('available')) return 'Yes';
    return 'Example value';
  }).join(',');

  // Combine header and example row
  const csv = [headers, exampleRow].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Asset-specific export columns
 */
export const ASSET_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'asset_code', label: 'Asset Code' },
  { key: 'name', label: 'Name' },
  { key: 'asset_type', label: 'Asset Type' },
  { key: 'type', label: 'Type' },
  { key: 'serial_number', label: 'Serial Number' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'model_number', label: 'Model Number' },
  { key: 'status', label: 'Status' },
  { key: 'condition', label: 'Condition' },
  { key: 'owner', label: 'Owner', format: (owner) => owner ? `${owner.name || owner.email}` : '' },
  { key: 'assigned_to', label: 'Assigned To' },
  { key: 'purchase_date', label: 'Purchase Date', format: formatDateForExport },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'current_value', label: 'Current Value' },
  { key: 'warranty_expiry', label: 'Warranty Expiry', format: formatDateForExport },
  { key: 'last_maintenance_date', label: 'Last Maintenance Date', format: formatDateForExport },
  { key: 'next_maintenance_date', label: 'Next Maintenance Date', format: formatDateForExport },
  { key: 'office_location', label: 'Office Location' },
  { key: 'department', label: 'Department' },
  { key: 'notes', label: 'Notes' },
  { key: 'createdAt', label: 'Created At', format: formatDateForExport },
  { key: 'updatedAt', label: 'Updated At', format: formatDateForExport },
];

/**
 * Ticket-specific export columns
 */
export const TICKET_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'number', label: 'Ticket Number' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'createdBy', label: 'Created By', format: (user) => user ? `${user.name || user.email}` : '' },
  { key: 'createdBy', label: 'Creator Email', format: (user) => user?.email || '' },
  { key: 'assignedTo', label: 'Assigned To', format: (user) => user ? `${user.name || user.email}` : '' },
  { key: 'assignedTo', label: 'Assignee Email', format: (user) => user?.email || '' },
  { key: 'asset', label: 'Asset Name', format: (asset) => asset?.name || '' },
  { key: 'asset', label: 'Asset Code', format: (asset) => asset?.asset_code || '' },
  { key: 'description', label: 'Description' },
  { key: 'resolution', label: 'Resolution' },
  { key: 'department', label: 'Department' },
  { key: 'due_date', label: 'Due Date', format: formatDateForExport },
  { key: 'time_spent', label: 'Time Spent (hours)' },
  { key: 'comments', label: 'Comments Count', format: (comments) => comments?.length || 0 },
  { key: 'createdAt', label: 'Created At', format: formatDateForExport },
  { key: 'updatedAt', label: 'Updated At', format: formatDateForExport },
  { key: 'closedAt', label: 'Closed At', format: formatDateForExport },
];

/**
 * User-specific export columns
 */
export const USER_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'phone', label: 'Phone' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'department', label: 'Department' },
  { key: 'office_location', label: 'Office Location' },
  { key: 'isAvailable', label: 'Available', format: formatBooleanForExport },
  { key: 'assets_count', label: 'Total Assets Assigned', format: (count) => count || 0 },
  { key: 'active_tickets', label: 'Active Tickets', format: (count) => count || 0 },
  { key: 'last_login', label: 'Last Login', format: formatDateForExport },
  { key: 'createdAt', label: 'Created At', format: formatDateForExport },
  { key: 'updatedAt', label: 'Updated At', format: formatDateForExport },
];

/**
 * Asset import template columns (simplified for bulk import)
 */
export const ASSET_IMPORT_TEMPLATE_COLUMNS: ExportColumn[] = [
  { key: 'asset_code', label: 'Asset Code (Required)' },
  { key: 'name', label: 'Name (Required)' },
  { key: 'asset_type', label: 'Asset Type' },
  { key: 'serial_number', label: 'Serial Number' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'model_number', label: 'Model Number' },
  { key: 'status', label: 'Status (available/assigned/maintenance/repair/retired)' },
  { key: 'condition', label: 'Condition (new/good/fair/poor)' },
  { key: 'purchase_date', label: 'Purchase Date (YYYY-MM-DD)' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'warranty_expiry', label: 'Warranty Expiry (YYYY-MM-DD)' },
  { key: 'office_location', label: 'Office Location' },
  { key: 'department', label: 'Department' },
  { key: 'notes', label: 'Notes' },
];

/**
 * Ticket import template columns (simplified for bulk import)
 */
export const TICKET_IMPORT_TEMPLATE_COLUMNS: ExportColumn[] = [
  { key: 'title', label: 'Title (Required)' },
  { key: 'description', label: 'Description (Required)' },
  { key: 'priority', label: 'Priority (low/medium/high/critical)' },
  { key: 'status', label: 'Status (open/in_progress/closed)' },
  { key: 'asset_code', label: 'Asset Code (Optional)' },
  { key: 'assignee_email', label: 'Assignee Email (Optional)' },
  { key: 'department', label: 'Department' },
  { key: 'due_date', label: 'Due Date (YYYY-MM-DD)' },
];

/**
 * User import template columns (simplified for bulk import)
 */
export const USER_IMPORT_TEMPLATE_COLUMNS: ExportColumn[] = [
  { key: 'name', label: 'Name (Required)' },
  { key: 'email', label: 'Email (Required)' },
  { key: 'role', label: 'Role (ADMIN/TECHNICIAN/USER)' },
  { key: 'phone', label: 'Phone' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'department', label: 'Department' },
  { key: 'office_location', label: 'Office Location' },
];
