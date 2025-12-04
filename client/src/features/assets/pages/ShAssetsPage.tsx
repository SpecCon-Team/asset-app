import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetsStore } from '../store';
import { Pencil, Eye, Trash2, Download, FileSpreadsheet, Upload, ArrowLeft } from 'lucide-react';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';
import { ConfirmDialog, CSVImportModal } from '@/components';
import toast from 'react-hot-toast';
import { exportToCSV, ASSET_EXPORT_COLUMNS, generateFilename, downloadCSVTemplate, ASSET_IMPORT_TEMPLATE_COLUMNS } from '@/lib/exportUtils';
import { getApiClient } from '@/features/assets/lib/apiClient';

export default function ShAssetsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { assets, isLoading, error, fetchAssets, deleteAsset } = useAssetsStore();

  // Enforce minimum 2 second loading time
  const loading = useMinLoadingTime(isLoading, 2000);

  // Redirect non-admin users
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        navigate('/my-assets');
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchAssets({ search, status: statusFilter });
  }, [search, statusFilter, fetchAssets]);

  // Refresh assets when page becomes visible (e.g., after returning from assignment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAssets({ search, status: statusFilter });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [search, statusFilter, fetchAssets]);

  // Filter to show only SH assets (assets without pegClientId)
  // Check for both null, undefined, and empty string
  const shAssets = assets.filter((a) => {
    return !a.pegClientId || (typeof a.pegClientId === 'string' && a.pegClientId.trim() === '');
  });

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    try {
      await deleteAsset(deleteConfirmId);
      toast.success('Asset deleted successfully');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      toast.error('Failed to delete asset');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/assets/${id}`);
  };

  const handleExportCSV = () => {
    try {
      const filename = generateFilename('sh_assets_export', 'csv');
      exportToCSV(shAssets, ASSET_EXPORT_COLUMNS, filename);
      toast.success(`Exported ${shAssets.length} SH assets to CSV`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export assets');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const filename = 'asset_import_template.csv';
      downloadCSVTemplate(ASSET_IMPORT_TEMPLATE_COLUMNS, filename);
      toast.success('Import template downloaded successfully');
    } catch (error) {
      console.error('Template download failed:', error);
      toast.error('Failed to download template');
    }
  };

  const handleImportCSV = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await getApiClient().post('/assets/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = response.data;

    // Refresh assets list after import
    await fetchAssets({ search, status: statusFilter });

    return result;
  };

  if (loading) {
    return <LoadingOverlay message="Loading SH assets..." />;
  }

  if (error) {
    return <div className="p-8 text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-900 min-h-screen">Error: {error}</div>;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/assets')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to All Assets"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">SH Assets Management</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage assets not assigned to PEG clients</p>
          </div>
        </div>

        {/* Action Buttons - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 sm:gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base min-h-[44px]"
            title="Download CSV template for bulk import"
          >
            <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Template</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base min-h-[44px]"
            title="Import assets from CSV"
          >
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Import CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={shAssets.length === 0}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base min-h-[44px]"
            title="Export SH assets to CSV"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/assets/new?returnTo=/assets/sh')}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            <span>+</span> <span className="truncate">Add Asset</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm border-2" style={{ borderColor: '#8D6E63' }}>
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total SH Assets</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-gray-900 dark:text-white">{shAssets.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Available</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-green-600 dark:text-green-400">
            {shAssets.filter((a) => a.status === 'available').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Assigned</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-blue-600 dark:text-blue-400">
            {shAssets.filter((a) => a.status === 'assigned').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">In Service</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-orange-600 dark:text-orange-400">
            {shAssets.filter((a) => ['maintenance', 'repair'].includes(a.status || '')).length}
          </p>
        </div>
      </div>

      {/* Filters - Responsive Stack */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input
          type="text"
          placeholder="Search by name, code, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] dark:bg-gray-800 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px] dark:bg-gray-800 dark:text-white sm:w-auto w-full"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="maintenance">Maintenance</option>
          <option value="repair">Repair</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {/* Assets Grid - Responsive */}
      {shAssets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 dark:text-gray-400">No SH assets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {shAssets.map((asset) => (
            <div key={asset.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white truncate">{asset.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{asset.asset_code}</p>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
                    asset.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    asset.status === 'assigned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    asset.status === 'maintenance' || asset.status === 'repair' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center text-xs sm:text-sm">
                    <span className="text-gray-500 dark:text-gray-400 w-20 sm:w-24 flex-shrink-0">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate">{asset.asset_type || '-'}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <span className="text-gray-500 dark:text-gray-400 w-20 sm:w-24 flex-shrink-0">Condition:</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate">{asset.condition || '-'}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <span className="text-gray-500 dark:text-gray-400 w-20 sm:w-24 flex-shrink-0">Assigned to:</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate">{asset.assigned_to || 'Unassigned'}</span>
                  </div>
                  {asset.office_location && (
                    <div className="flex items-center text-xs sm:text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-20 sm:w-24 flex-shrink-0">Location:</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate">{asset.office_location}</span>
                    </div>
                  )}
                  {asset.department && (
                    <div className="flex items-center text-xs sm:text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-20 sm:w-24 flex-shrink-0">Department:</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate">{asset.department}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(asset.id!)}
                    className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center gap-1 sm:gap-2 transition-colors min-h-[40px]"
                  >
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center gap-1 sm:gap-2 transition-colors min-h-[40px]"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden xs:inline">View</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(asset.id!)}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center gap-1 sm:gap-2 transition-colors min-h-[40px]"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Asset?"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        confirmText="Yes, delete it"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
        title="Import Assets from CSV"
        entityType="assets"
      />
    </div>
  );
}

