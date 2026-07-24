import type { MonitoredContract, MonitoringResult, ScanHistoryEntry, AlertLevel } from './types.js';
import type { PreviousState, CurrentState } from './detector.js';

export interface ScannerDependencies {
  fetchContractData(contractAddress: string, chain: string): Promise<CurrentState>;
  getPreviousState(contractAddress: string): Promise<PreviousState | null>;
  detectChanges(prev: PreviousState, curr: CurrentState): ReturnType<typeof import('./detector.js').detectChanges>;
  getHighestAlertLevel(changes: ReturnType<typeof import('./detector.js').detectChanges>): AlertLevel;
  saveScanResult(entry: ScanHistoryEntry): void;
  sendAlert(channel: 'email' | 'telegram' | 'in_app', userId: string, title: string, message: string): Promise<boolean>;
}

export async function scanContract(
  contract: MonitoredContract,
  deps: ScannerDependencies
): Promise<MonitoringResult> {
  const currentState = await deps.fetchContractData(contract.contractAddress, contract.chain);
  const previousState = await deps.getPreviousState(contract.contractAddress);

  let changes: ReturnType<typeof import('./detector.js').detectChanges> = [];
  if (previousState) {
    changes = deps.detectChanges(previousState, currentState);
  }

  const alertLevel = deps.getHighestAlertLevel(changes);
  const alertTriggered = changes.length > 0;

  const result: MonitoringResult = {
    contractId: contract.id,
    contractAddress: contract.contractAddress,
    scanTime: Date.now(),
    trustScore: currentState.trustScore,
    buyTax: currentState.buyTax,
    sellTax: currentState.sellTax,
    isBlacklisted: currentState.isBlacklisted,
    ownerChanged: changes.some(c => c.type === 'OWNER_CHANGED'),
    alertTriggered,
    alertLevel,
    changesDetected: Object.fromEntries(
      changes.map(c => [c.type, { old: c.oldValue, new: c.newValue }])
    ),
  };

  const scanEntry: ScanHistoryEntry = {
    scanId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    contractAddress: contract.contractAddress,
    scanTime: result.scanTime,
    trustScore: result.trustScore,
    buyTax: result.buyTax,
    sellTax: result.sellTax,
    isBlacklisted: result.isBlacklisted,
    ownerChanged: result.ownerChanged,
    alertTriggered,
    alertLevel,
    changesDetected: changes,
  };

  deps.saveScanResult(scanEntry);

  if (alertTriggered) {
    const changeDescriptions = changes.map(c => c.description);
    await deps.sendAlert(
      'in_app',
      contract.userId,
      `Alert: ${alertLevel.toUpperCase()} - ${contract.contractAddress.slice(0, 10)}...`,
      changeDescriptions.join('\n')
    );
  }

  return result;
}