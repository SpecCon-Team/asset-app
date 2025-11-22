import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, MapPin } from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError } from '@/lib/sweetalert';

export default function InventoryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    description: '',
    category: '',
    subcategory: '',
    unit: '',
    unitPrice: '',
    currentStock: '0',
    minimumStock: '0',
    maximumStock: '',
    reorderPoint: '0',
    reorderQuantity: '0',
    location: '',
    binLocation: '',
    barcode: '',
    manufacturer: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (isEditMode) {
      fetchItem();
    }
  }, [isEditMode, id]);

  const fetchItem = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/inventory/${id}`);
      const item = response.data;

      setFormData({
        itemCode: item.itemCode,
        name: item.name,
        description: item.description || '',
        category: item.category,
        subcategory: item.subcategory || '',
        unit: item.unit,
        unitPrice: item.unitPrice?.toString() || '',
        currentStock: item.currentStock.toString(),
        minimumStock: item.minimumStock.toString(),
        maximumStock: item.maximumStock?.toString() || '',
        reorderPoint: item.reorderPoint.toString(),
        reorderQuantity: item.reorderQuantity.toString(),
        location: item.location || '',
        binLocation: item.binLocation || '',
        barcode: item.barcode || '',
        manufacturer: item.manufacturer || '',
        imageUrl: item.imageUrl || ''
      });
    } catch (error) {
      console.error('Failed to fetch item:', error);
      await showError('Error', 'Failed to load inventory item');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiClient = getApiClient();

      if (isEditMode) {
        await apiClient.put(`/inventory/${id}`, formData);
        await showSuccess('Success!', 'Inventory item updated successfully');
      } else {
        await apiClient.post('/inventory', formData);
        await showSuccess('Success!', 'Inventory item created successfully');
      }

      navigate('/inventory');
    } catch (error: any) {
      console.error('Failed to save item:', error);
      await showError('Error', error.response?.data?.message || 'Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          {isEditMode ? 'Edit Inventory Item' : 'Add New Item'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {isEditMode ? 'Update inventory item details' : 'Create a new inventory item'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Item Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="itemCode"
              value={formData.itemCode}
              onChange={handleChange}
              required
              disabled={isEditMode}
              placeholder="e.g., ITM-001"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., A4 Paper"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Item description..."
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-4">Category</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Cleaning Supplies">Cleaning Supplies</option>
              <option value="Safety Equipment">Safety Equipment</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subcategory
            </label>
            <input
              type="text"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              placeholder="e.g., Paper Products"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stock Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-4">Stock Information</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select unit</option>
              <option value="pcs">Pieces</option>
              <option value="box">Boxes</option>
              <option value="pack">Packs</option>
              <option value="kg">Kilograms</option>
              <option value="liter">Liters</option>
              <option value="meter">Meters</option>
              <option value="roll">Rolls</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Unit Price
            </label>
            <input
              type="number"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Stock {!isEditMode && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              name="currentStock"
              value={formData.currentStock}
              onChange={handleChange}
              required={!isEditMode}
              disabled={isEditMode}
              min="0"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
            />
            {isEditMode && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use transactions to adjust stock
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="minimumStock"
              value={formData.minimumStock}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Stock
            </label>
            <input
              type="number"
              name="maximumStock"
              value={formData.maximumStock}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reorder Point <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="reorderPoint"
              value={formData.reorderPoint}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reorder Quantity
            </label>
            <input
              type="number"
              name="reorderQuantity"
              value={formData.reorderQuantity}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location & Additional Info */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-4">Location & Details</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Warehouse A"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bin Location
            </label>
            <input
              type="text"
              name="binLocation"
              value={formData.binLocation}
              onChange={handleChange}
              placeholder="e.g., A-05"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="Barcode number"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manufacturer
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              placeholder="Manufacturer name"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
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
                {isEditMode ? 'Update Item' : 'Create Item'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
