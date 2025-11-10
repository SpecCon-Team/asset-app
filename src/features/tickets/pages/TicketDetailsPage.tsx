import React from 'react';
import { useParams } from 'react-router-dom';
import { useTicket, useUpdateTicket } from '@/features/tickets/hooks';

export function TicketDetailsPage() {
  const { id } = useParams();
  const { data: ticket, isLoading } = useTicket(id);
  const updateMutation = useUpdateTicket(id ?? '');

  if (isLoading || !ticket) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{ticket.title}</h1>
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <select
            className="border rounded-md px-3 py-2"
            value={ticket.status}
            onChange={(e) => updateMutation.mutate({ status: e.target.value as any })}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <p className="text-sm text-gray-600">Priority</p>
          <select
            className="border rounded-md px-3 py-2"
            value={ticket.priority}
            onChange={(e) => updateMutation.mutate({ priority: e.target.value as any })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        {ticket.description && (
          <div>
            <p className="text-sm text-gray-600">Description</p>
            <p>{ticket.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}


