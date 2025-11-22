import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  QrCode
} from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

interface Checkout {
  id: string;
  asset: {
    id: string;
    name: string;
    asset_code: string;
    asset_type: string;
    image_url?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  checkoutDate: string;
  expectedReturnDate?: string;
  status: string;
  location?: string;
  purpose?: string;
  isOverdue: boolean;
  daysOverdue: number;
}

interface Stats {
  totalCheckouts: number;
  currentCheckouts: number;
  overdueCheckouts: number;
  totalReturned: number;
  avgCheckoutDays: number;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  useEffect(() => {
    fetchCheckouts();
    fetchStats();
  }, [statusFilter, overdueOnly]);

  const fetchCheckouts = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();

      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (overdueOnly) {
        params.overdue = 'true';
      }

      const response = await apiClient.get('/checkout', { params });
      setCheckouts(response.data.checkouts || []);
    } catch (error) {
      console.error('Failed to fetch checkouts:', error);
      await showError('Error', 'Failed to load checkouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/checkout/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCheckIn = async (checkoutId: string) => {
    const confirmed = await showConfirm(
      'Check In Asset',
      'Are you sure you want to check in this asset?',
      'Check In',
      'Cancel'
    );

    if (!confirmed.isConfirmed) return;

    try {
      const apiClient = getApiClient();
      await apiClient.post(`/checkout/${checkoutId}/checkin`, {
        returnCondition: 'good'
      });

      await showSuccess('Success!', 'Asset checked in successfully', 1500);
      fetchCheckouts();
      fetchStats();
    } catch (error: any) {
      console.error('Failed to check in asset:', error);
      await showError('Error', error.response?.data?.message || 'Failed to check in asset');
    }
  };

  const filteredCheckouts = checkouts.filter(checkout => {
    const matchesSearch =
      checkout.asset.name.toLowerCase().includes(search.toLowerCase()) ||
      checkout.asset.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      checkout.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      checkout.user.email.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_out':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'checked_in':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (showLoading && checkouts.length === 0) {
    return <LoadingOverlay message="Loading checkouts" />;
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Asset Check-in/Check-out
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Track asset assignments and manage check-in/check-out operations
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Checkouts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCheckouts}</p>
              </div>
              <Package className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Currently Out</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.currentCheckouts}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueCheckouts}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Returned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReturned}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(stats.avgCheckoutDays)}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-purple-600 dark:text-purple-400 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Actions and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by asset, code, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="checked_out">Checked Out</option>
              <option value="checked_in">Checked In</option>
            </select>
          </div>

          {/* Overdue Filter */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Overdue Only</span>
          </label>

          {/* New Checkout Button */}
          <button
            onClick={() => navigate('/checkout/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Checkout
          </button>

          {/* QR Scanner Button */}
          <button
            onClick={() => navigate('/checkout/scan')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Scan QR
          </button>
        </div>
      </div>

      {/* Checkouts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCheckouts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">No checkouts found</p>
            <button
              onClick={() => navigate('/checkout/new')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Checkout
            </button>
          </div>
        ) : (
          filteredCheckouts.map((checkout) => (
            <div
              key={checkout.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/checkout/${checkout.id}`)}
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Asset Image */}
                {checkout.asset.image_url && (
                  <img
                    src={checkout.asset.image_url}
                    alt={checkout.asset.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}

                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {checkout.asset.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {checkout.asset.asset_code} • {checkout.asset.asset_type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(checkout.status)}`}>
                        {checkout.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {checkout.isOverdue && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          {checkout.daysOverdue} {checkout.daysOverdue === 1 ? 'day' : 'days'} overdue
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Checked out to: {checkout.user.name || checkout.user.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Checkout: {new Date(checkout.checkoutDate).toLocaleDateString()}</span>
                    </div>

                    {checkout.expectedReturnDate && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Expected: {new Date(checkout.expectedReturnDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {checkout.location && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{checkout.location}</span>
                      </div>
                    )}

                    {checkout.purpose && (
                      <div className="col-span-full text-gray-600 dark:text-gray-400">
                        Purpose: {checkout.purpose}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {checkout.status === 'checked_out' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckIn(checkout.id);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Check In
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/checkout/${checkout.id}/edit`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
