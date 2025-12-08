import React, { useState, useEffect, useRef } from 'react';
import { listUsers } from '@/features/users/api';
import type { User } from '@/features/users/types';
import { getCurrentUserEmail, isAdmin, isTechnician } from '@/features/auth/hooks';
import { showWarning, showError, showSuccess, showConfirm } from '@/lib/sweetalert';
import { formatDateTime } from '@/lib/dateFormatter';
import { getApiBaseUrl } from '@/lib/apiConfig';

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

// Function to get CSRF token from cookies
function getCSRFToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrfToken') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Function to fetch CSRF token from server
async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/csrf-token`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.csrfToken || null;
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error);
    return null;
  }
}

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
    // Only fetch if we have a valid ticketId
    if (!ticketId) {
      console.warn('CommentSection: No ticketId provided');
      setIsLoadingComments(false);
      return;
    }

    fetchComments();
    fetchUsers();
    findCurrentUser();

    // Auto-refresh comments every 10 seconds so users see new admin replies
    const interval = setInterval(() => {
      if (ticketId) {
        fetchComments();
      }
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
    // Validate ticketId before making the request
    if (!ticketId || ticketId === 'undefined' || ticketId === 'null') {
      console.warn('CommentSection.fetchComments: Invalid ticketId:', ticketId);
      setIsLoadingComments(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/comments/ticket/${ticketId}`, {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch comments for ticket ${ticketId}:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        // Don't throw for 404 (ticket not found) - just log it
        if (response.status === 404) {
          console.warn('Ticket not found or no access to comments');
          setComments([]);
          return;
        }

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

    // CRITICAL: Set ALL locks IMMEDIATELY before any other checks
    // This prevents race conditions where two clicks both pass the checks
    if (isGloballySubmitting || isProcessingRef.current || isSubmitting || isLoading) {
      return;
    }

    // Set ALL locks IMMEDIATELY in the same synchronous tick
    isGloballySubmitting = true;
    isProcessingRef.current = true;
    setIsSubmitting(true);
    setIsLoading(true);

    try {
      // For regular users, use their own ID; for admins, use selected user
      const authorId = userIsAdmin ? selectedUserId : currentUserId;

      // Validate inputs first
      if (!newComment.trim()) {
        await showWarning('Missing Comment', 'Please enter a comment');
        return;
      }

      if (!authorId) {
        await showError('Authentication Error', 'Unable to identify user. Please try logging in again.');
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
            await showWarning('Duplicate Comment', 'You already submitted this exact comment. Please wait 30 seconds to submit it again.');
            return;
          }
        } catch (error) {
          console.error('Error reading localStorage:', error);
        }
      }

      // Count submit attempts
      submitCountRef.current += 1;

      // Prevent rapid double-clicks (5 seconds debounce)
      const now = Date.now();
      if (now - lastSubmitTimeRef.current < 5000) {
        await showWarning('Please Wait', 'Please wait 5 seconds between comments');
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

      // Add CSRF token for POST request
      let csrfToken = getCSRFToken();
      if (!csrfToken) {
        csrfToken = await fetchCSRFToken();
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      // Generate unique request ID to help backend detect duplicates
      const requestId = `${authorId}-${ticketId}-${Date.now()}`;

      const response = await fetch(`${getApiBaseUrl()}/comments`, {
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

      await showSuccess('Success!', 'Comment added successfully!', 1500);
    } catch (error) {
      await showError('Error', 'Failed to add comment');
      console.error('Error creating comment:', error);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
      isProcessingRef.current = false;
      isGloballySubmitting = false;
    }
  };

  const handleDelete = async (commentId: string) => {
    const result = await showConfirm(
      'Delete Comment?',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      'Yes, delete it',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add CSRF token for DELETE request
      let csrfToken = getCSRFToken();
      if (!csrfToken) {
        csrfToken = await fetchCSRFToken();
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${getApiBaseUrl()}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      setComments(comments.filter((c) => c.id !== commentId));
      await showSuccess('Deleted!', 'Comment deleted successfully!', 1500);
    } catch (error) {
      await showError('Error', 'Failed to delete comment');
      console.error('Error deleting comment:', error);
    }
  };

  // Don't render if no ticketId
  if (!ticketId) {
    return <div className="p-4 text-gray-500">No ticket selected</div>;
  }

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