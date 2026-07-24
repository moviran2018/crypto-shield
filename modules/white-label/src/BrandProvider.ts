import type { BrandSettings } from './types.js';

const DEFAULT_BRAND: BrandSettings = {
  instanceId: 'default',
  logoUrl: '/logo.svg',
  brandName: 'Crypto Shield',
  primaryColor: '#E87A00',
  secondaryColor: '#FFD700',
  accentColor: '#F5F0E8',
  customDomain: null,
  telegramBotToken: null,
  theme: 'dark',
  fontFamily: "'Inter', system-ui, sans-serif",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

let currentBrand: BrandSettings = { ...DEFAULT_BRAND };

const listeners: Array<(brand: BrandSettings) => void> = [];

export function getBrand(): BrandSettings {
  return { ...currentBrand };
}

export function updateBrand(updates: Partial<BrandSettings>): BrandSettings {
  currentBrand = {
    ...currentBrand,
    ...updates,
    updatedAt: Date.now(),
  };
  listeners.forEach(fn => fn(currentBrand));
  return getBrand();
}

export function resetBrand(): BrandSettings {
  currentBrand = { ...DEFAULT_BRAND };
  listeners.forEach(fn => fn(currentBrand));
  return getBrand();
}

export function subscribeToBrandChanges(fn: (brand: BrandSettings) => void): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function generateBrandCSS(brand: BrandSettings): string {
  return `
    :root {
      --brand-primary: ${brand.primaryColor};
      --brand-secondary: ${brand.secondaryColor};
      --brand-accent: ${brand.accentColor};
      --brand-name: "${brand.brandName}";
      --brand-font: ${brand.fontFamily};
    }
    .brand-bg-primary { background-color: var(--brand-primary); }
    .brand-text-primary { color: var(--brand-primary); }
    .brand-border-primary { border-color: var(--brand-primary); }
    .brand-bg-secondary { background-color: var(--brand-secondary); }
    .brand-text-secondary { color: var(--brand-secondary); }
    .brand-border-secondary { border-color: var(--brand-secondary); }
  `.trim();
}