import type { ScanHistoryEntry, ChangeDetection, AlertLevel } from './types.js';

interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let storage: StorageBackend | null = null;

export function setStorageBackend(backend: StorageBackend): void {
  storage = backend;
}

function getStorage(): StorageBackend {
  if (storage) return storage;
  throw new Error('Storage backend not initialized. Call setStorageBackend first.');
}

export function saveScanResult(entry: ScanHistoryEntry): void {
  const key = `scan_history_${entry.contractAddress}`;
  const existing = getStorage().getItem(key);
  const history: ScanHistoryEntry[] = existing ? JSON.parse(existing) as ScanHistoryEntry[] : [];
  history.push(entry);
  const trimmed = history.slice(-50);
  getStorage().setItem(key, JSON.stringify(trimmed));
}

export function getScanHistory(contractAddress: string): ScanHistoryEntry[] {
  const key = `scan_history_${contractAddress}`;
  const data = getStorage().getItem(key);
  return data ? JSON.parse(data) as ScanHistoryEntry[] : [];
}

export function clearScanHistory(contractAddress: string): void {
  const key = `scan_history_${contractAddress}`;
  getStorage().setItem(key, JSON.stringify([]));
}