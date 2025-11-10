import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAssets, useDeleteAsset } from '@/features/assets/hooks';
import type { Asset } from '@/features/assets/types';

export function AssetsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const { data: assets = [], isLoading } = useAssets({ search, status });
  const deleteMutation = useDeleteAsset();

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        !search ||
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.asset_code?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !status || a.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [assets, search, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assets</h1>
        <button
          onClick={() => navigate('/assets/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Asset
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          className="border rounded-md px-3 py-2 flex-1"
          placeholder="Search by code or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-md px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="maintenance">Maintenance</option>
          <option value="repair">Repair</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Assigned To</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: Asset) => (
                <tr key={a.id ?? a.asset_code} className="border-t">
                  <td className="px-4 py-3">{a.asset_code}</td>
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3">{a.asset_type ?? '-'}</td>
                  <td className="px-4 py-3 capitalize">{a.status}</td>
                  <td className="px-4 py-3">{a.assigned_to ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link
                        to={`/assets/${a.id ?? ''}`}
                        className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      <button
                        className="px-3 py-1.5 rounded-md border text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (!a.id) return;
                          if (confirm(`Delete ${a.name}?`)) deleteMutation.mutate(a.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                    No assets found
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


