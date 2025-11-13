import React, { useState, useEffect } from 'react';
import { listUsers } from '@/features/users/api';
import type { User } from '@/features/users/types';
import { getCurrentUserEmail, isAdmin, isTechnician } from '@/features/auth/hooks';
import Swal from 'sweetalert2';

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

export default function CommentSection({ ticketId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const userIsAdmin = isAdmin();
  const canModifyTicket = isTechnician(); // Admin or Technician can delete comments

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
      const response = await fetch(`http://localhost:4000/api/comments/ticket/${ticketId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched comments:', data); // Debug log
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For regular users, use their own ID; for admins, use selected user
    const authorId = userIsAdmin ? selectedUserId : currentUserId;

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

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment,
          ticketId,
          authorId: authorId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create comment');

      const newCommentData = await response.json();
      setComments([...comments, newCommentData]);
      setNewComment('');
      await Swal.fire({
        title: 'Success!',
        text: 'Comment added successfully!',
        icon: 'success',
        confirmButtonColor: '#10B981',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchComments(); // Refresh to get updated comments
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
      const response = await fetch(`http://localhost:4000/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
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
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
        <button
          onClick={fetchComments}
          className="text-sm text-blue-600 hover:text-blue-800"
          title="Refresh to see new comments"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => {
            // Check if the comment is from admin/technician
            const isAdminComment = comment.author.role === 'ADMIN' || comment.author.role === 'TECHNICIAN';

            return (
              <div
                key={comment.id}
                className={`rounded-lg p-4 border ${isAdminComment ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {comment.author.name || comment.author.email}
                    </span>
                    {isAdminComment && (
                      <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                        {comment.author.role === 'TECHNICIAN' ? 'Technician' : 'Admin'}
                      </span>
                    )}
                    <span className="text-gray-500 text-xs">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {canModifyTicket && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t pt-4">
        <h4 className="font-semibold mb-3">Add a Comment</h4>

        {/* Only show user selector for admins */}
        {userIsAdmin && (
          <div className="mb-3">
            <label htmlFor="commentUser" className="block text-sm font-medium mb-2">
              Comment as:
            </label>
            <select
              id="commentUser"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={isLoading || (!userIsAdmin && !currentUserId)}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Adding...' : 'Add Comment'}
        </button>
      </form>
    </div>
  );
}