import React, { useMemo } from 'react';
import { useAssets } from '@/features/assets/hooks';

export function MyAssetsPage() {
  const currentUserEmail = localStorage.getItem('userEmail') || '';
  const { data: assets = [], isLoading } = useAssets();

  const mine = useMemo(() => {
    return assets.filter((a) => a.assigned_to === currentUserEmail);
  }, [assets, currentUserEmail]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Assets</h1>
      <div className="grid gap-3">
        {mine.map((a) => (
          <div key={a.id ?? a.asset_code} className="border rounded-lg bg-white p-4">
            <p className="font-medium">{a.name}</p>
            <p className="text-sm text-gray-600">{a.asset_code}</p>
            <p className="text-sm text-gray-600 capitalize">Status: {a.status}</p>
          </div>
        ))}
        {mine.length === 0 && <p className="text-gray-600">No assets assigned to you.</p>}
      </div>
    </div>
  );
}


