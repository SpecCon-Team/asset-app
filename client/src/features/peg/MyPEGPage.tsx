import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, X, Users, Edit2, Trash2, Search, Download, BarChart3, List, Map as MapIcon, Phone, Mail, Navigation } from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

// South African Provinces
const provinces = [
  { id: 'WC', name: 'Western Cape', color: '#FF9800' }, // Orange
  { id: 'EC', name: 'Eastern Cape', color: '#8D6E63' }, // Brown/Rust
  { id: 'NC', name: 'Northern Cape', color: '#42A5F5' }, // Blue
  { id: 'FS', name: 'Free State', color: '#FFC107' }, // Yellow/Gold
  { id: 'KZN', name: 'KwaZulu-Natal', color: '#616161' }, // Dark Gray
  { id: 'NW', name: 'North West', color: '#9E9E9E' }, // Gray
  { id: 'GP', name: 'Gauteng', color: '#64B5F6' }, // Light Blue
  { id: 'MP', name: 'Mpumalanga', color: '#3F51B5' }, // Dark Blue
  { id: 'LP', name: 'Limpopo', color: '#8BC34A' }, // Green
];

interface Client {
  id: string;
  name: string;
  location: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  provinceId: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function MyPEGPage() {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showStats, setShowStats] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contactPerson: '',
    phone: '',
    email: '',
    tags: '',
  });

  // Load clients from API
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

  const handleProvinceClick = (provinceId: string) => {
    setSelectedProvince(provinceId);
  };

  const handleAddClient = () => {
    if (!selectedProvince) {
      showError('No Province Selected', 'Please select a province first');
      return;
    }
    setShowAddModal(true);
    setEditingClient(null);
    setFormData({
      name: '',
      location: '',
      contactPerson: '',
      phone: '',
      email: '',
      tags: '',
    });
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      location: client.location,
      contactPerson: client.contactPerson || '',
      phone: client.phone || '',
      email: client.email || '',
      tags: '',
    });
    setShowAddModal(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const api = getApiClient();
      await api.delete(`/peg/${clientId}`);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      showError('Error', 'Failed to delete client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      showError('Missing Fields', 'Please fill in all required fields');
      return;
    }

    try {
      const api = getApiClient();
      const payload = {
        ...formData,
        provinceId: editingClient ? editingClient.provinceId : selectedProvince!,
      };

      if (editingClient) {
        // Update existing client
        await api.put(`/peg/${editingClient.id}`, payload);
        showSuccess('Updated!', 'Client updated successfully', 1500);
      } else {
        // Add new client
        await api.post('/peg', payload);
        showSuccess('Added!', 'Client added successfully', 1500);
      }

      await loadClients();
      setShowAddModal(false);
      setShowProvinceModal(true);
      setFormData({
        name: '',
        location: '',
        contactPerson: '',
        phone: '',
        email: '',
        tags: '',
      });
    } catch (error) {
      console.error('Error saving client:', error);
      showError('Error', editingClient ? 'Failed to update client' : 'Failed to create client');
    }
  };

  // Filter clients based on search query FIRST
  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true; // Show all if no search query
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.location.toLowerCase().includes(query) ||
      client.contactPerson?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  });

  const getProvinceClients = (provinceId: string) => {
    return filteredClients.filter((c) => c.provinceId === provinceId);
  };

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Client Name', 'Province', 'Location', 'Contact Person', 'Phone', 'Email'];
    const csvData = clients.map((client) => {
      const province = provinces.find((p) => p.id === client.provinceId);
      return [
        client.name,
        province?.name || '',
        client.location,
        client.contactPerson || '',
        client.phone || '',
        client.email || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `peg-clients-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalClients = filteredClients.length;

  const selectedProvinceData = provinces.find((p) => p.id === selectedProvince);
  const provinceClients = selectedProvince ? getProvinceClients(selectedProvince) : [];
  const [showProvinceModal, setShowProvinceModal] = useState(false);

  const handleProvinceClickNew = (provinceId: string) => {
    // Navigate to province details page
    navigate(`/my-peg/${provinceId}`);
  };

  const clearAllData = async () => {
    const result = await showConfirm(
      'Are you sure?',
      'Do you want to clear all client data?',
      'Yes, clear all!',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        const api = getApiClient();
        await api.delete('/peg');
        await loadClients();
        showSuccess('Cleared!', 'All data has been cleared.', 2000);
      } catch (error) {
        console.error('Error clearing data:', error);
        showError('Error', 'Failed to clear data');
      }
    }
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading PEG clients..." />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My PEG</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Total: <span className="font-semibold text-blue-600 dark:text-blue-400">{totalClients}</span> clients across {provinces.filter(p => getProvinceClients(p.id).length > 0).length} provinces
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-2"
              title={`Switch to ${viewMode === 'map' ? 'list' : 'map'} view`}
            >
              {viewMode === 'map' ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
              {viewMode === 'map' ? 'List' : 'Map'}
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-2"
              title="Toggle statistics"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-2"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={clearAllData}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
              title="Clear all data"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients by name, location, contact person, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white text-sm sm:text-base"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-20"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Client Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {provinces.map((province) => {
              const count = getProvinceClients(province.id).length;
              const percentage = totalClients > 0 ? ((count / totalClients) * 100).toFixed(1) : '0';
              return (
                <div
                  key={province.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border-2 shadow-sm"
                  style={{ borderColor: province.color }}
                >
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap">{province.name}</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" style={{ color: province.color }}>
                    {count}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</div>
                  <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: province.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            All Clients {searchQuery && `(${filteredClients.length} results)`}
          </h2>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No clients found matching your search' : 'No clients yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => {
                const province = provinces.find((p) => p.id === client.provinceId);
                return (
                  <div
                    key={client.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 hover:shadow-lg transition-all"
                    style={{ borderColor: province?.color }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5" style={{ color: province?.color }} />
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{client.name}</h3>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap"
                            style={{ backgroundColor: province?.color }}
                          >
                            {province?.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm ml-7">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{client.location}</span>
                          </div>
                          {client.contactPerson && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>{client.contactPerson}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-green-600" />
                              <a
                                href={`tel:${client.phone}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {client.phone}
                              </a>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <a
                                href={`mailto:${client.email}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {client.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Call"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        )}
                        {client.email && (
                          <a
                            href={`mailto:${client.email}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Email"
                          >
                            <Mail className="w-5 h-5" />
                          </a>
                        )}
                        {client.location && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                            title="View on Map"
                          >
                            <Navigation className="w-5 h-5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={async () => {
                            const result = await showConfirm(
                              'Are you sure?',
                              `Do you want to delete ${client.name}?`,
                              'Yes, delete!',
                              'Cancel'
                            );

                            if (result.isConfirmed) {
                              await handleDeleteClient(client.id);
                              await loadClients();
                              showSuccess('Deleted!', `${client.name} has been deleted.`, 2000);
                            }
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Province Selection Cards - Alternative to map */}
      {viewMode === 'map' && (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {provinces.map((province) => {
            const clientCount = getProvinceClients(province.id).length;
            return (
              <button
                key={province.id}
                onClick={() => handleProvinceClickNew(province.id)}
                className="p-3 sm:p-4 md:p-6 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg bg-white dark:bg-gray-800 w-full"
                style={{
                  borderColor: province.color,
                }}
              >
                <div className="text-center w-full">
                  <div
                    className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 whitespace-nowrap"
                    style={{ color: province.color }}
                    title={province.name}
                  >
                    {province.name}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mb-1 text-gray-900 dark:text-white">{clientCount}</div>
                  <div className="text-xs sm:text-sm opacity-90 text-gray-600 dark:text-gray-400">{clientCount === 1 ? 'Client' : 'Clients'}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="w-full">
          {/* Map Section */}
          <div>
            {/* Enhanced Header with Icon and Gradient */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full shadow-lg mb-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">South Africa - Provinces</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 px-4">
                Click on any province card to view and manage clients
              </p>
            </div>

            {/* Image Map with Clickable Overlays */}
            <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-xl p-3 sm:p-4 md:p-6 overflow-hidden border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
              <img
                src={`${import.meta.env.BASE_URL}south-africa-provinces-map2.png`}
                alt="South Africa Provinces Map"
                className="w-full h-auto rounded-lg shadow-md"
              />

            {/* Client count badges on provinces - Enhanced circular design */}
            {provinces.map((province) => {
              const clientCount = getProvinceClients(province.id).length;
              if (clientCount === 0) return null;

              const positions: Record<string, { top: string; left: string }> = {
                LP: { top: '15%', left: '70%' },
                MP: { top: '34%', left: '76%' },
                GP: { top: '32%', left: '67%' },
                NW: { top: '35%', left: '50%' },
                FS: { top: '54%', left: '56%' },
                KZN: { top: '55%', left: '79%' },
                NC: { top: '62%', left: '30%' },
                EC: { top: '80%', left: '58%' },
                WC: { top: '88%', left: '26%' },
              };

              const pos = positions[province.id];

              // Responsive circle sizes: mobile (sm), tablet (md), desktop (lg)
              const getCircleSize = () => {
                if (clientCount >= 100) return 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14';
                if (clientCount >= 10) return 'w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12';
                return 'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-11 lg:h-11';
              };

              // Responsive font sizes
              const getFontSize = () => {
                if (clientCount >= 100) return 'text-[10px] sm:text-xs md:text-sm lg:text-base';
                if (clientCount >= 10) return 'text-[10px] sm:text-xs md:text-sm lg:text-base';
                return 'text-xs sm:text-sm md:text-base lg:text-lg';
              };

              return (
                <div
                  key={province.id}
                  className={`absolute flex items-center justify-center rounded-full shadow-lg sm:shadow-xl md:shadow-2xl bg-white dark:bg-gray-900 ${getCircleSize()} pointer-events-none animate-[fadeInScale_0.5s_ease-out]`}
                  style={{
                    top: pos.top,
                    left: pos.left,
                    border: `2px solid ${province.color}`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 2px ${province.color}40`,
                    animation: `fadeInScale 0.5s ease-out ${provinces.findIndex(p => p.id === province.id) * 0.1}s both, pulse 2s ease-in-out ${provinces.findIndex(p => p.id === province.id) * 0.1}s infinite`,
                  }}
                  title={`${clientCount} client${clientCount === 1 ? '' : 's'} in ${province.name}`}
                >
                  <span
                    className={`font-semibold text-gray-900 dark:text-white ${getFontSize()}`}
                    style={{
                      color: province.color,
                      textShadow: 'none',
                    }}
                  >
                    {clientCount}
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </>
      )}

      {/* Province Clients Modal */}
      {showProvinceModal && selectedProvinceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: selectedProvinceData.color }}>
                  {selectedProvinceData.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {provinceClients.length} {provinceClients.length === 1 ? 'Client' : 'Clients'}
                </p>
              </div>
              <button
                onClick={() => setShowProvinceModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {provinceClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                    No clients in {selectedProvinceData.name} yet
                  </p>
                  <button
                    onClick={() => {
                      setShowProvinceModal(false);
                      handleAddClient();
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add First Client
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {provinceClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin
                              className="w-5 h-5"
                              style={{ color: selectedProvinceData.color }}
                            />
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {client.name}
                            </h3>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setShowProvinceModal(false);
                              handleEditClient(client);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={async () => {
                              const result = await showConfirm(
                                'Are you sure?',
                                `Do you want to delete ${client.name}?`,
                                'Yes, delete!',
                                'Cancel'
                              );

                              if (result.isConfirmed) {
                                handleDeleteClient(client.id);
                                showSuccess('Deleted!', `${client.name} has been deleted.`, 2000);
                              }
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="ml-7 space-y-2 text-sm">
                        {client.location && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                              Location:
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {client.location}
                            </span>
                          </div>
                        )}
                        {client.contactPerson && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                              Contact:
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {client.contactPerson}
                            </span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                              Phone:
                            </span>
                            <a
                              href={`tel:${client.phone}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {client.phone}
                            </a>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                              Email:
                            </span>
                            <a
                              href={`mailto:${client.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {client.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Another Client Button */}
                  <button
                    onClick={() => {
                      setShowProvinceModal(false);
                      handleAddClient();
                    }}
                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Add Another Client to {selectedProvinceData.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingClient ? 'Edit Client' : 'Add Client'} - {selectedProvinceData?.name}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location/City *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags/Categories
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., VIP, Corporate, Retail (comma-separated)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingClient ? 'Update' : 'Add'} Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
