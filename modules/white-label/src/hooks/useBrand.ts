import { getBrand, subscribeToBrandChanges } from '../BrandProvider.js';
import type { BrandSettings } from '../types.js';

export interface UseBrandReturn {
  brand: BrandSettings;
  updateBrand: (updates: Partial<BrandSettings>) => BrandSettings;
  resetBrand: () => BrandSettings;
}

export function createUseBrand(): UseBrandReturn {
  let brand = getBrand();

  subscribeToBrandChanges((newBrand) => {
    brand = newBrand;
  });

  return {
    get brand() { return brand; },
    updateBrand: (updates) => {
      const { updateBrand: update } = require('../BrandProvider.js');
      return update(updates);
    },
    resetBrand: () => {
      const { resetBrand: reset } = require('../BrandProvider.js');
      return reset();
    },
  };
}