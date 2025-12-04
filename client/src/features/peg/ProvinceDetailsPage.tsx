import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Phone, Mail, MapPin, User, Building2, Calendar, Eye, X } from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { formatDate } from '@/lib/dateFormatter';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';
import { useClientAssets } from './hooks/useClientAssets';
import ClientAssetsSection from './components/ClientAssetsSection';

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

interface Client {
  id: string;
  clientCode?: string; // Auto-generated client serial number (e.g., CLT-001)
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

// Wrapper component for client assets section
function ClientAssetsWrapper({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { assets, loading, assignAssets, unassignAsset } = useClientAssets(clientId);

  const handleAssign = async (assetIds: string[]) => {
    return await assignAssets(assetIds);
  };

  const handleUnassign = async (assetId: string) => {
    return await unassignAsset(assetId);
  };

  return (
    <ClientAssetsSection
      clientId={clientId}
      clientName={clientName}
      assets={assets}
      loading={loading}
      onAssign={handleAssign}
      onUnassign={handleUnassign}
    />
  );
}

export default function ProvinceDetailsPage() {
  const { provinceId } = useParams<{ provinceId: string }>();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contactPerson: '',
    phone: '',
    email: '',
    clientCode: '',
  });

  const province = provinces.find(p => p.id === provinceId);

  useEffect(() => {
    loadClients();
  }, [provinceId]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.get('/peg');
      const provinceClients = response.data.filter((c: Client) => c.provinceId === provinceId);
      setClients(provinceClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      showError('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setShowAddModal(true);
    setEditingClient(null);
    setFormData({
      name: '',
      location: '',
      contactPerson: '',
      phone: '',
      email: '',
      clientCode: '',
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
      clientCode: client.clientCode || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      showError('Validation Error', 'Name and Location are required');
      return;
    }

    try {
      const api = getApiClient();
      const clientData = {
        ...formData,
        provinceId: provinceId,
      };

      if (editingClient) {
        await api.put(`/peg/${editingClient.id}`, clientData);
        showSuccess('Success', 'Client updated successfully', 2000);
      } else {
        await api.post('/peg', clientData);
        showSuccess('Success', 'Client added successfully', 2000);
      }

      setShowAddModal(false);
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      showError('Error', 'Failed to save client');
    }
  };

  const handleDeleteClient = async (client: Client) => {
    const result = await showConfirm(
      'Delete Client',
      `Are you sure you want to delete ${client.name}?`,
      'Yes, delete it',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        const api = getApiClient();
        await api.delete(`/peg/${client.id}`);
        showSuccess('Deleted', 'Client deleted successfully', 2000);
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        showError('Error', 'Failed to delete client');
      }
    }
  };

  if (!province) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Province Not Found</h1>
        <button
          onClick={() => navigate('/my-peg')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to My PEG
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/my-peg')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My PEG
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: province.color }}
            >
              {province.id}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{province.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {clients.length} {clients.length === 1 ? 'Client' : 'Clients'}
              </p>
            </div>
          </div>

          <button
            onClick={handleAddClient}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Phone className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">With Contact</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {clients.filter(c => c.phone || c.email).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contact Persons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {clients.filter(c => c.contactPerson).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clients List */}
      {showLoading ? (
        <LoadingOverlay message="Loading province details..." />
      ) : clients.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-sm text-center border border-gray-200 dark:border-gray-700">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Clients Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by adding your first client to {province.name}
          </p>
          <button
            onClick={handleAddClient}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: province.color }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                      {client.clientCode && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-mono">
                          {client.clientCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <MapPin className="w-4 h-4" />
                      {client.location}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingClient(client)}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditClient(client)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Edit Client"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {client.contactPerson && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  {client.contactPerson}
                </div>
              )}

              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${client.phone}`} className="hover:text-blue-600">
                    {client.phone}
                  </a>
                </div>
              )}

              {client.email && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                    {client.email}
                  </a>
                </div>
              )}

              {client.createdAt && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Calendar className="w-4 h-4" />
                  Added {formatDate(client.createdAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., ABC Corporation"
                    required
                  />
                </div>

                {/* Client Serial Number - Input field with auto-generated default */}
                {!editingClient && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client Serial Number
                    </label>
                    <input
                      type="text"
                      value={formData.clientCode || ''}
                      onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                      placeholder="e.g., 2295PPB0001"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Cape Town"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., +27 12 345 6789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., john@example.com"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
        </div>
      )}

      {/* Client Details Modal */}
      {viewingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                    style={{ backgroundColor: province.color }}
                  >
                    {viewingClient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {viewingClient.name}
                    </h2>
                    {viewingClient.clientCode && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                        Code: {viewingClient.clientCode}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingClient(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Information */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Client Name</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {viewingClient.name}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Province</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {province.name}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {viewingClient.location}
                      </p>
                    </div>
                    {viewingClient.clientCode && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Client Code</p>
                        <p className="text-base font-mono font-medium text-blue-600 dark:text-blue-400">
                          {viewingClient.clientCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingClient.contactPerson ? (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Contact Person
                        </p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {viewingClient.contactPerson}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Contact Person
                        </p>
                        <p className="text-base text-gray-400 dark:text-gray-500 italic">
                          Not provided
                        </p>
                      </div>
                    )}

                    {viewingClient.phone ? (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </p>
                        <a
                          href={`tel:${viewingClient.phone}`}
                          className="text-base font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {viewingClient.phone}
                        </a>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </p>
                        <p className="text-base text-gray-400 dark:text-gray-500 italic">
                          Not provided
                        </p>
                      </div>
                    )}

                    {viewingClient.email ? (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </p>
                        <a
                          href={`mailto:${viewingClient.email}`}
                          className="text-base font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {viewingClient.email}
                        </a>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </p>
                        <p className="text-base text-gray-400 dark:text-gray-500 italic">
                          Not provided
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingClient.createdAt && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date Added</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {formatDate(viewingClient.createdAt)}
                        </p>
                      </div>
                    )}
                    {viewingClient.updatedAt && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {formatDate(viewingClient.updatedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Assets */}
                {viewingClient && (
                  <ClientAssetsWrapper clientId={viewingClient.id} clientName={viewingClient.name} />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setViewingClient(null);
                    handleEditClient(viewingClient);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Client
                </button>
                <button
                  onClick={() => setViewingClient(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
