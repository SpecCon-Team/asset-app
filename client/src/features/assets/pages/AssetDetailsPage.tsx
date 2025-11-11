import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssetsStore } from '../store';
import type { CreateAssetDto } from '../types';

export default function AssetDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id && id !== 'new';

  const { currentAsset, isLoading, error, fetchAssetById, createAsset, updateAsset } = useAssetsStore();

  const [formData, setFormData] = useState<CreateAssetDto>({
    asset_code: '',
    name: '',
    asset_type: '',
    condition: '',
    status: 'available',
    assigned_to: '',
    scanned_by: '',
    scan_datetime: '',
    description: '',
    ownership: '',
    office_location: '',
    extension: '',
    deskphones: '',
    mouse: '',
    keyboard: '',
    department: '',
    notes: '',
  });

  useEffect(() => {
    if (isEditMode && id) {
      fetchAssetById(id);
    }
  }, [id, isEditMode, fetchAssetById]);

  useEffect(() => {
    if (currentAsset && isEditMode) {
      setFormData({
        asset_code: currentAsset.asset_code || '',
        name: currentAsset.name || '',
        asset_type: currentAsset.asset_type || '',
        condition: currentAsset.condition || '',
        status: currentAsset.status || 'available',
        assigned_to: currentAsset.assigned_to || '',
        scanned_by: currentAsset.scanned_by || '',
        scan_datetime: currentAsset.scan_datetime || '',
        description: currentAsset.description || '',
        ownership: currentAsset.ownership || '',
        office_location: currentAsset.office_location || '',
        extension: currentAsset.extension || '',
        deskphones: currentAsset.deskphones || '',
        mouse: currentAsset.mouse || '',
        keyboard: currentAsset.keyboard || '',
        department: currentAsset.department || '',
        notes: currentAsset.notes || '',
      });
    }
  }, [currentAsset, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && id) {
        await updateAsset(id, formData);
      } else {
        await createAsset(formData);
      }
      navigate('/assets');
    } catch (err) {
      console.error('Failed to save asset:', err);
    }
  };

  if (isLoading && isEditMode) {
    return <div className="p-8">Loading asset...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/assets')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          ← Back to Assets
        </button>
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Edit Asset' : 'Create New Asset'}
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="asset_code"
              value={formData.asset_code}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., ASSET001"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Dell Laptop"
            />
          </div>

          {/* Asset Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Type
            </label>
            <input
              type="text"
              name="asset_type"
              value={formData.asset_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Laptop, Desktop, Monitor"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select condition</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <input
              type="text"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Employee name"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., IT, HR, Finance"
            />
          </div>

          {/* Office Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office Location
            </label>
            <input
              type="text"
              name="office_location"
              value={formData.office_location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Building A, Floor 3"
            />
          </div>

          {/* Ownership */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ownership
            </label>
            <input
              type="text"
              name="ownership"
              value={formData.ownership}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Company, Leased"
            />
          </div>

          {/* Extension */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extension
            </label>
            <input
              type="text"
              name="extension"
              value={formData.extension}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone extension"
            />
          </div>

          {/* Desk Phones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desk Phones
            </label>
            <input
              type="text"
              name="deskphones"
              value={formData.deskphones}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone numbers"
            />
          </div>

          {/* Mouse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mouse
            </label>
            <input
              type="text"
              name="mouse"
              value={formData.mouse}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mouse type/model"
            />
          </div>

          {/* Keyboard */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyboard
            </label>
            <input
              type="text"
              name="keyboard"
              value={formData.keyboard}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Keyboard type/model"
            />
          </div>

          {/* Scanned By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scanned By
            </label>
            <input
              type="text"
              name="scanned_by"
              value={formData.scanned_by}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Scanner name"
            />
          </div>

          {/* Scan DateTime */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Date/Time
            </label>
            <input
              type="text"
              name="scan_datetime"
              value={formData.scan_datetime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Scan date and time"
            />
          </div>

          {/* Description - Full Width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Asset description..."
            />
          </div>

          {/* Notes - Full Width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/assets')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : isEditMode ? 'Update Asset' : 'Create Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}