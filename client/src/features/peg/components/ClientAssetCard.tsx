import React from 'react';
import { Laptop, Tablet, Package, X, Eye } from 'lucide-react';

interface Asset {
  id: string;
  asset_code: string;
  name: string;
  serial_number?: string | null;
  asset_type?: string | null;
  condition?: string | null;
  status?: string;
  description?: string | null;
}

interface ClientAssetCardProps {
  asset: Asset;
  onUnassign: (assetId: string) => void;
  onViewDetails?: (assetId: string) => void;
}

export default function ClientAssetCard({ asset, onUnassign, onViewDetails }: ClientAssetCardProps) {
  const getAssetIcon = () => {
    const type = asset.asset_type?.toLowerCase() || '';
    if (type.includes('laptop')) return <Laptop className="w-6 h-6" />;
    if (type.includes('tablet')) return <Tablet className="w-6 h-6" />;
    return <Package className="w-6 h-6" />;
  };

  const getConditionColor = () => {
    const condition = asset.condition?.toLowerCase() || '';
    if (condition.includes('good') || condition.includes('excellent')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (condition.includes('fair') || condition.includes('average')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (condition.includes('poor') || condition.includes('bad')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getStatusColor = () => {
    const status = asset.status?.toLowerCase() || 'available';
    if (status === 'assigned') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (status === 'maintenance') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            {getAssetIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {asset.name}
            </h4>
            {asset.serial_number && (
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mt-1">
                SN: {asset.serial_number}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onUnassign(asset.id)}
          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          title="Unassign Asset"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {asset.asset_type && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
            {asset.asset_type}
          </span>
        )}
        {asset.condition && (
          <span className={`px-2 py-1 text-xs font-medium rounded ${getConditionColor()}`}>
            {asset.condition}
          </span>
        )}
        {asset.status && (
          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor()}`}>
            {asset.status}
          </span>
        )}
      </div>

      {asset.asset_code && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Code: {asset.asset_code}
        </div>
      )}

      {onViewDetails && (
        <button
          onClick={() => onViewDetails(asset.id)}
          className="w-full mt-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      )}
    </div>
  );
}

