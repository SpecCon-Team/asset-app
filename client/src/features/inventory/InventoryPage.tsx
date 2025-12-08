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
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await apiClient.get('/inventory', { params });
      setItems(response.data.items || []);

      const uniqueCategories = [...new Set(response.data.items.map((item: InventoryItem) => item.category))];
      setCategories(uniqueCategories);
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
    const searchTerm = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchTerm) ||
      item.itemCode.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    );
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-50" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R{Number(stats.totalValue).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600 dark:text-green-400 opacity-50" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.lowStockCount}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-50" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.outOfStockCount}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400 opacity-50" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.recentTransactions}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 dark:text-purple-400 opacity-50" />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col gap-3">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Category */}
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
            >
              <option value="all">All Status</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/inventory/new')}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>

              <button
                onClick={() => navigate('/inventory/suppliers')}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" /> Suppliers
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              No inventory items found
            </p>
            <button
              onClick={() => navigate('/inventory/new')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" /> Add First Item
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const stockLevel = Math.min(100, (item.currentStock / (item.reorderPoint * 2)) * 100);
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/inventory/${item.id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex flex-col gap-4">

                  {/* Header */}
                  <div className="flex justify-between">
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

                    <span className={`px-3 py-1 text-xs rounded-full ${getStockStatusColor(item.stockStatus)}`}>
                      {getStockStatusText(item.stockStatus)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">

                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Current Stock</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.currentStock} {item.unit}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Min Stock</p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {item.minimumStock} {item.unit}
                      </p>
                    </div>

                    {item.unitPrice && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Unit Price</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          R{item.unitPrice}
                        </p>
                      </div>
                    )}

                    {item.location && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Location</p>
                        <p className="text-base text-gray-900 dark:text-white truncate">
                          {item.location}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Stock Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Stock Level</span>
                      <span>{Math.round(stockLevel)}%</span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.stockStatus === 'out_of_stock'
                            ? 'bg-red-600'
                            : item.stockStatus === 'reorder_now'
                            ? 'bg-orange-600'
                            : item.stockStatus === 'low_stock'
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${stockLevel}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
