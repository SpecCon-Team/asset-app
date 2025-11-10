import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { currentTicket, isLoading, fetchTicketById, updateTicket, clearCurrentTicket } = useTicketsStore();

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    if (id) {
      fetchTicketById(id);
    }
    return () => clearCurrentTicket();
  }, [id, fetchTicketById, clearCurrentTicket]);

  useEffect(() => {
    if (currentTicket) {
      setStatus(currentTicket.status || '');
      setPriority(currentTicket.priority || '');
    }
  }, [currentTicket]);

  const handleUpdateStatus = async () => {
    if (id && (status !== currentTicket?.status || priority !== currentTicket?.priority)) {
      try {
        await updateTicket(id, { status, priority });
        alert('Ticket updated successfully!');
      } catch (error) {
        alert('Failed to update ticket');
      }
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading ticket details...</div>;
  }

  if (!currentTicket) {
    return <div className="p-8">Ticket not found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Tickets
        </button>
        <h1 className="text-3xl font-bold">Ticket Details</h1>
        <p className="text-gray-600">Ticket #{currentTicket.ticket_number || currentTicket.id}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold mb-2">{currentTicket.title}</h2>
        </div>

        {/* Status & Priority Controls */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
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

          <div className="col-span-2">
            <button
              onClick={handleUpdateStatus}
              disabled={status === currentTicket.status && priority === currentTicket.priority}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Created by:</span>
            <span className="ml-2 font-medium">{currentTicket.created_by || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Assigned to:</span>
            <span className="ml-2 font-medium">{currentTicket.assigned_to || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-gray-500">Created at:</span>
            <span className="ml-2 font-medium">
              {currentTicket.created_at
                ? new Date(currentTicket.created_at).toLocaleString()
                : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Updated at:</span>
            <span className="ml-2 font-medium">
              {currentTicket.updated_at
                ? new Date(currentTicket.updated_at).toLocaleString()
                : '-'}
            </span>
          </div>
          {currentTicket.asset_id && (
            <div>
              <span className="text-gray-500">Related Asset:</span>
              <span className="ml-2 font-medium">{currentTicket.asset_id}</span>
            </div>
          )}
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
    </div>
  );
}