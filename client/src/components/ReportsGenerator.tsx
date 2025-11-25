import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Settings,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import toast from 'react-hot-toast';

export default function ReportsGenerator() {
  const [reportType, setReportType] = useState('assets');
  const [format, setFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    location: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: 'assets', label: 'Asset Report', description: 'Complete asset inventory' },
    { value: 'tickets', label: 'Ticket Report', description: 'Ticket statistics and details' },
    { value: 'inventory', label: 'Inventory Report', description: 'Stock levels and valuations' },
    { value: 'depreciation', label: 'Depreciation Report', description: 'Asset depreciation schedules' },
    { value: 'maintenance', label: 'Maintenance Report', description: 'Maintenance history and schedules' },
    { value: 'audit', label: 'Audit Log Report', description: 'System activity audit trail' },
  ];

  const formats = [
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
    { value: 'csv', label: 'CSV', icon: File },
  ];

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      const apiClient = getApiClient();

      const response = await apiClient.post(
        '/reports/generate',
        {
          reportType,
          format,
          dateRange,
          filters,
        },
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const extension = format === 'xlsx' ? 'xlsx' : format;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${reportType}_report_${timestamp}.${extension}`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reports Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate custom reports with filters and export in various formats
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Select Report Type
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setReportType(type.value)}
              className={`p-4 text-left rounded-lg border-2 transition-all ${
                reportType === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {type.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {type.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Date Range (Optional)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Additional Filters (Optional)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              placeholder="Enter category"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              placeholder="Enter location"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Export Format
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            return (
              <button
                key={fmt.value}
                onClick={() => setFormat(fmt.value)}
                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  format === fmt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Recent Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Reports
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your recently generated reports will appear here
        </p>
      </div>
    </div>
  );
}
