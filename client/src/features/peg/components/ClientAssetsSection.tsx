import React from 'react';
import { Package, Plus, Loader2 } from 'lucide-react';
import ClientAssetCard from './ClientAssetCard';
import AssignAssetModal from './AssignAssetModal';
import { showSuccess, showConfirm } from '@/lib/sweetalert';

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

interface ClientAssetsSectionProps {
  clientId: string;
  clientName: string;
  assets: Asset[];
  loading: boolean;
  onAssign: (assetIds: string[]) => Promise<boolean>;
  onUnassign: (assetId: string) => Promise<boolean>;
}

export default function ClientAssetsSection({
  clientId,
  clientName,
  assets,
  loading,
  onAssign,
  onUnassign,
}: ClientAssetsSectionProps) {
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [assigning, setAssigning] = React.useState(false);

  const handleAssign = async (assetIds: string[]) => {
    setAssigning(true);
    try {
      const success = await onAssign(assetIds);
      if (success) {
        showSuccess('Success', `${assetIds.length} asset${assetIds.length !== 1 ? 's' : ''} assigned successfully`);
      }
      return success;
    } catch (error) {
      return false;
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (assetId: string) => {
    const result = await showConfirm(
      'Unassign Asset',
      'Are you sure you want to unassign this asset from the client?',
      'Yes, unassign',
      'Cancel'
    );

    if (result.isConfirmed) {
      const success = await onUnassign(assetId);
      if (success) {
        showSuccess('Success', 'Asset unassigned successfully');
      }
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Assigned Assets
            {assets.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                {assets.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Assign Assets
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No assets assigned to this client yet
            </p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Assign First Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(asset => (
              <ClientAssetCard
                key={asset.id}
                asset={asset}
                onUnassign={handleUnassign}
              />
            ))}
          </div>
        )}
      </div>

      <AssignAssetModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssign}
        clientName={clientName}
      />
    </>
  );
}

