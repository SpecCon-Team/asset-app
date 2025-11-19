import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { listUsers } from '@/features/users/api';
import { listAssets } from '@/features/assets/api';
import type { User } from '@/features/users/types';
import type { Asset } from '@/features/assets/types';
import { showSuccess, showError } from '@/lib/swal-config';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { createTicket, isLoading } = useTicketsStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assetId: '',
    createdById: '',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assetSearch, setAssetSearch] = useState('');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Get logged in user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
  }, []);

  // Fetch users and assets on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await listUsers();
        setUsers(usersData);

        // Find current user in users list
        const matchedUser = usersData.find(u => u.email === currentUser?.email);

        // Auto-select current user if they're not an admin
        if (currentUser && currentUser.role !== 'ADMIN' && matchedUser) {
          setFormData(prev => ({ ...prev, createdById: matchedUser.id }));
        }

        // Fetch assets - filter by user if not admin
        let assetsData;
        if (currentUser && currentUser.role !== 'ADMIN' && matchedUser) {
          // Regular users only see their assigned assets
          assetsData = await listAssets({ ownerId: matchedUser.id });
        } else {
          // Admins see all assets
          assetsData = await listAssets();
        }
        setAssets(assetsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Filter assets based on search
  const filteredAssets = useMemo(() => {
    if (!assetSearch.trim()) return assets;

    const searchLower = assetSearch.toLowerCase();
    return assets.filter(asset =>
      asset.asset_code.toLowerCase().includes(searchLower) ||
      asset.name.toLowerCase().includes(searchLower) ||
      asset.status.toLowerCase().includes(searchLower) ||
      (asset.category && asset.category.toLowerCase().includes(searchLower))
    );
  }, [assets, assetSearch]);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData(prev => ({ ...prev, assetId: asset.id }));
    setAssetSearch('');
    setShowAssetDropdown(false);
  };

  const handleClearAsset = () => {
    setSelectedAsset(null);
    setFormData(prev => ({ ...prev, assetId: '' }));
    setAssetSearch('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'in_use': return 'text-blue-600 bg-blue-50';
      case 'maintenance': return 'text-yellow-600 bg-yellow-50';
      case 'retired': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return '✓';
      case 'in_use': return '●';
      case 'maintenance': return '⚠';
      case 'retired': return '✕';
      default: return '○';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.createdById.trim()) {
      newErrors.createdById = 'Please select who is creating this ticket';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isLoading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        createdById: formData.createdById,
        assetId: formData.assetId || null,
      };

      const newTicket = await createTicket(ticketData as any);
      await showSuccess('Success!', 'Ticket created successfully!', 1500);
      navigate(`/tickets/${newTicket.id}`);
    } catch (error) {
      await showError('Error', 'Failed to create ticket. Please try again.');
      console.error('Error creating ticket:', error);
    }
  };

  if (loadingData) {
    return <div className="p-8">Loading form data...</div>;
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Tickets
        </button>
        <h1 className="text-3xl font-bold dark:text-white">Create New Ticket</h1>
        <p className="text-gray-600 dark:text-gray-300">Fill in the details to create a new support ticket</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium dark:text-gray-200 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter ticket title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium dark:text-gray-200 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the issue in detail..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        {/* Created By - Only shown for admins */}
        {isAdmin && (
          <div>
            <label htmlFor="createdById" className="block text-sm font-medium dark:text-gray-200 mb-2">
              Created By <span className="text-red-500">*</span>
            </label>
            <select
              id="createdById"
              name="createdById"
              value={formData.createdById}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.createdById ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} ({user.email})
                </option>
              ))}
            </select>
            {errors.createdById && <p className="mt-1 text-sm text-red-500">{errors.createdById}</p>}
          </div>
        )}

        {/* Hidden field for non-admins */}
        {!isAdmin && (
          <input type="hidden" name="createdById" value={formData.createdById} />
        )}

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium dark:text-gray-200 mb-2">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Enhanced Asset Search & Selection */}
        <div className="relative">
          <label htmlFor="assetSearch" className="block text-sm font-medium dark:text-gray-200 mb-2">
            Related Asset (Optional)
            {assets.length > 0 && (
              <span className="ml-2 text-xs text-gray-500 font-normal">
                {isAdmin ? `${assets.length} assets available` : `${assets.length} of your assets`}
              </span>
            )}
          </label>

          {/* Selected Asset Display */}
          {selectedAsset ? (
            <div className="relative">
              <div className="w-full px-4 py-3 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedAsset.asset_code}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAsset.status)}`}>
                        {getStatusIcon(selectedAsset.status)} {selectedAsset.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {selectedAsset.name}
                    </p>
                    {selectedAsset.category && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedAsset.category}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearAsset}
                  className="ml-2 p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear selection"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                ✓ This ticket will be linked to <strong>{selectedAsset.asset_code}</strong>
              </p>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="assetSearch"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  onFocus={() => setShowAssetDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAssetDropdown(false), 200)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={assets.length > 0 ? "Search by code, name, or category..." : "No assets available"}
                  disabled={assets.length === 0}
                />
                {assetSearch && (
                  <button
                    type="button"
                    onClick={() => setAssetSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown Results */}
              {showAssetDropdown && filteredAssets.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleAssetSelect(asset)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔧</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {asset.asset_code}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                              {getStatusIcon(asset.status)} {asset.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {asset.name}
                          </p>
                          {asset.category && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              📂 {asset.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results Message */}
              {showAssetDropdown && assetSearch && filteredAssets.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No assets found matching "{assetSearch}"
                  </p>
                </div>
              )}

              {/* Help Text */}
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  💡 Link this ticket to a specific asset/equipment if the issue is related to hardware
                </p>
                {assets.length === 0 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    ⚠️ You don't have any assets assigned yet
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading || loadingData}
            className="px-6 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Creating Ticket...' : 'Create Ticket'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}