import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  MapPin,
  Clock,
  FileText,
  CheckCircle,
  Edit,
  Trash2,
  AlertCircle,
  History
} from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';

interface CheckoutDetail {
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
    phone?: string;
  };
  checkedOutBy: {
    id: string;
    name: string;
    email: string;
  };
  checkedInBy?: {
    id: string;
    name: string;
    email: string;
  };
  checkoutDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  checkinDate?: string;
  status: string;
  location?: string;
  purpose?: string;
  notes?: string;
  condition?: string;
  returnCondition?: string;
  returnNotes?: string;
  isOverdue: boolean;
  daysOverdue: number;
  locationHistory: Array<{
    id: string;
    location: string;
    previousLocation?: string;
    movedAt: string;
    reason?: string;
    notes?: string;
    movedBy: {
      name: string;
      email: string;
    };
  }>;
}

export default function CheckoutDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<CheckoutDetail | null>(null);

  useEffect(() => {
    if (id) {
      fetchCheckout();
    }
  }, [id]);

  const fetchCheckout = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();
      const response = await apiClient.get(`/checkout/${id}`);
      setCheckout(response.data);
    } catch (error) {
      console.error('Failed to fetch checkout:', error);
      await showError('Error', 'Failed to load checkout details');
      navigate('/checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    const confirmed = await showConfirm(
      'Check In Asset',
      'Are you sure you want to check in this asset?',
      'Check In',
      'Cancel'
    );

    if (!confirmed.isConfirmed) return;

    try {
      const apiClient = getApiClient();
      await apiClient.post(`/checkout/${id}/checkin`, {
        returnCondition: 'good'
      });

      await showSuccess('Success!', 'Asset checked in successfully', 1500);
      navigate('/checkout');
    } catch (error: any) {
      console.error('Failed to check in asset:', error);
      await showError('Error', error.response?.data?.message || 'Failed to check in asset');
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      'Delete Checkout',
      'Are you sure you want to delete this checkout record? This action cannot be undone.',
      'Delete',
      'Cancel'
    );

    if (!confirmed.isConfirmed) return;

    try {
      const apiClient = getApiClient();
      await apiClient.delete(`/checkout/${id}`);

      await showSuccess('Success!', 'Checkout deleted successfully', 1500);
      navigate('/checkout');
    } catch (error: any) {
      console.error('Failed to delete checkout:', error);
      await showError('Error', error.response?.data?.message || 'Failed to delete checkout');
    }
  };

  if (loading || !checkout) {
    return (
      <div className="flex flex-col p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading checkout details...</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/checkout')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Checkouts
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Checkout Details
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {checkout.asset.name} - {checkout.asset.asset_code}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(checkout.status)}`}>
              {checkout.status.replace('_', ' ').toUpperCase()}
            </span>
            {checkout.isOverdue && (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {checkout.daysOverdue} {checkout.daysOverdue === 1 ? 'day' : 'days'} overdue
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Asset Information
            </h2>
            <div className="flex gap-4">
              {checkout.asset.image_url && (
                <img
                  src={checkout.asset.image_url}
                  alt={checkout.asset.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Asset Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{checkout.asset.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Asset Code</p>
                  <p className="text-gray-900 dark:text-white">{checkout.asset.asset_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Asset Type</p>
                  <p className="text-gray-900 dark:text-white">{checkout.asset.asset_type}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Checkout Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  Checked Out To
                </p>
                <p className="text-gray-900 dark:text-white font-medium">{checkout.user.name || checkout.user.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{checkout.user.email}</p>
                {checkout.user.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{checkout.user.phone}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  Checked Out By
                </p>
                <p className="text-gray-900 dark:text-white font-medium">{checkout.checkedOutBy.name || checkout.checkedOutBy.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{checkout.checkedOutBy.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  Checkout Date
                </p>
                <p className="text-gray-900 dark:text-white">{new Date(checkout.checkoutDate).toLocaleString()}</p>
              </div>

              {checkout.expectedReturnDate && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    Expected Return
                  </p>
                  <p className="text-gray-900 dark:text-white">{new Date(checkout.expectedReturnDate).toLocaleDateString()}</p>
                </div>
              )}

              {checkout.actualReturnDate && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    Actual Return
                  </p>
                  <p className="text-gray-900 dark:text-white">{new Date(checkout.actualReturnDate).toLocaleString()}</p>
                </div>
              )}

              {checkout.checkedInBy && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" />
                    Checked In By
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">{checkout.checkedInBy.name || checkout.checkedInBy.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{checkout.checkedInBy.email}</p>
                </div>
              )}

              {checkout.location && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </p>
                  <p className="text-gray-900 dark:text-white">{checkout.location}</p>
                </div>
              )}

              {checkout.purpose && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4" />
                    Purpose
                  </p>
                  <p className="text-gray-900 dark:text-white">{checkout.purpose}</p>
                </div>
              )}
            </div>
          </div>

          {/* Condition Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Condition</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkout.condition && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Checkout Condition</p>
                  <p className="text-gray-900 dark:text-white capitalize">{checkout.condition}</p>
                </div>
              )}

              {checkout.returnCondition && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Return Condition</p>
                  <p className="text-gray-900 dark:text-white capitalize">{checkout.returnCondition}</p>
                </div>
              )}

              {checkout.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Checkout Notes</p>
                  <p className="text-gray-900 dark:text-white">{checkout.notes}</p>
                </div>
              )}

              {checkout.returnNotes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Return Notes</p>
                  <p className="text-gray-900 dark:text-white">{checkout.returnNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location History */}
          {checkout.locationHistory && checkout.locationHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Location History
              </h2>
              <div className="space-y-4">
                {checkout.locationHistory.map((history) => (
                  <div key={history.id} className="border-l-2 border-blue-600 dark:border-blue-400 pl-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {history.location}
                        </p>
                        {history.previousLocation && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            From: {history.previousLocation}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(history.movedAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Moved by: {history.movedBy.name || history.movedBy.email}
                    </p>
                    {history.reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Reason: {history.reason}
                      </p>
                    )}
                    {history.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {history.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
            <div className="space-y-3">
              {checkout.status === 'checked_out' && (
                <>
                  <button
                    onClick={handleCheckIn}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Check In Asset
                  </button>
                  <button
                    onClick={() => navigate(`/checkout/${id}/edit`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Checkout
                  </button>
                </>
              )}
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Record
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-gray-900 dark:text-white font-medium capitalize">
                  {checkout.status.replace('_', ' ')}
                </p>
              </div>
              {checkout.isOverdue && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-400 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Overdue by {checkout.daysOverdue} {checkout.daysOverdue === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
