import { describe, it, expect } from 'vitest';
import { CreateAssetSchema } from '@/features/assets/types';

describe('Asset schemas', () => {
  it('validates create asset dto', () => {
    const dto = {
      asset_code: 'AST-1',
      name: 'Laptop',
      status: 'available',
    };
    expect(() => CreateAssetSchema.parse(dto)).not.toThrow();
  });
});

