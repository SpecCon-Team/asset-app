import React, { useState, useEffect } from 'react';
import { X, Search, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { showError } from '@/lib/sweetalert';

interface Client {
  id: string;
  name: string;
  location: string;
  provinceId: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface SelectClientForAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectClientForAssetModal({ isOpen, onClose }: SelectClientForAssetModalProps) {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadClients();
      setSearchQuery('');
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

  const handleClientSelect = (client: Client) => {
    // Navigate to asset creation with client ID in query params
    navigate(`/assets/new?pegClientId=${client.id}`);
    onClose();
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.location.toLowerCase().includes(query) ||
      client.contactPerson?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Select Client for New Asset
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose a client to create an asset for
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name, location, contact person, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                {searchQuery 
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

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

