import React, { useMemo } from 'react';
import { useTickets } from '@/features/tickets/hooks';

export function MyTicketsPage() {
  const currentUserEmail = localStorage.getItem('userEmail') || '';
  const { data: tickets = [], isLoading } = useTickets();

  const mine = useMemo(() => {
    return tickets.filter((t) => t.assignee === currentUserEmail);
  }, [tickets, currentUserEmail]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Tickets</h1>
      <div className="grid gap-3">
        {mine.map((t) => (
          <div key={t.id} className="border rounded-lg bg-white p-4">
            <p className="font-medium">{t.title}</p>
            <p className="text-sm text-gray-600 capitalize">Status: {t.status}</p>
            <p className="text-sm text-gray-600 capitalize">Priority: {t.priority}</p>
          </div>
        ))}
        {mine.length === 0 && <p className="text-gray-600">No tickets assigned to you.</p>}
      </div>
    </div>
  );
}


