import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetsStore } from '../store';
import { Package, AlertCircle } from 'lucide-react';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

export default function MyAssetsPage() {
  const navigate = useNavigate();
  const { assets, isLoading, error, fetchAssets } = useAssetsStore();
  const showLoading = useMinLoadingTime(isLoading, 2000);
  const [user] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch assets based on role
  useEffect(() => {
    if (!user) return;

    // All roles can see all assets (read-only for users)
    fetchAssets({});
  }, [user, fetchAssets]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (showLoading) {
    return <LoadingOverlay message="Loading your assets..." />;
  }

  if (error) {
    return <div className="p-8 text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-900 min-h-screen">Error: {error}</div>;
  }

  // All users can see all assets
  const myAssets = assets;

  const filteredAssets = myAssets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Calculate stats based on user's assets
  const goodConditionCount = myAssets.filter(
    (a) => a.condition?.toLowerCase() === 'good' || a.condition?.toLowerCase() === 'excellent'
  ).length;

  const needAttentionCount = myAssets.filter(
    (a) => a.condition?.toLowerCase() === 'poor' || a.condition?.toLowerCase() === 'fair'
  ).length;

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col">
        {/* Header */}
        <div className="mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'ADMIN' ? 'All Assets' : user?.role === 'TECHNICIAN' ? 'Manage Assets' : 'My Assets'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {user?.role === 'ADMIN'
              ? 'View and manage all organization assets'
              : user?.role === 'TECHNICIAN'
              ? 'View and manage all assets'
              : 'View all assets assigned to you'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Logged in as: <span className="font-medium">{user?.email}</span></p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{myAssets.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Good Condition</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{goodConditionCount}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Need Attention</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{needAttentionCount}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex-shrink-0">
          <input
            type="text"
            placeholder="Search assets by name, code, type, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Assets List */}
        <div className="flex-1">
          {filteredAssets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {myAssets.length === 0
                ? user?.role === 'ADMIN'
                  ? 'No assets in the system'
                  : user?.role === 'TECHNICIAN'
                  ? 'No assets available'
                  : 'No assets assigned yet'
                : 'No assets found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {myAssets.length === 0
                ? user?.role === 'ADMIN'
                  ? 'Start by adding assets to the system'
                  : user?.role === 'TECHNICIAN'
                  ? 'Assets will appear here once they are added to the system'
                  : 'Contact your admin to get assets assigned to you'
                : 'Try adjusting your search terms'}
            </p>
            {myAssets.length === 0 && user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN' && (
              <button
                onClick={() => navigate('/tickets/new')}
                className="mt-6 px-6 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Report an Issue
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 pb-4">
              {paginatedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {asset.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {asset.asset_code}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {asset.asset_type || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Condition:</span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          asset.condition === 'excellent' || asset.condition === 'good'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : asset.condition === 'fair'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {asset.condition || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-300">
                        {asset.office_location || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Department:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-300">
                        {asset.department || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow">
              <div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{asset.asset_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {asset.asset_type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          asset.condition === 'excellent' || asset.condition === 'good'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : asset.condition === 'fair'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {asset.condition || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {asset.office_location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {asset.department || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredAssets.length > 0 && (
              <div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span>
                    Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(endIndex, filteredAssets.length)}</span> of{' '}
                    <span className="font-semibold">{filteredAssets.length}</span> assets
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 min-h-[44px] bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Previous
                  </button>
                  <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
