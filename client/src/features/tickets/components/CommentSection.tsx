import React, { useState, useEffect, useRef } from 'react';
import { listUsers } from '@/features/users/api';
import type { User } from '@/features/users/types';
import { getCurrentUserEmail, isAdmin, isTechnician } from '@/features/auth/hooks';
import Swal from 'sweetalert2';
import { formatDateTime } from '@/lib/dateFormatter';

interface Comment {
  id: string;
  content: string;
  ticketId: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
    name: string | null;
    role?: string;
  };
}

interface CommentSectionProps {
  ticketId: string;
}

// Global request queue to prevent concurrent submissions
let isGloballySubmitting = false;
const requestQueue: Array<() => Promise<void>> = [];

export default function CommentSection({ ticketId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent any form submission
  const userIsAdmin = isAdmin();
  const canModifyTicket = isTechnician(); // Admin or Technician can delete comments
  const lastSubmitTimeRef = useRef<number>(0); // Track last submission time to prevent double-clicks
  const submitCountRef = useRef<number>(0); // Track submit attempts
  const isProcessingRef = useRef<boolean>(false); // Track if this component is processing

  useEffect(() => {
    fetchComments();
    fetchUsers();
    findCurrentUser();

    // Auto-refresh comments every 10 seconds so users see new admin replies
    const interval = setInterval(() => {
      fetchComments();
    }, 10000);

    return () => clearInterval(interval);
  }, [ticketId]);

  const findCurrentUser = async () => {
    const email = getCurrentUserEmail();
    if (email) {
      try {
        const usersData = await listUsers();
        const user = usersData.find(u => u.email === email);
        if (user) {
          setCurrentUserId(user.id);
          setSelectedUserId(user.id); // Set as default
        }
      } catch (error) {
        console.error('Error finding current user:', error);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await listUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:4000/api/comments/ticket/${ticketId}`, {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('[SUBMIT START] Checking locks...');
    console.log('  - isGloballySubmitting:', isGloballySubmitting);
    console.log('  - isProcessingRef.current:', isProcessingRef.current);
    console.log('  - isSubmitting:', isSubmitting);
    console.log('  - isLoading:', isLoading);

    // CRITICAL: Set ALL locks IMMEDIATELY before any other checks
    // This prevents race conditions where two clicks both pass the checks
    if (isGloballySubmitting || isProcessingRef.current || isSubmitting || isLoading) {
      console.log('[BLOCKED] ❌ Submission in progress - ignoring request');
      return;
    }

    // Set ALL locks IMMEDIATELY in the same synchronous tick
    isGloballySubmitting = true;
    isProcessingRef.current = true;
    setIsSubmitting(true);
    setIsLoading(true);

    console.log('[SUBMIT] ✅ All locks set - proceeding with submission');

    try {
      // For regular users, use their own ID; for admins, use selected user
      const authorId = userIsAdmin ? selectedUserId : currentUserId;

      // Validate inputs first
      if (!newComment.trim()) {
        await Swal.fire({
          title: 'Missing Comment',
          text: 'Please enter a comment',
          icon: 'warning',
          confirmButtonColor: '#3B82F6',
        });
        return;
      }

      if (!authorId) {
        await Swal.fire({
          title: 'Authentication Error',
          text: 'Unable to identify user. Please try logging in again.',
          icon: 'error',
          confirmButtonColor: '#EF4444',
        });
        return;
      }

      // Check localStorage for recent identical comment (last 30 seconds)
      const localStorageKey = `lastComment_${authorId}_${ticketId}`;
      const lastCommentData = localStorage.getItem(localStorageKey);

      if (lastCommentData) {
        try {
          const { content, timestamp } = JSON.parse(lastCommentData);
          const timeSinceLastComment = Date.now() - timestamp;

          // If same content within 30 seconds, block it
          if (content === newComment.trim() && timeSinceLastComment < 30000) {
            console.log('[BLOCKED] Identical comment in localStorage - preventing duplicate');
            await Swal.fire({
              title: 'Duplicate Comment',
              text: 'You already submitted this exact comment. Please wait 30 seconds to submit it again.',
              icon: 'warning',
              confirmButtonColor: '#3B82F6',
            });
            return;
          }
        } catch (error) {
          console.error('Error reading localStorage:', error);
        }
      }

      // Count submit attempts
      submitCountRef.current += 1;
      console.log(`[SUBMIT] Attempt #${submitCountRef.current}`);

      // Prevent rapid double-clicks (5 seconds debounce)
      const now = Date.now();
      if (now - lastSubmitTimeRef.current < 5000) {
        console.log('[BLOCKED] Too soon - must wait 5 seconds between comments');
        await Swal.fire({
          title: 'Please Wait',
          text: 'Please wait 5 seconds between comments',
          icon: 'warning',
          confirmButtonColor: '#3B82F6',
          timer: 2000,
        });
        return;
      }
      lastSubmitTimeRef.current = now;
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Generate unique request ID to help backend detect duplicates
      const requestId = `${authorId}-${ticketId}-${Date.now()}`;

      console.log('[API] Sending comment to server...');

      const response = await fetch('http://localhost:4000/api/comments', {
        method: 'POST',
        headers: {
          ...headers,
          'X-Request-ID': requestId,
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment,
          ticketId,
          authorId: authorId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create comment');

      const newCommentData = await response.json();
      console.log('[API] Comment created successfully:', newCommentData.id);

      // Store in localStorage to prevent duplicates (reuse localStorageKey from above)
      localStorage.setItem(localStorageKey, JSON.stringify({
        content: newComment.trim(),
        timestamp: Date.now(),
        commentId: newCommentData.id
      }));

      // Clear old localStorage entries (older than 1 minute)
      setTimeout(() => {
        try {
          const data = localStorage.getItem(localStorageKey);
          if (data) {
            const { timestamp } = JSON.parse(data);
            if (Date.now() - timestamp > 60000) {
              localStorage.removeItem(localStorageKey);
            }
          }
        } catch (error) {
          console.error('Error cleaning localStorage:', error);
        }
      }, 60000);

      // Clear form immediately
      setNewComment('');

      // Wait 1 second before refreshing to let DB sync
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh comments from server
      await fetchComments();

      await Swal.fire({
        title: 'Success!',
        text: 'Comment added successfully!',
        icon: 'success',
        confirmButtonColor: '#10B981',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: 'Failed to add comment',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
      console.error('Error creating comment:', error);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
      isProcessingRef.current = false;
      isGloballySubmitting = false;
      console.log('[UNLOCKED] All locks released');
    }
  };

  const handleDelete = async (commentId: string) => {
    const result = await Swal.fire({
      title: 'Delete Comment?',
      text: 'Are you sure you want to delete this comment? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:4000/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      setComments(comments.filter((c) => c.id !== commentId));
      await Swal.fire({
        title: 'Deleted!',
        text: 'Comment deleted successfully!',
        icon: 'success',
        confirmButtonColor: '#10B981',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: 'Failed to delete comment',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
      console.error('Error deleting comment:', error);
    }
  };

  if (isLoadingComments) {
    return <div className="p-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comments ({comments.length})</h3>
        <button
          onClick={fetchComments}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          title="Refresh to see new comments"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => {
            // Determine role-specific styling
            const role = comment.author.role;
            let bgColor, borderColor, badgeColor, badgeText;

            if (role === 'ADMIN') {
              bgColor = 'bg-purple-50 dark:bg-purple-900/30';
              borderColor = 'border-purple-300 dark:border-purple-700';
              badgeColor = 'bg-purple-600 dark:bg-purple-500';
              badgeText = 'Admin';
            } else if (role === 'TECHNICIAN') {
              bgColor = 'bg-blue-50 dark:bg-blue-900/30';
              borderColor = 'border-blue-300 dark:border-blue-700';
              badgeColor = 'bg-blue-600 dark:bg-blue-500';
              badgeText = 'Technician';
            } else {
              bgColor = 'bg-green-50 dark:bg-green-900/30';
              borderColor = 'border-green-300 dark:border-green-700';
              badgeColor = 'bg-green-600 dark:bg-green-500';
              badgeText = 'User';
            }

            return (
              <div
                key={comment.id}
                className={`rounded-lg p-4 border ${bgColor} ${borderColor}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {comment.author.name || comment.author.email}
                    </span>
                    <span className={`px-2 py-0.5 text-xs ${badgeColor} text-white rounded-full font-medium`}>
                      {badgeText}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  {canModifyTicket && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{comment.content}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Add a Comment</h4>

        {/* Only show user selector for admins */}
        {userIsAdmin && (
          <div className="mb-3">
            <label htmlFor="commentUser" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Comment as:
            </label>
            <select
              id="commentUser"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your comment here..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Extra check at onClick level
            if (isGloballySubmitting || isProcessingRef.current || isSubmitting || isLoading) {
              console.log('[BUTTON BLOCKED] Already submitting');
              return;
            }
            handleSubmit(e as any);
          }}
          disabled={isSubmitting || isLoading || (!userIsAdmin && !currentUserId) || !newComment.trim()}
          className={`mt-2 px-4 py-2 min-h-[44px] bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${(isSubmitting || isLoading) ? 'pointer-events-none opacity-50' : ''}`}
          style={{ pointerEvents: (isSubmitting || isLoading) ? 'none' : 'auto' }}
        >
          {isSubmitting || isLoading ? (
            <>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="sr-only">Submitting</span>
            </>
          ) : (
            'Add Comment'
          )}
        </button>
      </div>
    </div>
  );
}