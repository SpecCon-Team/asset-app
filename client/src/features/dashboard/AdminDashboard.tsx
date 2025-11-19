import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useAssetsStore } from '@/features/assets/store';
import { useTicketsStore } from '@/features/tickets/store';
import { useUsersStore } from '@/features/users/store';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  gray: '#6B7280',
};

// Custom Tooltip Component with Dark Mode Support
const CustomTooltip = ({ active, payload, label }: any) => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: isDarkMode ? '1px solid #4B5563' : '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {label && (
          <p
            style={{
              fontWeight: 'bold',
              color: isDarkMode ? '#F3F4F6' : '#1F2937',
              marginBottom: '8px',
              fontSize: '14px',
            }}
          >
            {label}
          </p>
        )}
        {payload.map((entry: any, index: number) => (
          <p
            key={`item-${index}`}
            style={{
              color: isDarkMode ? '#D1D5DB' : '#4B5563',
              margin: '4px 0',
              fontSize: '13px',
            }}
          >
            <span style={{ color: entry.color, fontWeight: '600' }}>
              {entry.name}:
            </span>{' '}
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
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
  const [liveData, setLiveData] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchAssets();
    fetchTickets();
    fetchUsers();
  }, [fetchAssets, fetchTickets, fetchUsers]);

  // Initialize and update live chart data for ticket traffic - REAL DATA ONLY
  useEffect(() => {
    // Get current real ticket counts (memoized to avoid recalculation)
    const getCurrentCounts = () => ({
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
    });

    // Initialize with real current data (repeated for history view)
    const now = new Date();
    const currentCounts = getCurrentCounts();
    const initialData = Array.from({ length: 20 }, (_, i) => {
      const time = new Date(now.getTime() - (19 - i) * 180000); // 3 minute intervals for 1 hour history

      return {
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        open: currentCounts.open,
        in_progress: currentCounts.in_progress,
        closed: currentCounts.closed,
        total: currentCounts.open + currentCounts.in_progress + currentCounts.closed,
      };
    });

    setLiveData(initialData);

    // Update with REAL ticket data every 5 minutes (reduced from 3 minutes)
    // Only refresh when tab is visible to reduce server load
    let interval: NodeJS.Timeout | null = null;

    const startInterval = () => {
      if (!document.hidden && !interval) {
        interval = setInterval(() => {
          if (!document.hidden) {
            const currentTickets = getCurrentCounts();
            const total = currentTickets.open + currentTickets.in_progress + currentTickets.closed;

            setLiveData((prev) => {
              const newData = [...prev.slice(1), {
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                ...currentTickets,
                total,
              }];
              return newData;
            });

            // Refresh tickets to get latest data from server
            fetchTickets();
          }
        }, 300000); // 5 minutes = 300000 milliseconds (increased from 3 minutes)
      }
    };

    const stopInterval = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startInterval();

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tickets, fetchTickets]);

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
      'Name,SerialNumber,RemoteID,AssetType,Condition,AssignedTo,ScannedBy,ScanDateTime,Description,Ownership,Office Location,Extension,Deskphones,Mouse,Keyboard,Department\n' +
      'Dell Laptop,SN123456789,RMT-001,Laptop,Good,john@company.com,admin@company.com,2024-01-15,Dell Latitude 5520,Company,Building A - Floor 2,2501,IP Phone Model X,Wireless Mouse,Mechanical Keyboard,IT\n' +
      'HP Monitor,SN987654321,RMT-002,Monitor,Excellent,jane@company.com,admin@company.com,2024-01-16,HP E24 24 inch,Company,Building A - Floor 3,2502,N/A,Wired Mouse,Wireless Keyboard,Marketing';
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
      const normalized = parsed.map((row) => {
        const assetData: any = {
          name: String(row.Name || row.name || '').trim(),
          serial_number: String(row.SerialNumber || row.serialnumber || row.serial_number || '').trim(),
          remote_id: String(row.RemoteID || row.remoteid || row.remote_id || '').trim(),
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
        };

        // AssetID is optional - if provided, use it; otherwise it will be auto-generated
        const assetId = String(row.AssetID || row.assetid || '').trim();
        if (assetId) {
          assetData.asset_code = assetId;
        }

        return assetData;
      });
      const valid = normalized.filter((a) => a.name);
      if (valid.length === 0) throw new Error('No valid assets found in CSV. Ensure Name column is filled.');
      
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
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage assets, tickets, and users</p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {stats.map((s) => (
          <div
            key={s.title}
            className="group relative border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md dark:hover:shadow-xl transition-all duration-300"
            role="article"
            aria-label={`${s.title}: ${s.value}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Label - Responsive */}
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
                  {s.title}
                </p>

                {/* Value - Responsive size */}
                <p className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  {s.value}
                </p>

                {/* Detail - Responsive */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {s.detail}
                </p>
              </div>

              {/* Icon - Responsive size */}
              <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 ${s.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white dark:bg-gray-900 rounded-full opacity-80"></div>
              </div>
            </div>

            {/* Hover indicator */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 dark:group-hover:border-blue-400 rounded-xl transition-colors pointer-events-none"></div>
          </div>
        ))}
      </div>

      {/* Charts Row - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Ticket Status Chart */}
        <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 shadow-sm">
          <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg text-gray-900 dark:text-white">Tickets by Status</h3>

          {/* Count Summary - Responsive */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {ticketStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.name}</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Priority Chart */}
        <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 shadow-sm">
          <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg text-gray-900 dark:text-white">Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ticketPriorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={COLORS.blue}>
                {ticketPriorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Live Ticket Traffic Monitor - BEAST MODE - Responsive */}
        <div className="relative border dark:border-gray-700 rounded-lg bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 sm:p-5 md:p-6 shadow-lg lg:col-span-2 overflow-hidden">
          {/* Animated background particles */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-20 right-20 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  🎫 Live Ticket Traffic Monitor
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time ticket flow • Updates every 3 minutes</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isAnimating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isAnimating ? 'LIVE' : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Legend - Responsive */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Open</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Closed</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <AreaChart
                data={liveData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" strokeOpacity={0.3} />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  style={{ fontSize: '11px' }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="open"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorOpen)"
                  animationDuration={1000}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="in_progress"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorInProgress)"
                  animationDuration={1000}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="closed"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorClosed)"
                  animationDuration={1000}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CSV Upload Section - Responsive */}
      <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <div className="p-3 sm:p-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">Bulk Asset Import (CSV)</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Asset codes are automatically generated - no need to provide them in the CSV
          </p>
        </div>
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {uploadStatus && (
            <div
              className={`rounded-md border p-2 sm:p-3 text-sm ${
                uploadStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
              }`}
            >
              {uploadStatus.message}
            </div>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md p-2 sm:p-3 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Asset codes will be automatically generated for all imported assets. You only need to provide the asset name and other details.
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={downloadCSVTemplate} className="px-3 sm:px-4 py-2 min-h-[44px] rounded-md border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-gray-100">
              Download Template
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 sm:px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base"
            >
              {uploading ? 'Uploading...' : 'Upload CSV File'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-3 sm:p-4 border-b dark:border-gray-700">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">Asset Management</h3>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            <button onClick={() => navigate('/assets')} className="w-full text-left px-3 sm:px-4 py-2 min-h-[44px] rounded-md border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-gray-100">
              Manage All Assets ({assets.length})
            </button>
            <button onClick={() => navigate('/assets')} className="w-full text-left px-3 sm:px-4 py-2 min-h-[44px] rounded-md border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-gray-100">
              Assets in Maintenance ({assets.filter((a) => ['maintenance', 'repair'].includes(a.status)).length})
            </button>
          </div>
        </div>

        <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-3 sm:p-4 border-b dark:border-gray-700">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">Ticket Management</h3>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            <button onClick={() => navigate('/tickets')} className="w-full text-left px-3 sm:px-4 py-2 min-h-[44px] rounded-md border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-gray-100">
              Open Tickets ({tickets.filter((t) => t.status === 'open').length})
            </button>
            <button onClick={() => navigate('/tickets')} className="w-full text-left px-3 sm:px-4 py-2 min-h-[44px] rounded-md border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-gray-100">
              High Priority ({tickets.filter((t) => t.priority === 'high' || t.priority === 'critical').length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}