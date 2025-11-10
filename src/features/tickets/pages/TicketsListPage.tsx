import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '@/features/tickets/hooks';

export function TicketsListPage() {
  const { data: tickets = [], isLoading } = useTickets();
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const s = !status || t.status === status;
      const p = !priority || t.priority === priority;
      return s && p;
    });
  }, [tickets, status, priority]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
      </div>
      <div className="flex gap-3">
        <select className="border rounded-md px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
        <select className="border rounded-md px-3 py-2" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Priority</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3 capitalize">{t.status}</td>
                  <td className="px-4 py-3 capitalize">{t.priority}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/tickets/${t.id}`} className="px-3 py-1.5 rounded-md border hover:bg-gray-50">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


