import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, User, MapPin, FileText } from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError } from '@/lib/sweetalert';

interface Asset {
  id: string;
  name: string;
  asset_code: string;
  asset_type: string;
  checkoutStatus: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default function CheckoutFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [formData, setFormData] = useState({
    assetId: '',
    userId: '',
    expectedReturnDate: '',
    location: '',
    purpose: '',
    notes: '',
    condition: 'good'
  });

  useEffect(() => {
    fetchAssets();
    fetchUsers();
    if (isEditMode) {
      fetchCheckout();
    }
  }, [isEditMode, id]);

  const fetchAssets = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/assets');
      // Only show available assets for new checkout
      const assetsList = Array.isArray(response.data) ? response.data : (response.data.assets || []);
      if (!isEditMode) {
        setAssets(assetsList.filter((a: Asset) => a.checkoutStatus === 'available'));
      } else {
        setAssets(assetsList);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/users');
      const usersArray = Array.isArray(response.data) ? response.data : (response.data.users || []);
      setUsers(usersArray);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchCheckout = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/checkout/${id}`);
      const checkout = response.data;

      setFormData({
        assetId: checkout.assetId,
        userId: checkout.userId,
        expectedReturnDate: checkout.expectedReturnDate
          ? new Date(checkout.expectedReturnDate).toISOString().split('T')[0]
          : '',
        location: checkout.location || '',
        purpose: checkout.purpose || '',
        notes: checkout.notes || '',
        condition: checkout.condition || 'good'
      });
    } catch (error) {
      console.error('Failed to fetch checkout:', error);
      await showError('Error', 'Failed to load checkout details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiClient = getApiClient();

      if (isEditMode) {
        await apiClient.put(`/checkout/${id}`, formData);
        await showSuccess('Success!', 'Checkout updated successfully');
      } else {
        await apiClient.post('/checkout', formData);
        await showSuccess('Success!', 'Asset checked out successfully');
      }

      navigate('/checkout');
    } catch (error: any) {
      console.error('Failed to save checkout:', error);
      await showError('Error', error.response?.data?.message || 'Failed to save checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/checkout')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Checkouts
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          {isEditMode ? 'Edit Checkout' : 'Check Out Asset'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {isEditMode ? 'Update checkout details' : 'Assign an asset to a user'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Asset <span className="text-red-500">*</span>
            </label>
            <select
              name="assetId"
              value={formData.assetId}
              onChange={handleChange}
              required
              disabled={isEditMode}
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              <option value="">Select an asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.asset_code}) - {asset.asset_type}
                </option>
              ))}
            </select>
            {isEditMode && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Asset cannot be changed after checkout
              </p>
            )}
          </div>

          {/* User Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign To <span className="text-red-500">*</span>
            </label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Expected Return Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Expected Return Date
            </label>
            <input
              type="date"
              name="expectedReturnDate"
              value={formData.expectedReturnDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Asset Condition <span className="text-red-500">*</span>
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          {/* Location */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Office 301, Remote Work, etc."
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Purpose */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Purpose
            </label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="e.g., Project work, Training, Remote work setup"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional information..."
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                {isEditMode ? 'Update Checkout' : 'Check Out'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
