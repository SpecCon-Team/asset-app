import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';

interface Asset {
  id: string;
  name: string;
  asset_code: string;
  asset_type: string;
}

const DepreciationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [formData, setFormData] = useState({
    assetId: '',
    depreciationMethod: 'straight_line',
    purchasePrice: '',
    salvageValue: '0',
    usefulLifeYears: '',
    usefulLifeMonths: '0',
    purchaseDate: '',
    depreciationStartDate: '',
    annualDepreciationRate: '',
    notes: ''
  });

  useEffect(() => {
    loadAssets();
    if (isEditing) {
      loadDepreciation();
    }
  }, [id]);

  const loadAssets = async () => {
    try {
      const response = await api.get('/api/assets', {
        params: { status: 'active', limit: 1000 }
      });
      setAssets(response.data.assets || []);
    } catch (error) {
      console.error('Error loading assets:', error);
      showErrorAlert('Failed to load assets');
    }
  };

  const loadDepreciation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/depreciation/${id}`);
      const record = response.data;

      setFormData({
        assetId: record.assetId,
        depreciationMethod: record.depreciationMethod,
        purchasePrice: record.purchasePrice.toString(),
        salvageValue: record.salvageValue.toString(),
        usefulLifeYears: record.usefulLifeYears.toString(),
        usefulLifeMonths: record.usefulLifeMonths.toString(),
        purchaseDate: new Date(record.purchaseDate).toISOString().split('T')[0],
        depreciationStartDate: new Date(record.depreciationStartDate).toISOString().split('T')[0],
        annualDepreciationRate: record.annualDepreciationRate?.toString() || '',
        notes: record.notes || ''
      });
    } catch (error) {
      console.error('Error loading depreciation:', error);
      showErrorAlert('Failed to load depreciation record');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.assetId || !formData.purchasePrice || !formData.usefulLifeYears ||
        !formData.purchaseDate || !formData.depreciationStartDate) {
      showErrorAlert('Please fill in all required fields');
      return;
    }

    if (formData.depreciationMethod === 'declining_balance' && !formData.annualDepreciationRate) {
      showErrorAlert('Annual depreciation rate is required for declining balance method');
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await api.put(`/api/depreciation/${id}`, formData);
        showSuccessAlert('Depreciation record updated successfully');
      } else {
        await api.post('/api/depreciation', formData);
        showSuccessAlert('Depreciation record created successfully');
      }

      navigate('/depreciation');
    } catch (error: any) {
      console.error('Error saving depreciation:', error);
      showErrorAlert(error.response?.data?.message || 'Failed to save depreciation record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Depreciation' : 'Add Asset Depreciation'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure depreciation settings for an asset
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Selection */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Asset Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset <span className="text-red-500">*</span>
            </label>
            <select
              name="assetId"
              value={formData.assetId}
              onChange={handleChange}
              required
              disabled={isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select an asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.asset_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Depreciation Method */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Depreciation Method</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method <span className="text-red-500">*</span>
            </label>
            <select
              name="depreciationMethod"
              value={formData.depreciationMethod}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="straight_line">Straight Line</option>
              <option value="declining_balance">Declining Balance</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {formData.depreciationMethod === 'straight_line'
                ? 'Equal depreciation amount each period'
                : 'Higher depreciation in early years, decreasing over time'}
            </p>
          </div>

          {formData.depreciationMethod === 'declining_balance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Depreciation Rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="annualDepreciationRate"
                value={formData.annualDepreciationRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 20 for 20%"
              />
            </div>
          )}
        </div>

        {/* Financial Details */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Financial Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salvage Value
              </label>
              <input
                type="number"
                name="salvageValue"
                value={formData.salvageValue}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="mt-1 text-sm text-gray-500">
                Estimated value at end of useful life
              </p>
            </div>
          </div>
        </div>

        {/* Useful Life */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Useful Life</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="usefulLifeYears"
                value={formData.usefulLifeYears}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Months
              </label>
              <input
                type="number"
                name="usefulLifeMonths"
                value={formData.usefulLifeMonths}
                onChange={handleChange}
                min="0"
                max="11"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Important Dates</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depreciation Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="depreciationStartDate"
                value={formData.depreciationStartDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this depreciation..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/depreciation')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Depreciation' : 'Create Depreciation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepreciationFormPage;
