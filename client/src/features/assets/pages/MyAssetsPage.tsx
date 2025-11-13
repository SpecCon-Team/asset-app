import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetsStore } from '../store';
import { listUsers } from '@/features/users/api';
import { Package, AlertCircle } from 'lucide-react';
import type { User } from '@/features/users/types';

export default function MyAssetsPage() {
  const navigate = useNavigate();
  const { assets, isLoading, error, fetchAssets } = useAssetsStore();
  const [userEmail] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email;
    }
    return localStorage.getItem('userEmail') || '';
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user ID based on email
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const users = await listUsers();
        const user = users.find((u: User) => u.email === userEmail);
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        console.error('Failed to fetch user ID:', err);
      }
    };
    if (userEmail) {
      fetchUserId();
    }
  }, [userEmail]);

  // Fetch assets filtered by ownerId
  useEffect(() => {
    if (currentUserId) {
      fetchAssets({ ownerId: currentUserId });
    }
  }, [currentUserId, fetchAssets]);

  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your assets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  const goodConditionCount = assets.filter(
    (a) => a.condition === 'good' || a.condition === 'excellent'
  ).length;

  const needAttentionCount = assets.filter(
    (a) => a.condition === 'poor' || a.condition === 'fair'
  ).length;

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto p-8 h-full flex flex-col">
        {/* Header */}
        <div className="mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">My Assets</h1>
          <p className="text-gray-600 mt-2">View all assets assigned to you</p>
          <p className="text-sm text-gray-500 mt-1">Logged in as: <span className="font-medium">{userEmail}</span></p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{assets.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Good Condition</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{goodConditionCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Need Attention</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{needAttentionCount}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
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
        <div className="flex-1 overflow-y-auto">
          {filteredAssets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {assets.length === 0 ? 'No assets assigned yet' : 'No assets found'}
            </h3>
            <p className="text-gray-500">
              {assets.length === 0
                ? 'Contact your admin to get assets assigned to you'
                : 'Try adjusting your search terms'}
            </p>
            {assets.length === 0 && (
              <button
                onClick={() => navigate('/tickets/new')}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Report an Issue
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-[1]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                        <span className="text-xs text-gray-500">{asset.asset_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {asset.asset_type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          asset.condition === 'excellent' || asset.condition === 'good'
                            ? 'bg-green-100 text-green-800'
                            : asset.condition === 'fair'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {asset.condition || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.office_location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.department || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
