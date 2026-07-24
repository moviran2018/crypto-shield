import type { MonitoredContract, MonitoringResult } from './types.js';
import { scanContract } from './scanner.js';
import type { ScannerDependencies } from './scanner.js';

const SCAN_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface SchedulerState {
  isRunning: boolean;
  lastScan: number;
  nextScan: number;
  contracts: MonitoredContract[];
}

let schedulerState: SchedulerState = {
  isRunning: false,
  lastScan: 0,
  nextScan: 0,
  contracts: [],
};

export function getSchedulerState(): SchedulerState {
  return { ...schedulerState };
}

export function registerContracts(contracts: MonitoredContract[]): void {
  schedulerState.contracts = contracts;
}

export function addContract(contract: MonitoredContract): void {
  schedulerState.contracts.push(contract);
}

export function removeContract(contractId: string): void {
  schedulerState.contracts = schedulerState.contracts.filter(c => c.id !== contractId);
}

export async function executeScheduledScan(
  deps: ScannerDependencies
): Promise<MonitoringResult[]> {
  const results: MonitoringResult[] = [];

  for (const contract of schedulerState.contracts) {
    if (!contract.isActive) continue;
    try {
      const result = await scanContract(contract, deps);
      results.push(result);
    } catch (error) {
      console.error(`Failed to scan contract ${contract.contractAddress}:`, error);
    }
  }

  schedulerState.lastScan = Date.now();
  schedulerState.nextScan = schedulerState.lastScan + SCAN_INTERVAL_MS;

  return results;
}

export function shouldRunScan(): boolean {
  if (!schedulerState.isRunning) return false;
  return Date.now() >= schedulerState.nextScan;
}

export function startScheduler(): void {
  schedulerState.isRunning = true;
  schedulerState.lastScan = 0;
  schedulerState.nextScan = Date.now();
}

export function stopScheduler(): void {
  schedulerState.isRunning = false;
}