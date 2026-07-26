import type { TokenAnalysis, CacheEntry } from './types.js';

const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

const store = new Map<string, CacheEntry>();

export function getCached(address: string, chain: string): TokenAnalysis | null {
  const key = `${chain}:${address.toLowerCase()}`;
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return { ...entry.data, cacheHit: true };
}

export function setCache(address: string, chain: string, data: TokenAnalysis): void {
  const key = `${chain}:${address.toLowerCase()}`;
  store.set(key, {
    data: { ...data, cacheHit: true },
    cachedAt: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION_MS,
  });
}

export function getCacheSize(): number {
  return store.size;
}

export function clearExpired(): number {
  let cleared = 0;
  for (const [key, entry] of store) {
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      cleared++;
    }
  }
  return cleared;
}
