import React, { useState, useEffect } from 'react';
import { MapPin, Plus, X, Users, Edit2, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

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
  contactPerson: string;
  phone: string;
  email: string;
  provinceId: string;
}

export default function MyPEGPage() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contactPerson: '',
    phone: '',
    email: '',
  });

  // Load clients from localStorage
  useEffect(() => {
    const savedClients = localStorage.getItem('peg_clients');
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    }
  }, []);

  // Save clients to localStorage
  const saveClients = (updatedClients: Client[]) => {
    setClients(updatedClients);
    localStorage.setItem('peg_clients', JSON.stringify(updatedClients));
  };

  const handleProvinceClick = (provinceId: string) => {
    setSelectedProvince(provinceId);
  };

  const handleAddClient = () => {
    if (!selectedProvince) {
      Swal.fire({
        title: 'No Province Selected',
        text: 'Please select a province first',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
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
    });
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      location: client.location,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email,
    });
    setShowAddModal(true);
  };

  const handleDeleteClient = (clientId: string) => {
    const updatedClients = clients.filter((c) => c.id !== clientId);
    saveClients(updatedClients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      Swal.fire({
        title: 'Missing Fields',
        text: 'Please fill in all required fields',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (editingClient) {
      // Update existing client
      const updatedClients = clients.map((c) =>
        c.id === editingClient.id ? { ...c, ...formData } : c,
      );
      saveClients(updatedClients);
      await Swal.fire({
        title: 'Updated!',
        text: 'Client updated successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      // Add new client
      const newClient: Client = {
        id: Date.now().toString(),
        ...formData,
        provinceId: selectedProvince!,
      };
      saveClients([...clients, newClient]);
      await Swal.fire({
        title: 'Added!',
        text: 'Client added successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    }

    setShowAddModal(false);
    setShowProvinceModal(true);
    setFormData({
      name: '',
      location: '',
      contactPerson: '',
      phone: '',
      email: '',
    });
  };

  const getProvinceClients = (provinceId: string) => {
    return clients.filter((c) => c.provinceId === provinceId);
  };

  const selectedProvinceData = provinces.find((p) => p.id === selectedProvince);
  const provinceClients = selectedProvince ? getProvinceClients(selectedProvince) : [];
  const [showProvinceModal, setShowProvinceModal] = useState(false);

  const handleProvinceClickNew = (provinceId: string) => {
    setSelectedProvince(provinceId);
    setShowProvinceModal(true);
  };

  const loadSampleData = async () => {
    try {
      const response = await fetch('/sample-peg-data.json');
      const sampleClients = await response.json();
      saveClients(sampleClients);
      Swal.fire({
        title: 'Success!',
        text: 'Sample data loaded successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to load sample data',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const clearAllData = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to clear all client data?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear all!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      saveClients([]);
      Swal.fire({
        title: 'Cleared!',
        text: 'All data has been cleared.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My PEG</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadSampleData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Load Sample Data
            </button>
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Clear All Data
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your regional clients across South African provinces
        </p>
      </div>

      {/* Province Selection Cards - Alternative to map */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {provinces.map((province) => {
          const clientCount = getProvinceClients(province.id).length;
          return (
            <button
              key={province.id}
              onClick={() => handleProvinceClickNew(province.id)}
              className="p-6 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: selectedProvince === province.id ? province.color : 'transparent',
                borderColor: province.color,
                color: selectedProvince === province.id ? 'white' : undefined,
              }}
            >
              <div className="text-center">
                <div
                  className="text-lg font-bold mb-2"
                  style={{ color: selectedProvince === province.id ? 'white' : province.color }}
                >
                  {province.name}
                </div>
                <div className="text-2xl font-bold mb-1">{clientCount}</div>
                <div className="text-sm opacity-90">{clientCount === 1 ? 'Client' : 'Clients'}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full">
        {/* Map Section */}
        <div>
          {/* Enhanced Header with Icon and Gradient */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full shadow-lg mb-2">
              <MapPin className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">South Africa - Provinces</h2>
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Click on any province to view and manage clients
            </p>
          </div>

          {/* Image Map with Clickable Overlays */}
          <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-xl p-6 overflow-hidden border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
            <img
              src="/south-africa-provinces-map2.png"
              alt="South Africa Provinces Map"
              className="w-full h-auto rounded-lg shadow-md"
            />

            {/* Clickable overlay areas positioned over provinces */}
            {/* Adjust the percentages based on where provinces are in your image */}

            {/* Limpopo - Top North - Green */}
            <button
              onClick={() => handleProvinceClickNew('LP')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '5%',
                left: '57%',
                width: '35%',
                height: '25%',
                backgroundColor: 'rgba(139, 195, 74, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(139, 195, 74, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(139, 195, 74, 0.3)')
              }
              title="Limpopo"
            />

            {/* Mpumalanga - Top Right - Dark Blue */}
            <button
              onClick={() => handleProvinceClickNew('MP')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '18%',
                left: '78%',
                width: '20%',
                height: '28%',
                backgroundColor: 'rgba(63, 81, 181, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(63, 81, 181, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(63, 81, 181, 0.3)')
              }
              title="Mpumalanga"
            />

            {/* Gauteng - Center (small) - Light Blue */}
            <button
              onClick={() => handleProvinceClickNew('GP')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '28%',
                left: '64%',
                width: '10%',
                height: '10%',
                backgroundColor: 'rgba(100, 181, 246, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(100, 181, 246, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(100, 181, 246, 0.3)')
              }
              title="Gauteng"
            />

            {/* North West - Left Center - Gray */}
            <button
              onClick={() => handleProvinceClickNew('NW')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '20%',
                left: '33%',
                width: '28%',
                height: '25%',
                backgroundColor: 'rgba(158, 158, 158, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(158, 158, 158, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(158, 158, 158, 0.3)')
              }
              title="North West"
            />

            {/* Free State - Center - Yellow/Gold */}
            <button
              onClick={() => handleProvinceClickNew('FS')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '40%',
                left: '52%',
                width: '24%',
                height: '28%',
                backgroundColor: 'rgba(255, 193, 7, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.3)')
              }
              title="Free State"
            />

            {/* KwaZulu-Natal - Right - Dark Gray */}
            <button
              onClick={() => handleProvinceClickNew('KZN')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '48%',
                left: '76%',
                width: '20%',
                height: '32%',
                backgroundColor: 'rgba(97, 97, 97, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(97, 97, 97, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(97, 97, 97, 0.3)')
              }
              title="KwaZulu-Natal"
            />

            {/* Northern Cape - Left - Blue */}
            <button
              onClick={() => handleProvinceClickNew('NC')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '40%',
                left: '22%',
                width: '32%',
                height: '38%',
                backgroundColor: 'rgba(66, 165, 245, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(66, 165, 245, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(66, 165, 245, 0.3)')
              }
              title="Northern Cape"
            />

            {/* Eastern Cape - Bottom Center - Brown/Rust */}
            <button
              onClick={() => handleProvinceClickNew('EC')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '70%',
                left: '52%',
                width: '30%',
                height: '24%',
                backgroundColor: 'rgba(141, 110, 99, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(141, 110, 99, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(141, 110, 99, 0.3)')
              }
              title="Eastern Cape"
            />

            {/* Western Cape - Bottom Left - Orange */}
            <button
              onClick={() => handleProvinceClickNew('WC')}
              className="absolute transition-all border-2 border-transparent rounded"
              style={{
                top: '75%',
                left: '18%',
                width: '22%',
                height: '22%',
                backgroundColor: 'rgba(255, 152, 0, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.3)')
              }
              title="Western Cape"
            />

            {/* Client count badges on provinces */}
            {provinces.map((province) => {
              const clientCount = getProvinceClients(province.id).length;
              if (clientCount === 0) return null;

              const positions: Record<string, { top: string; left: string }> = {
                LP: { top: '15%', left: '70%' },
                MP: { top: '28%', left: '81%' },
                GP: { top: '32%', left: '69%' },
                NW: { top: '32%', left: '47%' },
                FS: { top: '54%', left: '56%' },
                KZN: { top: '58%', left: '82%' },
                NC: { top: '52%', left: '38%' },
                EC: { top: '80%', left: '58%' },
                WC: { top: '85%', left: '26%' },
              };

              const pos = positions[province.id];

              return (
                <div
                  key={province.id}
                  className="absolute flex items-center justify-center w-10 h-10 rounded-full shadow-lg animate-pulse"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    backgroundColor: province.color,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`${clientCount} client${clientCount === 1 ? '' : 's'} in ${province.name}`}
                >
                  <span className="text-white font-bold text-sm">{clientCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
                          <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                            {client.location}
                          </p>
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
                              const result = await Swal.fire({
                                title: 'Are you sure?',
                                text: `Do you want to delete ${client.name}?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#dc2626',
                                cancelButtonColor: '#6b7280',
                                confirmButtonText: 'Yes, delete!',
                                cancelButtonText: 'Cancel',
                              });

                              if (result.isConfirmed) {
                                handleDeleteClient(client.id);
                                Swal.fire({
                                  title: 'Deleted!',
                                  text: `${client.name} has been deleted.`,
                                  icon: 'success',
                                  timer: 2000,
                                  showConfirmButton: false,
                                });
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
