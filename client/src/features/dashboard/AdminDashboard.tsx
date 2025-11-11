import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useAssetsStore } from '@/features/assets/store';
import { useTicketsStore } from '@/features/tickets/store';
import { useUsersStore } from '@/features/users/store';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  gray: '#6B7280',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Zustand stores
  const { assets, fetchAssets, bulkCreateAssets } = useAssetsStore();
  const { tickets, fetchTickets } = useTicketsStore();
  const { users, fetchUsers } = useUsersStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchAssets();
    fetchTickets();
    fetchUsers();
  }, [fetchAssets, fetchTickets, fetchUsers]);

  const stats = useMemo(
    () => [
      {
        title: 'Total Assets',
        value: assets.length,
        detail: `${assets.filter((a) => a.status === 'assigned').length} assigned`,
        color: 'bg-blue-500',
      },
      {
        title: 'Open Tickets',
        value: tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length,
        detail: `${tickets.filter((t) => t.priority === 'high' || t.priority === 'critical').length} high priority`,
        color: 'bg-yellow-500',
      },
      {
        title: 'Total Users',
        value: users.length,
        detail: `${users.filter((u) => u.role === 'ADMIN').length} admins`,
        color: 'bg-purple-500',
      },
      {
        title: 'Maintenance',
        value: assets.filter((a) => ['maintenance', 'repair'].includes(a.status)).length,
        detail: 'Assets in service',
        color: 'bg-red-500',
      },
    ],
    [assets, tickets, users]
  );

  // Chart data
  const ticketStatusData = useMemo(() => [
    { name: 'Open', value: tickets.filter((t) => t.status === 'open').length, color: COLORS.blue },
    { name: 'In Progress', value: tickets.filter((t) => t.status === 'in_progress').length, color: COLORS.purple },
    { name: 'Closed', value: tickets.filter((t) => t.status === 'closed').length, color: COLORS.gray },
  ], [tickets]);

  const ticketPriorityData = useMemo(() => [
    { name: 'Low', value: tickets.filter((t) => t.priority === 'low').length, color: COLORS.green },
    { name: 'Medium', value: tickets.filter((t) => t.priority === 'medium').length, color: COLORS.yellow },
    { name: 'High', value: tickets.filter((t) => t.priority === 'high').length, color: COLORS.red },
    { name: 'Critical', value: tickets.filter((t) => t.priority === 'critical').length, color: COLORS.red },
  ], [tickets]);

  const assetStatusData = useMemo(() => [
    { name: 'Available', value: assets.filter((a) => a.status === 'available').length },
    { name: 'Assigned', value: assets.filter((a) => a.status === 'assigned').length },
    { name: 'Maintenance', value: assets.filter((a) => a.status === 'maintenance').length },
    { name: 'Retired', value: assets.filter((a) => a.status === 'retired').length },
  ], [assets]);

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
      
      await bulkCreateAssets(valid);
      setUploadStatus({ type: 'success', message: `Successfully imported ${valid.length} assets!` });
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.title} className="border rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{s.title}</p>
                <p className="text-3xl font-bold mt-2">{s.value}</p>
                <p className="text-sm text-gray-600 mt-1">{s.detail}</p>
              </div>
              <div className={`w-12 h-12 ${s.color} rounded-lg opacity-10`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ticket Status Chart */}
        <div className="border rounded-lg bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Priority Chart */}
        <div className="border rounded-lg bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ticketPriorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.blue}>
                {ticketPriorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Status Chart */}
        <div className="border rounded-lg bg-white p-6 shadow-sm md:col-span-2">
          <h3 className="font-semibold mb-4">Assets by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assetStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={COLORS.blue} name="Assets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CSV Upload Section */}
      <div className="border rounded-lg bg-white shadow-sm">
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
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? 'Uploading...' : 'Upload CSV File'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Asset Management</h3>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => navigate('/assets')} className="w-full text-left px-4 py-2 rounded-md border hover:bg-gray-50">
              Manage All Assets ({assets.length})
            </button>
            <button onClick={() => navigate('/assets')} className="w-full text-left px-4 py-2 rounded-md border hover:bg-gray-50">
              Assets in Maintenance ({assets.filter((a) => ['maintenance', 'repair'].includes(a.status)).length})
            </button>
          </div>
        </div>

        <div className="border rounded-lg bg-white shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Ticket Management</h3>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => navigate('/tickets')} className="w-full text-left px-4 py-2 rounded-md border hover:bg-gray-50">
              Open Tickets ({tickets.filter((t) => t.status === 'open').length})
            </button>
            <button onClick={() => navigate('/tickets')} className="w-full text-left px-4 py-2 rounded-md border hover:bg-gray-50">
              High Priority ({tickets.filter((t) => t.priority === 'high' || t.priority === 'critical').length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}