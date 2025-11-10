import React, { useMemo, useRef, useState } from 'react';
import { useAssets } from '@/features/assets/hooks';
import { useTickets } from '@/features/tickets/hooks';
import { useUsers } from '@/features/users/hooks';
import Papa from 'papaparse';
import { useBulkCreateAssets } from '@/features/assets/hooks';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { data: assets = [] } = useAssets();
  const { data: tickets = [] } = useTickets();
  const { data: users = [] } = useUsers();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const bulkMutation = useBulkCreateAssets();

  const stats = useMemo(
    () => [
      {
        title: 'Total Assets',
        value: assets.length,
        detail: `${assets.filter((a) => a.status === 'assigned').length} assigned`,
      },
      {
        title: 'Open Tickets',
        value: tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length,
        detail: `${tickets.filter((t) => t.priority === 'high' || t.priority === 'critical').length} high priority`,
      },
      {
        title: 'Total Users',
        value: users.length,
        detail: `${users.filter((u) => u.role === 'admin').length} admins`,
      },
      {
        title: 'Maintenance',
        value: assets.filter((a) => ['maintenance', 'repair'].includes(a.status)).length,
        detail: 'Assets in service',
      },
    ],
    [assets, tickets, users]
  );

  const downloadCSVTemplate = () => {
    const template =
      'AssetID,Name,AssetType,Condition,AssignedTo,ScannedBy,ScanDateTime,Description,Ownership,Office Location,Extension,Deskphones,Mouse,Keyboard,Department\n' +
      'AST001,Dell Laptop,Laptop,Good,john@company.com,admin@company.com,2024-01-15,Dell Latitude 5520,Company,Building A - Floor 2,2501,IP Phone Model X,Wireless Mouse,Mechanical Keyboard,IT\n' +
      'AST002,HP Monitor,Monitor,Excellent,jane@company.com,admin@company.com,2024-01-16,HP E24 24 inch,Company,Building A - Floor 3,2502,N/A,Wired Mouse,Wireless Keyboard,Marketing';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus(null);
    try {
      const parsed = await new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => resolve(result.data as any[]),
          error: (error) => reject(error),
        });
      });
      const normalized = parsed.map((row) => ({
        asset_code: String(row.AssetID || row.assetid || '').trim(),
        name: String(row.Name || row.name || '').trim(),
        asset_type: String(row.AssetType || row.assettype || '').trim(),
        condition: String(row.Condition || row.condition || '').trim(),
        assigned_to: String(row.AssignedTo || row.assignedto || '').trim(),
        scanned_by: String(row.ScannedBy || row.scannedby || '').trim(),
        scan_datetime: String(row.ScanDateTime || row.scandatetime || '').trim(),
        description: String(row.Description || row.description || '').trim(),
        ownership: String(row.Ownership || row.ownership || row.Onwership || '').trim(),
        office_location: String(row['Office Location'] || row.office_location || row.officelocation || '').trim(),
        extension: String(row.Extension || row.extension || '').trim(),
        deskphones: String(row.Deskphones || row.deskphones || '').trim(),
        mouse: String(row.Mouse || row.mouse || '').trim(),
        keyboard: String(row.Keyboard || row.keyboard || '').trim(),
        department: String(row.Department || row.department || '').trim(),
        status: 'available',
      }));
      const valid = normalized.filter((a) => a.asset_code && a.name);
      if (valid.length === 0) throw new Error('No valid assets found in CSV. Ensure AssetID and Name columns are filled.');
      const res = await bulkMutation.mutateAsync(valid);
      setUploadStatus({ type: 'success', message: `Successfully imported ${res.created} assets!` });
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: `Upload failed: ${err?.message ?? 'Unknown error'}` });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-gray-600">Manage assets, tickets, and users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.title} className="border rounded-lg bg-white p-4">
            <p className="text-sm text-gray-600">{s.title}</p>
            <p className="text-3xl font-bold mt-2">{s.value}</p>
            <p className="text-sm text-gray-600 mt-1">{s.detail}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg bg-white">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Bulk Asset Import (CSV)</h2>
        </div>
        <div className="p-4 space-y-4">
          {uploadStatus && (
            <div
              className={`rounded-md border p-3 ${
                uploadStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {uploadStatus.message}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={downloadCSVTemplate} className="px-4 py-2 rounded-md border hover:bg-gray-50">
              Download Template
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : 'Upload CSV File'}
            </button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-900 mb-1">CSV Format Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
              <li>
                <strong>AssetID</strong> - Unique identifier (required)
              </li>
              <li>
                <strong>Name</strong> - Asset name (required)
              </li>
              <li>
                <strong>AssetType</strong> - Type of asset (Laptop, Desktop, Monitor, etc.)
              </li>
              <li>
                <strong>Condition</strong> - Physical condition (Good, Excellent, Fair, Poor)
              </li>
              <li>
                <strong>AssignedTo</strong> - User email if assigned
              </li>
              <li>
                <strong>Ownership</strong> - Ownership type (Company, Personal, etc.)
              </li>
              <li>
                <strong>Office Location</strong> - Physical location
              </li>
              <li>Other fields: ScannedBy, ScanDateTime, Description, Extension, Deskphones, Mouse, Keyboard, Department</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg bg-white">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Asset Management</h3>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => navigate('/assets')} className="w-full justify-start px-4 py-2 rounded-md border hover:bg-gray-50">
              Manage All Assets ({assets.length})
            </button>
            <button className="w-full justify-start px-4 py-2 rounded-md border hover:bg-gray-50">
              Assets in Maintenance ({assets.filter((a) => ['maintenance', 'repair'].includes(a.status)).length})
            </button>
          </div>
        </div>

        <div className="border rounded-lg bg-white">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Ticket Management</h3>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => navigate('/tickets')} className="w-full justify-start px-4 py-2 rounded-md border hover:bg-gray-50">
              Open Tickets ({tickets.filter((t) => t.status === 'open').length})
            </button>
            <button className="w-full justify-start px-4 py-2 rounded-md border hover:bg-gray-50">
              High Priority ({tickets.filter((t) => t.priority === 'high' || t.priority === 'critical').length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


