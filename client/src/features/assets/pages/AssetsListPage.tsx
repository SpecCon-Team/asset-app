import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetsStore } from '../store';
import { Pencil, Eye, Trash2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';
import { ConfirmDialog, CSVImportModal } from '@/components';
import toast from 'react-hot-toast';
import { exportToCSV, ASSET_EXPORT_COLUMNS, generateFilename, downloadCSVTemplate, ASSET_IMPORT_TEMPLATE_COLUMNS } from '@/lib/exportUtils';
import { getApiClient } from '@/features/assets/lib/apiClient';
import AssignAssetsToClientModal from '../components/AssignAssetsToClientModal';

export default function AssetsListPage() {
  const navigate = useNavigate();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

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
    fetchAssets({});
  }, [fetchAssets]);

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

  const handleExportCSV = () => {
    try {
      const filename = generateFilename('assets_export', 'csv');
      exportToCSV(assets, ASSET_EXPORT_COLUMNS, filename);
      toast.success(`Exported ${assets.length} assets to CSV`);
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
    await fetchAssets({});

    return result;
  };

  const handleContainerClick = (type: 'peg' | 'sh') => {
    if (type === 'peg') {
      navigate('/assets/peg');
    } else {
      navigate('/assets/sh');
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading assets..." />;
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Assets</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => fetchAssets({})}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Asset Management</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage, assign, and track all assets</p>
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
            disabled={assets.length === 0}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base min-h-[44px]"
            title="Export assets to CSV"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            <span>+</span> <span className="truncate">Add Client Assets</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Assets</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-gray-900 dark:text-white">{assets.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Available</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-green-600 dark:text-green-400">
            {assets.filter((a) => a.status === 'available').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Assigned</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-blue-600 dark:text-blue-400">
            {assets.filter((a) => a.status === 'assigned').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">In Service</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-orange-600 dark:text-orange-400">
            {assets.filter((a) => ['maintenance', 'repair'].includes(a.status || '')).length}
          </p>
        </div>
      </div>

      {/* PEG Assets and SH Assets Containers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        {/* PEG Assets Card */}
        <button
          onClick={() => handleContainerClick('peg')}
          className="p-3 sm:p-4 md:p-6 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg bg-white dark:bg-gray-800 cursor-pointer text-left w-full"
          style={{
            borderColor: '#FF9800',
          }}
        >
          <div className="text-center w-full">
            <div
              className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 whitespace-nowrap"
              style={{ color: '#FF9800' }}
            >
              PEG Assets
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-gray-900 dark:text-white">
              {assets.filter((a) => a.pegClientId).length}
            </div>
            <div className="text-xs sm:text-sm opacity-90 text-gray-600 dark:text-gray-400">
              {assets.filter((a) => a.pegClientId).length === 1 ? 'Asset' : 'Assets'}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Click to manage</div>
          </div>
        </button>

        {/* SH Assets Card */}
        <button
          onClick={() => handleContainerClick('sh')}
          className="p-3 sm:p-4 md:p-6 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg bg-white dark:bg-gray-800 cursor-pointer text-left w-full"
          style={{
            borderColor: '#8D6E63',
          }}
        >
          <div className="text-center w-full">
            <div
              className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 whitespace-nowrap"
              style={{ color: '#8D6E63' }}
            >
              SH Assets
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-gray-900 dark:text-white">
              {assets.filter((a) => !a.pegClientId).length}
            </div>
            <div className="text-xs sm:text-sm opacity-90 text-gray-600 dark:text-gray-400">
              {assets.filter((a) => !a.pegClientId).length === 1 ? 'Asset' : 'Assets'}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Click to manage</div>
          </div>
        </button>
      </div>

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

      {/* Assign Assets to Client Modal */}
      <AssignAssetsToClientModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          fetchAssets({});
        }}
      />
    </div>
  );
}