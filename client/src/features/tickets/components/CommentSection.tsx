import React, { useState, useEffect } from 'react';
import { listUsers } from '@/features/users/api';
import type { User } from '@/features/users/types';

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
  };
}

interface CommentSectionProps {
  ticketId: string;
}

export default function CommentSection({ ticketId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  useEffect(() => {
    fetchComments();
    fetchUsers();
  }, [ticketId]);

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
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !selectedUserId) {
      alert('Please select a user and enter a comment');
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
          authorId: selectedUserId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create comment');

      const newCommentData = await response.json();
      setComments([...comments, newCommentData]);
      setNewComment('');
      alert('Comment added successfully!');
    } catch (error) {
      alert('Failed to add comment');
      console.error('Error creating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      setComments(comments.filter((c) => c.id !== commentId));
      alert('Comment deleted successfully!');
    } catch (error) {
      alert('Failed to delete comment');
      console.error('Error deleting comment:', error);
    }
  };

  if (isLoadingComments) {
    return <div className="p-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold text-sm">
                    {comment.author.name || comment.author.email}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t pt-4">
        <h4 className="font-semibold mb-3">Add a Comment</h4>
        
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
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Adding...' : 'Add Comment'}
        </button>
      </form>
    </div>
  );
}