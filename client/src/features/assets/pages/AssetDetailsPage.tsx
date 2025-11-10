import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetsStore } from '../store';

export default function AssetsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { assets, isLoading, error, fetchAssets, deleteAsset } = useAssetsStore();

  useEffect(() => {
    fetchAssets({ search, status: statusFilter });
  }, [search, statusFilter, fetchAssets]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset(id);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/assets/${id}`);
  };

  if (isLoading) {
    return <div className="p-8">Loading assets...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-gray-600">Manage, assign, and track all assets</p>
        </div>
        <button
          onClick={() => navigate('/assets/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> Add Asset
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Assets</h3>
          <p className="text-3xl font-bold mt-2">{assets.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Available</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {assets.filter((a) => a.status === 'available').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Assigned</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {assets.filter((a) => a.status === 'assigned').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">In Service</h3>
          <p className="text-3xl font-bold mt-2 text-orange-600">
            {assets.filter((a) => ['maintenance', 'repair'].includes(a.status || '')).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by name, code, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="maintenance">Maintenance</option>
          <option value="repair">Repair</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">No assets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{asset.asset_code}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    asset.status === 'available' ? 'bg-green-100 text-green-800' :
                    asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    asset.status === 'maintenance' || asset.status === 'repair' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">Type:</span>
                    <span className="font-medium">{asset.asset_type || '-'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">Condition:</span>
                    <span className="font-medium">{asset.condition || '-'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">Assigned to:</span>
                    <span className="font-medium">{asset.assigned_to || 'Unassigned'}</span>
                  </div>
                  {asset.office_location && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-24">Location:</span>
                      <span className="font-medium">{asset.office_location}</span>
                    </div>
                  )}
                  {asset.department && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-24">Department:</span>
                      <span className="font-medium">{asset.department}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleEdit(asset.id)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}