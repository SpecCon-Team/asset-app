import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MapPin,
  AlertCircle,
  Plus
} from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';

interface InventoryItemDetail {
  id: string;
  itemCode: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  unitPrice?: number;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  location?: string;
  binLocation?: string;
  barcode?: string;
  manufacturer?: string;
  stockStatus: string;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  transactionType: string;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionDate: string;
  performedBy: {
    name: string;
    email: string;
  };
  notes?: string;
}

export default function InventoryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<InventoryItemDetail | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionData, setTransactionData] = useState({
    transactionType: 'purchase',
    quantity: '',
    unitPrice: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();
      const response = await apiClient.get(`/inventory/${id}`);
      setItem(response.data);
    } catch (error) {
      console.error('Failed to fetch item:', error);
      await showError('Error', 'Failed to load inventory item');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      'Delete Item',
      'Are you sure you want to delete this inventory item? This action cannot be undone.',
      'Delete',
      'Cancel'
    );

    if (!confirmed.isConfirmed) return;

    try {
      const apiClient = getApiClient();
      await apiClient.delete(`/inventory/${id}`);
      await showSuccess('Success!', 'Inventory item deleted successfully', 1500);
      navigate('/inventory');
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      await showError('Error', error.response?.data?.message || 'Failed to delete inventory item');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const apiClient = getApiClient();
      await apiClient.post(`/inventory/${id}/transaction`, transactionData);
      await showSuccess('Success!', 'Stock transaction recorded successfully', 1500);
      setShowTransactionForm(false);
      setTransactionData({ transactionType: 'purchase', quantity: '', unitPrice: '', notes: '' });
      fetchItem();
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      await showError('Error', error.response?.data?.message || 'Failed to record transaction');
    }
  };

  if (loading || !item) {
    return (
      <div className="flex flex-col p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading item details...</p>
          </div>
        </div>
      </div>
    );
  }

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

  const getTransactionIcon = (type: string) => {
    if (['purchase', 'adjustment_in', 'return'].includes(type)) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Inventory
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              {item.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {item.itemCode} • {item.category}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStockStatusColor(item.stockStatus)}`}>
            {item.stockStatus.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Item Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Item Code</p>
                <p className="text-gray-900 dark:text-white font-medium">{item.itemCode}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                <p className="text-gray-900 dark:text-white">{item.category}</p>
              </div>

              {item.subcategory && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Subcategory</p>
                  <p className="text-gray-900 dark:text-white">{item.subcategory}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unit</p>
                <p className="text-gray-900 dark:text-white">{item.unit}</p>
              </div>

              {item.unitPrice && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Unit Price
                  </p>
                  <p className="text-gray-900 dark:text-white">${item.unitPrice}</p>
                </div>
              )}

              {item.location && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {item.location}
                    {item.binLocation && ` - ${item.binLocation}`}
                  </p>
                </div>
              )}

              {item.manufacturer && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manufacturer</p>
                  <p className="text-gray-900 dark:text-white">{item.manufacturer}</p>
                </div>
              )}

              {item.barcode && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Barcode</p>
                  <p className="text-gray-900 dark:text-white font-mono">{item.barcode}</p>
                </div>
              )}

              {item.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white">{item.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stock Levels */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Stock Levels</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{item.currentStock}</p>
                <p className="text-xs text-gray-500">{item.unit}</p>
              </div>

              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Minimum</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{item.minimumStock}</p>
                <p className="text-xs text-gray-500">{item.unit}</p>
              </div>

              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Reorder Point</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{item.reorderPoint}</p>
                <p className="text-xs text-gray-500">{item.unit}</p>
              </div>

              {item.maximumStock && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Maximum</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{item.maximumStock}</p>
                  <p className="text-xs text-gray-500">{item.unit}</p>
                </div>
              )}
            </div>

            {item.currentStock <= item.reorderPoint && (
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Stock is at or below reorder point. Consider ordering {item.reorderQuantity} {item.unit}.
                </p>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h2>
            {item.transactions && item.transactions.length > 0 ? (
              <div className="space-y-3">
                {item.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      {getTransactionIcon(transaction.transactionType)}
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium capitalize">
                          {transaction.transactionType.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          By {transaction.performedBy.name || transaction.performedBy.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(transaction.transactionDate).toLocaleString()}
                        </p>
                        {transaction.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {['purchase', 'adjustment_in', 'return'].includes(transaction.transactionType) ? '+' : '-'}
                        {transaction.quantity}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Balance: {transaction.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowTransactionForm(!showTransactionForm)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Transaction
              </button>

              <button
                onClick={() => navigate(`/inventory/${id}/edit`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Edit Item
              </button>

              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Item
              </button>
            </div>
          </div>

          {/* Transaction Form */}
          {showTransactionForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Record Transaction</h3>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={transactionData.transactionType}
                    onChange={(e) => setTransactionData({ ...transactionData, transactionType: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="purchase">Purchase</option>
                    <option value="issue">Issue</option>
                    <option value="adjustment_in">Adjustment In</option>
                    <option value="adjustment_out">Adjustment Out</option>
                    <option value="return">Return</option>
                    <option value="waste">Waste</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={transactionData.quantity}
                    onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={transactionData.notes}
                    onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTransactionForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Record
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
