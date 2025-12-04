import React, { useState, useEffect } from 'react';
import { X, Search, Laptop, Tablet, Package, Check, Loader2, Users, ArrowLeft } from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { showError, showSuccess } from '@/lib/sweetalert';

interface Client {
  id: string;
  name: string;
  location: string;
  provinceId: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Asset {
  id: string;
  asset_code: string;
  name: string;
  serial_number?: string | null;
  asset_type?: string | null;
  condition?: string | null;
  status?: string;
  description?: string | null;
}

interface AssignAssetsToClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AssignAssetsToClientModal({ isOpen, onClose, onSuccess }: AssignAssetsToClientModalProps) {
  const [step, setStep] = useState<'select-client' | 'assign-assets'>('select-client');
  const [clients, setClients] = useState<Client[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [searchAssetQuery, setSearchAssetQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadClients();
      setStep('select-client');
      setSelectedClient(null);
      setSelectedAssets(new Set());
      setSearchClientQuery('');
      setSearchAssetQuery('');
      setFilterType('all');
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.get('/peg');
      setClients(response.data);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      showError('Error', 'Failed to load clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAssets = async () => {
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.get('/assets/available');
      setAssets(response.data);
    } catch (error: any) {
      console.error('Error loading available assets:', error);
      showError('Error', 'Failed to load available assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    loadAvailableAssets();
    setStep('assign-assets');
  };

  const handleBack = () => {
    setStep('select-client');
    setSelectedClient(null);
    setSelectedAssets(new Set());
    setSearchAssetQuery('');
    setFilterType('all');
  };

  const toggleAssetSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleAssign = async () => {
    if (!selectedClient) return;
    if (selectedAssets.size === 0) {
      showError('No Selection', 'Please select at least one asset to assign');
      return;
    }

    setAssigning(true);
    try {
      const api = getApiClient();
      const assetIds = Array.from(selectedAssets);
      
      // Assign assets one by one
      for (const assetId of assetIds) {
        await api.post(`/peg/${selectedClient.id}/assets`, { assetId });
      }

      showSuccess('Success', `${assetIds.length} asset${assetIds.length !== 1 ? 's' : ''} assigned to ${selectedClient.name} successfully`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error assigning assets:', error);
      showError('Error', error.response?.data?.error || 'Failed to assign assets');
    } finally {
      setAssigning(false);
    }
  };

  const getAssetIcon = (assetType?: string | null) => {
    const type = assetType?.toLowerCase() || '';
    if (type.includes('laptop')) return <Laptop className="w-5 h-5" />;
    if (type.includes('tablet')) return <Tablet className="w-5 h-5" />;
    return <Package className="w-5 h-5" />;
  };

  const getConditionColor = (condition?: string | null) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('good') || cond.includes('excellent')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (cond.includes('fair') || cond.includes('average')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (cond.includes('poor') || cond.includes('bad')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const filteredClients = clients.filter(client => {
    if (!searchClientQuery) return true;
    const query = searchClientQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.location.toLowerCase().includes(query) ||
      client.contactPerson?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchAssetQuery || 
      asset.name.toLowerCase().includes(searchAssetQuery.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchAssetQuery.toLowerCase()) ||
      asset.asset_code.toLowerCase().includes(searchAssetQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      asset.asset_type?.toLowerCase().includes(filterType.toLowerCase());

    return matchesSearch && matchesType;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step === 'assign-assets' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Back to client selection"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {step === 'select-client' ? 'Assign Assets to Client' : `Assign Assets to ${selectedClient?.name}`}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {step === 'select-client' 
                    ? 'Select a client to assign assets to'
                    : 'Select assets to assign to this client'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step 1: Select Client */}
        {step === 'select-client' && (
          <>
            {/* Search */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients by name, location, contact person, phone, or email..."
                  value={searchClientQuery}
                  onChange={(e) => setSearchClientQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Clients List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchClientQuery 
                      ? 'No clients match your search criteria'
                      : 'No clients found'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {client.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {client.location}
                          </p>
                          {client.contactPerson && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Contact: {client.contactPerson}
                            </p>
                          )}
                          {client.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Phone: {client.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 2: Assign Assets */}
        {step === 'assign-assets' && (
          <>
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, serial number, or code..."
                    value={searchAssetQuery}
                    onChange={(e) => setSearchAssetQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('laptop')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'laptop'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Laptops
                  </button>
                  <button
                    onClick={() => setFilterType('tablet')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === 'tablet'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Tablets
                  </button>
                </div>
              </div>
            </div>

            {/* Assets List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchAssetQuery || filterType !== 'all' 
                      ? 'No assets match your search criteria'
                      : 'No available assets found'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAssets.map(asset => {
                    const isSelected = selectedAssets.has(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleAssetSelection(asset.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {isSelected ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              getAssetIcon(asset.asset_type)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {asset.name}
                            </h4>
                            {asset.serial_number && (
                              <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mt-1">
                                SN: {asset.serial_number}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {asset.asset_type && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                  {asset.asset_type}
                                </span>
                              )}
                              {asset.condition && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getConditionColor(asset.condition)}`}>
                                  {asset.condition}
                                </span>
                              )}
                            </div>
                            {asset.asset_code && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Code: {asset.asset_code}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedAssets.size > 0 && (
                  <span>{selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={selectedAssets.size === 0 || assigning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    `Assign ${selectedAssets.size > 0 ? `(${selectedAssets.size})` : ''}`
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

