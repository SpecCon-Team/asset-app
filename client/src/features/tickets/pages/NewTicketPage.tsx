import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { listUsers } from '@/features/users/api';
import { listAssets } from '@/features/assets/api';
import type { User } from '@/features/users/types';
import type { Asset } from '@/features/assets/types';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { createTicket, isLoading } = useTicketsStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assetId: '',
    createdById: '',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get logged in user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
  }, []);

  // Fetch users and assets on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, assetsData] = await Promise.all([
          listUsers(),
          listAssets(),
        ]);
        setUsers(usersData);
        setAssets(assetsData);

        // Auto-select current user if they're not an admin
        if (currentUser && currentUser.role !== 'ADMIN') {
          const matchedUser = usersData.find(u => u.email === currentUser.email);
          if (matchedUser) {
            setFormData(prev => ({ ...prev, createdById: matchedUser.id }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.createdById.trim()) {
      newErrors.createdById = 'Please select who is creating this ticket';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        createdById: formData.createdById,
        assetId: formData.assetId || null,
      };

      const newTicket = await createTicket(ticketData as any);
      alert('Ticket created successfully!');
      navigate(`/tickets/${newTicket.id}`);
    } catch (error) {
      alert('Failed to create ticket. Please try again.');
      console.error('Error creating ticket:', error);
    }
  };

  if (loadingData) {
    return <div className="p-8">Loading form data...</div>;
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Tickets
        </button>
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-gray-600">Fill in the details to create a new support ticket</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter ticket title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the issue in detail..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        {/* Created By - Only shown for admins */}
        {isAdmin && (
          <div>
            <label htmlFor="createdById" className="block text-sm font-medium mb-2">
              Created By <span className="text-red-500">*</span>
            </label>
            <select
              id="createdById"
              name="createdById"
              value={formData.createdById}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.createdById ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} ({user.email})
                </option>
              ))}
            </select>
            {errors.createdById && <p className="mt-1 text-sm text-red-500">{errors.createdById}</p>}
          </div>
        )}

        {/* Hidden field for non-admins */}
        {!isAdmin && (
          <input type="hidden" name="createdById" value={formData.createdById} />
        )}

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-2">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Asset Dropdown */}
        <div>
          <label htmlFor="assetId" className="block text-sm font-medium mb-2">
            Related Asset (Optional)
          </label>
          <select
            id="assetId"
            name="assetId"
            value={formData.assetId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an asset (optional)</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.asset_code} - {asset.name} ({asset.status})
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Select the asset this ticket is related to, if applicable
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading || loadingData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Ticket'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}