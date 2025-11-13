import { z } from 'zod';

export const AssetSchema = z.object({
  id: z.string().optional(),
  asset_code: z.string(),
  name: z.string(),
  serial_number: z.string().optional().nullable(),
  remote_id: z.string().optional().nullable(),
  asset_type: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  status: z.enum(['available', 'assigned', 'maintenance', 'repair', 'retired']).default('available'),
  assigned_to: z.string().optional().nullable(),
  scanned_by: z.string().optional().nullable(),
  scan_datetime: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  ownership: z.string().optional().nullable(),
  office_location: z.string().optional().nullable(),
  extension: z.string().optional().nullable(),
  deskphones: z.string().optional().nullable(),
  mouse: z.string().optional().nullable(),
  keyboard: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

export const CreateAssetSchema = AssetSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  asset_code: z.string().optional(), // Make asset_code optional for creation (will be auto-generated)
});
export type CreateAssetDto = z.infer<typeof CreateAssetSchema>;

export const UpdateAssetSchema = CreateAssetSchema.partial();
export type UpdateAssetDto = z.infer<typeof UpdateAssetSchema>;


