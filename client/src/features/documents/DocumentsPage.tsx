import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError } from '@/lib/sweetalert';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';
import { formatDate } from '@/lib/dateFormatter';

interface Document {
  id: string;
  title: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  category: { name: string; color: string } | null;
  uploadedBy: { name: string };
  uploadedAt?: string;
  createdAt: string;
}

interface Stats {
  totalDocuments: number;
  totalSize: number;
  recentUploads: number;
  byCategory: Array<{ _count: number; category: { name: string } | null }>;
}

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [search, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);

      const [docsRes, statsRes] = await Promise.all([
        apiClient.get(`/documents?${params.toString()}`),
        apiClient.get('/documents/stats')
      ]);

      setDocuments(docsRes.data.documents || []);
      setStats(statsRes.data);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      await showError('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    return '📎';
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading documents" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and organize your documents</p>
        </div>
        <Link
          to="/documents/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Upload Document
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Documents</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalDocuments}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Size</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatSize(stats.totalSize)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.recentUploads}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.byCategory.length}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-1 gap-4 p-4">
          {documents.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No documents found</p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="text-4xl">{getFileIcon(doc.mimeType)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{doc.originalFileName}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{formatSize(doc.fileSize)}</span>
                    {doc.category && (
                      <span className="px-2 py-1 rounded-full" style={{ backgroundColor: doc.category.color + '20' }}>
                        {doc.category.name}
                      </span>
                    )}
                    <span>by {doc.uploadedBy.name}</span>
                    <span>{formatDate(doc.uploadedAt || doc.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
