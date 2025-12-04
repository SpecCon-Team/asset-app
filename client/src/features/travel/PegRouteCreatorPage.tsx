import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Check, X, ArrowRight, Search, Calendar, Clock } from 'lucide-react';
import { showSuccess, showError } from '@/lib/sweetalert';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

// South African Provinces
const provinces = [
  { id: 'WC', name: 'Western Cape', color: '#FF9800' },
  { id: 'EC', name: 'Eastern Cape', color: '#8D6E63' },
  { id: 'NC', name: 'Northern Cape', color: '#42A5F5' },
  { id: 'FS', name: 'Free State', color: '#FFC107' },
  { id: 'KZN', name: 'KwaZulu-Natal', color: '#616161' },
  { id: 'NW', name: 'North West', color: '#9E9E9E' },
  { id: 'GP', name: 'Gauteng', color: '#64B5F6' },
  { id: 'MP', name: 'Mpumalanga', color: '#3F51B5' },
  { id: 'LP', name: 'Limpopo', color: '#8BC34A' },
];

interface PEGClient {
  id: string;
  name: string;
  location: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  provinceId: string;
  clientCode?: string;
}

export default function PegRouteCreatorPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<PEGClient[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.get('/peg');
      setClients(response.data);
    } catch (error) {
      console.error('Error loading PEG clients:', error);
      showError('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProvince = !filterProvince || client.provinceId === filterProvince;
    
    return matchesSearch && matchesProvince;
  });

  const selectedClientsData = clients.filter(c => selectedClients.includes(c.id));

  const handleCreateRoute = () => {
    if (selectedClients.length === 0) {
      showError('No Clients Selected', 'Please select at least one client to create a route');
      return;
    }

    // Navigate to route editor with selected client IDs
    const clientIds = selectedClients.join(',');
    navigate(`/travel-plan/peg-route-editor?clients=${clientIds}`);
  };

  const getProvinceName = (provinceId: string) => {
    return provinces.find(p => p.id === provinceId)?.name || provinceId;
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading clients..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create PEG Client Route
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select clients from My PEG to create a travel route
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name, location, or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Provinces</option>
            {provinces.map(province => (
              <option key={province.id} value={province.id}>{province.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Clients Summary */}
      {selectedClients.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                {selectedClientsData.map(c => c.name).join(', ')}
              </p>
            </div>
            <button
              onClick={handleCreateRoute}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              Create Route
            </button>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Available Clients ({filteredClients.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No clients found</p>
            </div>
          ) : (
            filteredClients.map(client => {
              const isSelected = selectedClients.includes(client.id);
              const province = provinces.find(p => p.id === client.provinceId);
              
              return (
                <div
                  key={client.id}
                  onClick={() => toggleClientSelection(client.id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {client.name}
                        </h3>
                        {client.clientCode && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {client.clientCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{client.location}</span>
                        </div>
                        {province && (
                          <div
                            className="px-2 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: province.color }}
                          >
                            {province.name}
                          </div>
                        )}
                      </div>
                      {(client.contactPerson || client.phone || client.email) && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {client.contactPerson && <span>Contact: {client.contactPerson}</span>}
                          {client.phone && <span className="ml-3">Phone: {client.phone}</span>}
                          {client.email && <span className="ml-3">Email: {client.email}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

