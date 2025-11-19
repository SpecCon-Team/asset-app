import React, { useState, useEffect } from 'react';
import { useAssetsStore } from '@/features/assets/store';
import { useTicketsStore } from '@/features/tickets/store';
import { Download, FileSpreadsheet, Calendar, TrendingUp, Users, Ticket, Package } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate, formatDateTime } from '@/lib/dateFormatter';
import toast from 'react-hot-toast';

const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  gray: '#6B7280',
  orange: '#F97316',
  pink: '#EC4899',
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

export default function AnalyticsPage() {
  const { assets, fetchAssets } = useAssetsStore();
  const { tickets, fetchTickets } = useTicketsStore();

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // Default: last month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchAssets();
    fetchTickets();
  }, [fetchAssets, fetchTickets]);

  // Filter data by date range
  const filteredTickets = tickets.filter(ticket => {
    const ticketDate = new Date(ticket.createdAt);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include full end date
    return ticketDate >= start && ticketDate <= end;
  });

  const filteredAssets = assets.filter(asset => {
    const assetDate = new Date(asset.createdAt);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return assetDate >= start && assetDate <= end;
  });

  // Calculate statistics
  const stats = {
    totalTickets: filteredTickets.length,
    openTickets: filteredTickets.filter(t => t.status === 'open').length,
    inProgressTickets: filteredTickets.filter(t => t.status === 'in_progress').length,
    closedTickets: filteredTickets.filter(t => t.status === 'closed').length,
    highPriorityTickets: filteredTickets.filter(t => t.priority === 'high' || t.priority === 'critical').length,
    totalAssets: filteredAssets.length,
    availableAssets: filteredAssets.filter(a => a.status === 'available').length,
    assignedAssets: filteredAssets.filter(a => a.status === 'assigned').length,
    maintenanceAssets: filteredAssets.filter(a => a.status === 'maintenance').length,
  };

  // Chart data
  const ticketStatusData = [
    { name: 'Open', value: stats.openTickets, color: COLORS.blue },
    { name: 'In Progress', value: stats.inProgressTickets, color: COLORS.purple },
    { name: 'Closed', value: stats.closedTickets, color: COLORS.gray },
  ].filter(item => item.value > 0);

  const ticketPriorityData = [
    { name: 'Low', value: filteredTickets.filter(t => t.priority === 'low').length, color: COLORS.green },
    { name: 'Medium', value: filteredTickets.filter(t => t.priority === 'medium').length, color: COLORS.yellow },
    { name: 'High', value: filteredTickets.filter(t => t.priority === 'high').length, color: COLORS.orange },
    { name: 'Critical', value: filteredTickets.filter(t => t.priority === 'critical').length, color: COLORS.red },
  ].filter(item => item.value > 0);

  const assetStatusData = [
    { name: 'Available', value: stats.availableAssets, color: COLORS.green },
    { name: 'Assigned', value: stats.assignedAssets, color: COLORS.blue },
    { name: 'Maintenance', value: stats.maintenanceAssets, color: COLORS.yellow },
    { name: 'Retired', value: filteredAssets.filter(a => a.status === 'retired').length, color: COLORS.gray },
  ].filter(item => item.value > 0);

  // Tickets over time (grouped by day)
  const ticketsOverTime = (() => {
    const dateMap = new Map<string, number>();
    filteredTickets.forEach(ticket => {
      const date = formatDate(ticket.createdAt);
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 data points
  })();

  // Export to Excel
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Analytics Report'],
        ['Date Range:', `${startDate} to ${endDate}`],
        ['Generated:', new Date().toLocaleString()],
        [],
        ['Ticket Statistics'],
        ['Total Tickets', stats.totalTickets],
        ['Open', stats.openTickets],
        ['In Progress', stats.inProgressTickets],
        ['Closed', stats.closedTickets],
        ['High Priority', stats.highPriorityTickets],
        [],
        ['Asset Statistics'],
        ['Total Assets', stats.totalAssets],
        ['Available', stats.availableAssets],
        ['Assigned', stats.assignedAssets],
        ['Maintenance', stats.maintenanceAssets],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Tickets sheet
      const ticketsData = filteredTickets.map(ticket => ({
        'Ticket #': ticket.number || ticket.id,
        'Title': ticket.title,
        'Status': ticket.status,
        'Priority': ticket.priority,
        'Assigned To': ticket.assignedTo?.name || ticket.assignedTo?.email || 'Unassigned',
        'Created': formatDateTime(ticket.createdAt),
        'Updated': formatDateTime(ticket.updatedAt),
      }));
      const ticketsSheet = XLSX.utils.json_to_sheet(ticketsData);
      XLSX.utils.book_append_sheet(wb, ticketsSheet, 'Tickets');

      // Assets sheet
      const assetsData = filteredAssets.map(asset => ({
        'Asset Code': asset.asset_code,
        'Name': asset.name,
        'Category': asset.category || 'N/A',
        'Status': asset.status,
        'Location': asset.location || 'N/A',
        'Assigned To': asset.assignedTo?.name || asset.assignedTo?.email || 'Unassigned',
        'Created': formatDateTime(asset.createdAt),
      }));
      const assetsSheet = XLSX.utils.json_to_sheet(assetsData);
      XLSX.utils.book_append_sheet(wb, assetsSheet, 'Assets');

      // Write file
      XLSX.writeFile(wb, `analytics_report_${startDate}_to_${endDate}.xlsx`);
      toast.success('Excel report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export Excel report');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Blue
      doc.text('Analytics Report', 14, 20);

      // Date range
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

      let yPos = 45;

      // Ticket Statistics
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Ticket Statistics', 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Count']],
        body: [
          ['Total Tickets', stats.totalTickets],
          ['Open', stats.openTickets],
          ['In Progress', stats.inProgressTickets],
          ['Closed', stats.closedTickets],
          ['High Priority', stats.highPriorityTickets],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Asset Statistics
      doc.setFontSize(14);
      doc.text('Asset Statistics', 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Count']],
        body: [
          ['Total Assets', stats.totalAssets],
          ['Available', stats.availableAssets],
          ['Assigned', stats.assignedAssets],
          ['Maintenance', stats.maintenanceAssets],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // New page for detailed data
      doc.addPage();

      // Tickets table
      doc.setFontSize(14);
      doc.text('Tickets Detail', 14, 20);

      autoTable(doc, {
        startY: 28,
        head: [['Ticket #', 'Title', 'Status', 'Priority', 'Created']],
        body: filteredTickets.slice(0, 50).map(ticket => [
          ticket.number || ticket.id?.slice(0, 8),
          ticket.title.length > 30 ? ticket.title.slice(0, 30) + '...' : ticket.title,
          ticket.status || 'N/A',
          ticket.priority || 'N/A',
          formatDate(ticket.createdAt),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] }, // Purple
        styles: { fontSize: 8 },
      });

      // Save
      doc.save(`analytics_report_${startDate}_to_${endDate}.pdf`);
      toast.success('PDF report exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF report');
    }
  };

  // Quick date range presets
  const setDatePreset = (preset: 'week' | 'month' | 'quarter' | 'year' | 'all') => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'all':
        start.setFullYear(2000); // Go back to year 2000
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics & Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate comprehensive reports with custom date ranges</p>
      </div>

      {/* Date Range Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Date Range</h2>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setDatePreset('week')}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-medium transition-colors"
          >
            Last Week
          </button>
          <button
            onClick={() => setDatePreset('month')}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-medium transition-colors"
          >
            Last Month
          </button>
          <button
            onClick={() => setDatePreset('quarter')}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-medium transition-colors"
          >
            Last Quarter
          </button>
          <button
            onClick={() => setDatePreset('year')}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-medium transition-colors"
          >
            Last Year
          </button>
          <button
            onClick={() => setDatePreset('all')}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-medium transition-colors"
          >
            All Time
          </button>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportToExcel}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export to Excel
          </button>
          <button
            onClick={exportToPDF}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export to PDF
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Ticket className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalTickets}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Tickets</h3>
          <p className="text-sm opacity-90">In selected period</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.openTickets}</span>
          </div>
          <h3 className="text-lg font-semibold">Open Tickets</h3>
          <p className="text-sm opacity-90">Awaiting response</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalAssets}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Assets</h3>
          <p className="text-sm opacity-90">In inventory</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.highPriorityTickets}</span>
          </div>
          <h3 className="text-lg font-semibold">High Priority</h3>
          <p className="text-sm opacity-90">Requires attention</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Ticket Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Priority Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ticketPriorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8B5CF6">
                {ticketPriorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Assets by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {assetStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets Over Time Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tickets Created Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ticketsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke={COLORS.blue} strokeWidth={2} name="Tickets" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ticket Summary</h3>
          <table className="w-full">
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">Total Tickets</td>
                <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{stats.totalTickets}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">Open</td>
                <td className="py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{stats.openTickets}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">In Progress</td>
                <td className="py-3 text-right font-semibold text-purple-600 dark:text-purple-400">{stats.inProgressTickets}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">Closed</td>
                <td className="py-3 text-right font-semibold text-gray-600 dark:text-gray-400">{stats.closedTickets}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">High Priority</td>
                <td className="py-3 text-right font-semibold text-red-600 dark:text-red-400">{stats.highPriorityTickets}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Asset Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Asset Summary</h3>
          <table className="w-full">
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">Total Assets</td>
                <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">{stats.totalAssets}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">Available</td>
                <td className="py-3 text-right font-semibold text-green-600 dark:text-green-400">{stats.availableAssets}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">Assigned</td>
                <td className="py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{stats.assignedAssets}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700 dark:text-gray-300">Maintenance</td>
                <td className="py-3 text-right font-semibold text-yellow-600 dark:text-yellow-400">{stats.maintenanceAssets}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
