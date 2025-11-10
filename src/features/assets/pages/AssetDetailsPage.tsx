import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsset, useCreateAsset, useDeleteAsset, useUpdateAsset } from '@/features/assets/hooks';
import { useUsers } from '@/features/users/hooks';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateAssetSchema, type CreateAssetDto, type UpdateAssetDto } from '@/features/assets/types';

type Props = {
  createMode?: boolean;
};

const FormSchema = CreateAssetSchema.extend({
  status: z.enum(['available', 'assigned', 'maintenance', 'repair', 'retired']).default('available'),
});

export function AssetDetailsPage({ createMode }: Props) {
  const params = useParams();
  const id = params.id;
  const isCreate = createMode || !id;
  const navigate = useNavigate();

  const { data: asset, isLoading } = useAsset(isCreate ? undefined : id);
  const { data: users = [] } = useUsers();
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset(id ?? '');
  const deleteMutation = useDeleteAsset();

  const defaultValues = useMemo<CreateAssetDto>(() => {
    return {
      asset_code: `AST-${Date.now()}`,
      name: '',
      asset_type: '',
      condition: 'Good',
      assigned_to: '',
      scanned_by: '',
      scan_datetime: '',
      description: '',
      ownership: '',
      office_location: '',
      extension: '',
      deskphones: '',
      mouse: '',
      keyboard: '',
      department: '',
      status: 'available',
      notes: '',
    } as any;
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isCreate && asset) {
      form.reset({
        asset_code: asset.asset_code ?? '',
        name: asset.name ?? '',
        asset_type: asset.asset_type ?? '',
        condition: asset.condition ?? 'Good',
        assigned_to: asset.assigned_to ?? '',
        scanned_by: asset.scanned_by ?? '',
        scan_datetime: asset.scan_datetime ?? '',
        description: asset.description ?? '',
        ownership: asset.ownership ?? '',
        office_location: asset.office_location ?? '',
        extension: asset.extension ?? '',
        deskphones: asset.deskphones ?? '',
        mouse: asset.mouse ?? '',
        keyboard: asset.keyboard ?? '',
        department: asset.department ?? '',
        status: (asset.status as any) ?? 'available',
        notes: asset.notes ?? '',
      });
    }
  }, [asset, form, isCreate]);

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (isCreate) {
      createMutation.mutate(data, { onSuccess: () => navigate('/assets') });
    } else if (id) {
      const dto: UpdateAssetDto = data;
      updateMutation.mutate(dto, { onSuccess: () => navigate('/assets') });
    }
  };

  const handleDelete = () => {
    if (!id) return;
    if (confirm(`Delete ${form.getValues('name')}? This action cannot be undone.`)) {
      deleteMutation.mutate(id, { onSuccess: () => navigate('/assets') });
    }
  };

  if (!isCreate && isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isCreate ? 'Add New Asset' : 'Edit Asset'}</h1>
          {!isCreate && asset && <p className="text-gray-600 mt-1">{asset.asset_code}</p>}
        </div>
        {!isCreate && (
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-md border text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section className="bg-white rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">Asset Code*</label>
              <input className="border rounded-md px-3 py-2 w-full" disabled={!isCreate} {...form.register('asset_code')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Asset Name*</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm">Asset Type</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('asset_type')} placeholder="e.g., Laptop, Monitor" />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Condition</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('condition')} placeholder="e.g., Good, Excellent" />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Status</label>
              <select className="border rounded-md px-3 py-2 w-full" {...form.register('status')}>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm">Assigned To</label>
              <select className="border rounded-md px-3 py-2 w-full" {...form.register('assigned_to')}>
                <option value="">None</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.full_name ?? u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm">Description</label>
            <textarea className="border rounded-md px-3 py-2 w-full" rows={3} {...form.register('description')} />
          </div>
        </section>

        <section className="bg-white rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">Location & Organization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">Department</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('department')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Office Location</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('office_location')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Extension</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('extension')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Ownership</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('ownership')} placeholder="e.g., Company, Personal" />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">Peripherals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm">Deskphones</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('deskphones')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Mouse</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('mouse')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Keyboard</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('keyboard')} />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">Tracking Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">Scanned By</label>
              <input className="border rounded-md px-3 py-2 w-full" {...form.register('scanned_by')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Scan Date/Time</label>
              <input className="border rounded-md px-3 py-2 w-full" placeholder="e.g., 2024-01-15 10:30" {...form.register('scan_datetime')} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm">Notes</label>
            <textarea className="border rounded-md px-3 py-2 w-full" rows={3} {...form.register('notes')} />
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/assets')}
            className="flex-1 px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : isCreate
              ? 'Create Asset'
              : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}


