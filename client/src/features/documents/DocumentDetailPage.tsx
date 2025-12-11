import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError, showConfirmDialog } from '@/lib/sweetalert';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { formatDateTime } from '@/lib/dateFormatter';

interface Document {
  id: string;
  title: string;
  description: string | null;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  tags: string[];
  category: { name: string; color: string } | null;
  uploadedBy: { name: string; email: string };
  uploadedAt: string;
  createdAt: string;
  comments: Array<{
    id: string;
    comment: string;
    user: { name: string };
    createdAt: string;
  }>;
}

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await getApiClient().get(`/documents/${id}`);
      setDocument(response.data);
    } catch (error: any) {
      console.error('Error loading document:', error);
      showError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Authentication required', 'Please log in to download documents');
        return;
      }

      const downloadUrl = `${getApiBaseUrl()}/documents/${id}/download`;

      // Use fetch with authentication headers
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Download failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Get the blob and create a downloadable URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Try to use DOM for download if available
      if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
        const link = document.createElement('a');
        link.href = url;
        link.download = document?.originalFileName || 'document';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback: open in new tab (works for viewing PDFs)
        window.open(url, '_blank');
      }

      // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      showError('Failed to download document', error.message || 'Please try again');
    }
  };

  const handleDelete = async () => {
    const result = await showConfirmDialog(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      'Yes',
      'Cancel'
    );

    if (!result || !result.isConfirmed) return;

    try {
      await getApiClient().delete(`/documents/${id}`);
      showSuccess('Document deleted successfully');
      navigate('/documents');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      showError(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      await getApiClient().post(`/documents/${id}/comments`, {
        comment: newComment
      });

      setNewComment('');
      loadDocument();
      showSuccess('Comment added successfully');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      showError('Failed to add comment');
    }
  };

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading document details" />;
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Document not found</p>
        <Link to="/documents" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{document.originalFileName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Download
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Document Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">File Size</p>
            <p className="text-base font-medium text-gray-900 mt-1">{formatSize(document.fileSize)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="text-base font-medium text-gray-900 mt-1">{document.mimeType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Version</p>
            <p className="text-base font-medium text-gray-900 mt-1">{document.version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Uploaded By</p>
            <p className="text-base font-medium text-gray-900 mt-1">{document.uploadedBy.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Upload Date</p>
            <p className="text-base font-medium text-gray-900 mt-1">
              {formatDateTime(document.uploadedAt || document.createdAt)}
            </p>
          </div>
          {document.category && (
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p
                className="text-base font-medium mt-1 inline-block px-3 py-1 rounded-full"
                style={{ backgroundColor: document.category.color + '30', color: document.category.color }}
              >
                {document.category.name}
              </p>
            </div>
          )}
        </div>
        {document.description && (
          <div>
            <p className="text-sm text-gray-600">Description</p>
            <p className="text-base text-gray-900 mt-1">{document.description}</p>
          </div>
        )}
        {document.tags && document.tags.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Comments ({document.comments.length})
        </h2>

        <form onSubmit={handleAddComment} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="Add a comment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Comment
          </button>
        </form>

        <div className="space-y-3 mt-6">
          {document.comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet</p>
          ) : (
            document.comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{comment.user.name}</span>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700">{comment.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;
