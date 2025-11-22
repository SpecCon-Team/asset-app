import React, { useState, useMemo, memo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MoreVertical, User, Calendar, AlertCircle, Flag, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date | string;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => Promise<void>;
  onTicketClick: (ticketId: string) => void;
}

interface Column {
  id: string;
  title: string;
  status: string;
  color: string;
  limit?: number;
}

/**
 * Kanban Board Component
 *
 * Visual board for managing tickets with drag-and-drop functionality.
 * Organizes tickets by status columns with WIP limits.
 *
 * Features:
 * - Drag-and-drop between columns
 * - WIP (Work In Progress) limits
 * - Visual priority indicators
 * - Assignee avatars
 * - Due date warnings
 * - Card quick actions
 * - Responsive layout
 *
 * @example
 * <KanbanBoard
 *   tickets={tickets}
 *   onStatusChange={handleStatusChange}
 *   onTicketClick={handleTicketClick}
 * />
 */
export function KanbanBoard({ tickets, onStatusChange, onTicketClick }: KanbanBoardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Define board columns (matching database schema: open, in_progress, closed)
  const columns: Column[] = [
    {
      id: 'open',
      title: 'Open',
      status: 'open',
      color: '#3B82F6', // blue-500
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      status: 'in_progress',
      color: '#EAB308', // yellow-500
      limit: 5, // WIP limit
    },
    {
      id: 'closed',
      title: 'Closed',
      status: 'closed',
      color: '#6B7280', // gray-500
    },
  ];

  // Group tickets by status
  const ticketsByStatus = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {};

    columns.forEach(column => {
      grouped[column.status] = tickets.filter(ticket => ticket.status === column.status);
    });

    return grouped;
  }, [tickets, columns]);

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside
    if (!destination) return;

    // Same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;

    // Check WIP limit
    const column = columns.find(c => c.status === newStatus);
    if (column?.limit && ticketsByStatus[newStatus].length >= column.limit) {
      // Show warning (you can replace with toast/alert)
      alert(`WIP limit reached for ${column.title} (max ${column.limit})`);
      return;
    }

    // Update ticket status
    setIsUpdating(true);
    try {
      await onStatusChange(draggableId, newStatus);
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      alert('Failed to update ticket status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get initials from name or email
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Memoized ticket card component
  const TicketCard = memo(({ ticket, index, onTicketClick }: { ticket: Ticket; index: number; onTicketClick: (id: string) => void }) => (
    <Draggable
      key={ticket.id}
      draggableId={ticket.id}
      index={index}
      isDragDisabled={isUpdating}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onTicketClick(ticket.id)}
          className={`bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-grab active:cursor-grabbing ${
            snapshot.isDragging
              ? 'rotate-2 sm:rotate-3 shadow-2xl scale-105 ring-2 ring-blue-500'
              : 'shadow-sm'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-[10px] sm:text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
              {ticket.number}
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                ticket.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                <Flag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">{ticket.priority}</span>
              </div>
            </div>
          </div>

          {/* Card Title */}
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2 text-xs sm:text-sm">
            {ticket.title}
          </h4>

          {/* Card Description */}
          {ticket.description && (
            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
              {ticket.description}
            </p>
          )}

          {/* Card Footer */}
          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Assignee */}
            {ticket.assignedTo ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-sm">
                  {getInitials(ticket.assignedTo.name, ticket.assignedTo.email)}
                </div>
                <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 font-medium hidden lg:inline truncate max-w-[100px]">
                  {ticket.assignedTo.name || ticket.assignedTo.email.split('@')[0]}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400 dark:text-gray-500">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[10px] sm:text-xs hidden lg:inline">Unassigned</span>
              </div>
            )}

            {/* Created time */}
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="hidden sm:inline truncate">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  ));

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg md:rounded-xl p-3 sm:p-4 md:p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto w-full">
          <div className="flex gap-3 sm:gap-4 md:gap-6 h-full min-h-[500px] sm:min-h-[600px] w-max md:w-full">
            {columns.map(column => {
              const columnTickets = ticketsByStatus[column.status] || [];
              const isOverLimit = column.limit && columnTickets.length > column.limit;

              return (
                <div
                  key={column.id}
                  className="flex-shrink-0 w-[280px] sm:w-[320px] md:flex-1 md:min-w-[320px] flex flex-col"
                >
                  {/* Column Header */}
                  <div className="mb-3 sm:mb-4 bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border-l-4"
                       style={{ borderLeftColor: column.color }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-md"
                             style={{ backgroundColor: column.color }} />
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                          {column.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                          isOverLimit
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {columnTickets.length}
                          {column.limit && <span className="text-xs ml-1">/ {column.limit}</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Droppable Column */}
                  <Droppable droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4 rounded-lg md:rounded-xl transition-all duration-200 overflow-y-auto ${
                          snapshot.isDraggingOver
                            ? 'bg-blue-100/50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500 shadow-inner'
                            : 'bg-white/50 dark:bg-gray-800/30 border-2 border-gray-200 dark:border-gray-700'
                        }`}
                        style={{ minHeight: '350px' }}
                      >
                        {columnTickets.map((ticket, index) => (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            index={index}
                            onTicketClick={onTicketClick}
                          />
                        ))}
                        {provided.placeholder}

                        {/* Empty State */}
                        {columnTickets.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No tickets</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Drag tickets here</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

export default KanbanBoard;
