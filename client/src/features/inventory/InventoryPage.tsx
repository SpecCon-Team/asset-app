import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Archive
} from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  unitPrice?: number;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  location?: string;
  stockStatus: string;
}

interface Stats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentTransactions: number;
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, [categoryFilter, statusFilter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();

      const params: any = {};
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await apiClient.get('/inventory', { params });
      setItems(response.data.items || []);

      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.items.map((item: InventoryItem) => item.category))];
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      await showError('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/inventory/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'reorder_now':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'Out of Stock';
      case 'reorder_now':
        return 'Reorder Now';
      case 'low_stock':
        return 'Low Stock';
      default:
        return 'In Stock';
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  if (showLoading && items.length === 0) {
    return <LoadingOverlay message="Loading inventory" />;
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Archive className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Inventory Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Track consumable items, stock levels, and manage suppliers
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
              </div>
              <Package className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R{Number(stats.totalValue).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lowStockCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.outOfStockCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recentTransactions}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600 dark:text-purple-400 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Actions and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Filters and Actions Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/inventory/new')}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>

              <button
                onClick={() => navigate('/inventory/suppliers')}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base min-h-[44px]"
              >
                <ShoppingCart className="w-4 h-4" />
                Suppliers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 sm:p-12 text-center">
            <Archive className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">No inventory items found</p>
            <button
              onClick={() => navigate('/inventory/new')}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 text-sm sm:text-base min-h-[44px]"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add First Item
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/inventory/${item.id}`)}
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.itemCode} • {item.category}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(item.stockStatus)}`}>
                      {getStockStatusText(item.stockStatus)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Current Stock</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {item.currentStock} {item.unit}
                      </p>
                    </div>
 
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Min Stock</p>
                      <p className="text-gray-900 dark:text-white text-sm sm:text-base">{item.minimumStock} {item.unit}</p>
                    </div>
 
                    {item.unitPrice && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Unit Price</p>
                        <p className="text-gray-900 dark:text-white text-sm sm:text-base">${item.unitPrice}</p>
                      </div>
                    )}
 
                    {item.location && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Location</p>
                        <p className="text-gray-900 dark:text-white text-sm sm:text-base truncate">{item.location}</p>
                      </div>
                    )}
                  </div>

                  {/* Stock Bar */}
                  <div className="mt-3 sm:mt-4">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Stock Level</span>
                      <span>{Math.round((item.currentStock / (item.reorderPoint * 2)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.stockStatus === 'out_of_stock' ? 'bg-red-600' :
                          item.stockStatus === 'reorder_now' ? 'bg-orange-600' :
                          'bg-green-600'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((item.currentStock / (item.reorderPoint * 2)) * 100))}%`
                        }}
                      ></div>
                    </div>
                  </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.stockStatus === 'out_of_stock' ? 'bg-red-600' :
                          item.stockStatus === 'reorder_now' ? 'bg-orange-600' :
                          item.stockStatus === 'low_stock' ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{
                          width: `${Math.min(100, (item.currentStock / (item.reorderPoint * 2)) * 100)}%`
                        }}
                      ></div>
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
