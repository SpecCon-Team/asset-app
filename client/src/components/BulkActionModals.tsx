import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { UserPlus, AlertCircle, Flag, XSquare, Trash2 } from 'lucide-react';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number) => void;
  selectedCount: number;
  users: Array<{ id: number; name: string; email: string }>;
}

export function BulkAssignModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  users,
}: BulkAssignModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedUserId) {
      onConfirm(selectedUserId);
      setSelectedUserId(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Tickets">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <UserPlus className="w-4 h-4" />
          <span>Assigning {selectedCount} tickets</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assign to
          </label>
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedUserId}
          >
            Assign Tickets
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface BulkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string) => void;
  selectedCount: number;
}

export function BulkStatusModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: BulkStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const statuses = [
    { value: 'open', label: 'Open', color: 'text-blue-600' },
    { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600' },
    { value: 'pending', label: 'Pending', color: 'text-orange-600' },
    { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
    { value: 'closed', label: 'Closed', color: 'text-gray-600' },
  ];

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus);
      setSelectedStatus('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Status">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <AlertCircle className="w-4 h-4" />
          <span>Changing status for {selectedCount} tickets</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Status
          </label>
          <div className="space-y-2">
            {statuses.map((status) => (
              <label
                key={status.value}
                className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <input
                  type="radio"
                  name="status"
                  value={status.value}
                  checked={selectedStatus === status.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className={`font-medium ${status.color}`}>
                  {status.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedStatus}
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface BulkPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (priority: string) => void;
  selectedCount: number;
}

export function BulkPriorityModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: BulkPriorityModalProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  const handleConfirm = () => {
    if (selectedPriority) {
      onConfirm(selectedPriority);
      setSelectedPriority('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Priority">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Flag className="w-4 h-4" />
          <span>Changing priority for {selectedCount} tickets</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Priority
          </label>
          <div className="space-y-2">
            {priorities.map((priority) => (
              <label
                key={priority.value}
                className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={selectedPriority === priority.value}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className={`font-medium ${priority.color}`}>
                  {priority.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedPriority}
          >
            Update Priority
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface BulkCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
}

export function BulkCloseModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: BulkCloseModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close Tickets">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <XSquare className="w-4 h-4" />
          <span>Closing {selectedCount} tickets</span>
        </div>

        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to close {selectedCount} tickets? This will mark them as
          resolved and closed.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Tickets can be reopened later if needed.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Close Tickets
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: BulkDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (confirmText === 'DELETE') {
      onConfirm();
      setConfirmText('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Tickets">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <Trash2 className="w-4 h-4" />
          <span>Deleting {selectedCount} tickets</span>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            Warning: This action cannot be undone!
          </p>
          <p className="text-sm text-red-700 dark:text-red-400 mt-2">
            All ticket data, comments, attachments, and history will be permanently deleted.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type <span className="font-bold text-red-600">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={confirmText !== 'DELETE'}
          >
            Delete Tickets
          </Button>
        </div>
      </div>
    </Modal>
  );
}
