import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { listUsers } from '@/features/users/api';
import type { User } from '@/features/users/types';
import CommentSection from '../components/CommentSection';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { currentTicket, isLoading, fetchTicketById, updateTicket, deleteTicket, clearCurrentTicket } = useTicketsStore();

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketById(id);
    }
    return () => clearCurrentTicket();
  }, [id, fetchTicketById, clearCurrentTicket]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await listUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentTicket) {
      setStatus(currentTicket.status || '');
      setPriority(currentTicket.priority || '');
      setAssignedToId(currentTicket.assignedToId || '');
    }
  }, [currentTicket]);

  const handleUpdate = async () => {
    if (id) {
      const hasChanges = 
        status !== currentTicket?.status || 
        priority !== currentTicket?.priority ||
        assignedToId !== (currentTicket?.assignedToId || '');

      if (!hasChanges) {
        return;
      }

      try {
        await updateTicket(id, { 
          status, 
          priority,
          assignedToId: assignedToId || null,
        });
        alert('Ticket updated successfully!');
        fetchTicketById(id);
      } catch (error) {
        alert('Failed to update ticket');
        console.error('Update error:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteTicket(id);
        alert('Ticket deleted successfully!');
        navigate('/tickets');
      } catch (error) {
        alert('Failed to delete ticket');
        console.error('Delete error:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading ticket details...</div>;
  }

  if (!currentTicket) {
    return <div className="p-8">Ticket not found</div>;
  }

  const hasChanges = 
    status !== currentTicket.status || 
    priority !== currentTicket.priority ||
    assignedToId !== (currentTicket.assignedToId || '');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/tickets')}
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Back to Tickets
          </button>
          <h1 className="text-3xl font-bold">Ticket Details</h1>
          <p className="text-gray-600">Ticket #{currentTicket.number || currentTicket.id}</p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete Ticket
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Delete Ticket?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete ticket <strong>#{currentTicket.number}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-8 space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-xl font-semibold mb-2">{currentTicket.title}</h2>
            </div>

            {/* Status, Priority & Assignee Controls */}
            <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assign To</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  disabled={loadingUsers}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <button
                  onClick={handleUpdate}
                  disabled={!hasChanges}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Update Ticket
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {currentTicket.description || 'No description provided'}
                </p>
              </div>
            </div>

            {/* Resolution */}
            {currentTicket.resolution && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Resolution</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{currentTicket.resolution}</p>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow p-8">
            <CommentSection ticketId={currentTicket.id!} />
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Ticket Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Created by:</span>
                <p className="font-medium mt-1">
                  {(currentTicket as any).createdBy 
                    ? `${(currentTicket as any).createdBy.name || (currentTicket as any).createdBy.email}` 
                    : currentTicket.createdById || '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Assigned to:</span>
                <p className="font-medium mt-1">
                  {currentTicket.assignedTo 
                    ? `${currentTicket.assignedTo.name || currentTicket.assignedTo.email}` 
                    : 'Unassigned'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Created at:</span>
                <p className="font-medium mt-1">
                  {currentTicket.createdAt
                    ? new Date(currentTicket.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Updated at:</span>
                <p className="font-medium mt-1">
                  {currentTicket.updatedAt
                    ? new Date(currentTicket.updatedAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              {currentTicket.assetId && (
                <div>
                  <span className="text-gray-500">Related Asset:</span>
                  <p className="font-medium mt-1">{currentTicket.assetId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}