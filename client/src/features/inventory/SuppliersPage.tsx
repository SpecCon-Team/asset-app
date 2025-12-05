import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';
import { formatDate } from '@/lib/dateFormatter';

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    purchaseOrders: number;
  };
}

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchSuppliers();
  }, [activeFilter]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();

      const params: any = {};
      if (activeFilter !== 'all') {
        params.active = activeFilter === 'active' ? 'true' : 'false';
      }

      const response = await apiClient.get('/inventory/suppliers/list', { params });
      setSuppliers(response.data.suppliers || []);
    } catch (error: any) {
      console.error('Failed to fetch suppliers:', error);
      await showError('Error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = await showConfirm(
      'Delete Supplier',
      `Are you sure you want to delete ${supplier.name}? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    if (confirmed.isConfirmed) {
      try {
        // Note: Backend doesn't have a delete endpoint yet, so we'll just show an error
        await showError('Not Implemented', 'Delete functionality is not yet available');
      } catch (error) {
        console.error('Failed to delete supplier:', error);
        await showError('Error', 'Failed to delete supplier');
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      supplier.supplierCode.toLowerCase().includes(search.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  if (showLoading && suppliers.length === 0) {
    return <LoadingOverlay message="Loading suppliers" />;
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          Suppliers
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage your supplier contacts and information
        </p>
      </div>

      {/* Actions and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Active Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Suppliers</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            Back to Inventory
          </button>

          <button
            onClick={() => navigate('/inventory/suppliers/new')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {search ? 'No suppliers found matching your search' : 'No suppliers found'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/inventory/suppliers/new')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add First Supplier
              </button>
            )}
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {supplier.name}
                        </h3>
                        {supplier.isActive ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Code: {supplier.supplierCode}
                      </p>
                      {supplier.contactPerson && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          Contact: {supplier.contactPerson}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        supplier.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${supplier.email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    )}

                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a
                          href={`tel:${supplier.phone}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    )}

                    {(supplier.address || supplier.city || supplier.country) && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {[supplier.address, supplier.city, supplier.country]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {supplier._count && (
                        <span>
                          <Building2 className="w-4 h-4 inline mr-1" />
                          {supplier._count.purchaseOrders} Purchase Orders
                        </span>
                      )}
                      {supplier.createdBy && (
                        <span>Created by {supplier.createdBy.name}</span>
                      )}
                      {supplier.createdAt && (
                        <span>Added {formatDate(supplier.createdAt)}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Edit functionality not yet implemented in backend
                          showError('Not Implemented', 'Edit supplier functionality is not yet available');
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

