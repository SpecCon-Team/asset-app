import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAssetsStore } from '../store';
import { useUsersStore } from '../../users/store';
import { CreateAssetInput, CreateAssetSchema } from '../types';

export default function AssetDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { currentAsset, isLoading, fetchAssetById, createAsset, updateAsset, clearCurrentAsset } = useAssetsStore();
  const { users, fetchUsers } = useUsersStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAssetInput>({
    resolver: zodResolver(CreateAssetSchema),
  });

  useEffect(() => {
    fetchUsers();
    if (id) {
      fetchAssetById(id);
    }
    return () => clearCurrentAsset();
  }, [id, fetchAssetById, fetchUsers, clearCurrentAsset]);

  useEffect(() => {
    if (currentAsset && isEditMode) {
      reset(currentAsset);
    }
  }, [currentAsset, isEditMode, reset]);

  const onSubmit = async (data: CreateAssetInput) => {
    try {
      if (isEditMode && id) {
        await updateAsset(id, data);
      } else {
        await createAsset(data);
      }
      navigate('/assets');
    } catch (error) {
      console.error('Failed to save asset:', error);
      alert('Failed to save asset. Please try again.');
    }
  };

  if (isLoading && isEditMode) {
    return <div className="p-8">Loading asset details...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Edit Asset' : 'Create New Asset'}
        </h1>
        <p className="text-gray-600">
          {isEditMode ? 'Update asset information' : 'Add a new asset to the system'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-lg shadow">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Asset Code <span className="text-red-500">*</span>
              </label>
              <input
                {...register('asset_code')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., AST001"
              />
              {errors.asset_code && (
                <p className="text-red-500 text-sm mt-1">{errors.asset_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Dell Laptop"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Asset Type</label>
              <input
                {...register('asset_type')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Laptop, Desktop, Monitor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Condition</label>
              <select
                {...register('condition')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select condition</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Assigned To</label>
              <select
                {...register('assigned_to')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Not assigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              {...register('description')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Additional details about the asset..."
            />
          </div>
        </div>

        {/* Location & Organization */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Location & Organization</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <input
                {...register('department')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., IT, HR, Marketing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Office Location</label>
              <input
                {...register('office_location')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Building A - Floor 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Extension</label>
              <input
                {...register('extension')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2501"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ownership</label>
              <input
                {...register('ownership')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Company, Personal"
              />
            </div>
          </div>
        </div>

        {/* Peripherals */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Peripherals</h2>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Deskphones</label>
              <input
                {...register('deskphones')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., IP Phone Model X"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mouse</label>
              <input
                {...register('mouse')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Wireless Mouse"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Keyboard</label>
              <input
                {...register('keyboard')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mechanical Keyboard"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {isLoading ? 'Saving...' : isEditMode ? 'Update Asset' : 'Create Asset'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/assets')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}