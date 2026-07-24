import type { ChangeDetection, AlertLevel } from './types.js';

export interface PreviousState {
  trustScore: number;
  buyTax: number;
  sellTax: number;
  isBlacklisted: boolean;
  ownerAddress: string | null;
  logicContractAddress: string | null;
}

export interface CurrentState {
  trustScore: number;
  buyTax: number;
  sellTax: number;
  isBlacklisted: boolean;
  ownerAddress: string | null;
  logicContractAddress: string | null;
}

export function detectChanges(
  previous: PreviousState,
  current: CurrentState
): ChangeDetection[] {
  const changes: ChangeDetection[] = [];

  if (current.sellTax > previous.sellTax * 1.2 && current.sellTax > previous.sellTax) {
    changes.push({
      type: 'TAX_INCREASE',
      severity: current.sellTax > previous.sellTax * 1.5 ? 'critical' : 'high',
      oldValue: previous.sellTax,
      newValue: current.sellTax,
      description: `Sell tax increased from ${previous.sellTax}% to ${current.sellTax}%`,
    });
  }

  if (current.buyTax > previous.buyTax * 1.2 && current.buyTax > previous.buyTax) {
    changes.push({
      type: 'TAX_INCREASE',
      severity: current.buyTax > previous.buyTax * 1.5 ? 'high' : 'medium',
      oldValue: previous.buyTax,
      newValue: current.buyTax,
      description: `Buy tax increased from ${previous.buyTax}% to ${current.buyTax}%`,
    });
  }

  if (current.isBlacklisted && !previous.isBlacklisted) {
    changes.push({
      type: 'BLACKLIST_ACTIVATED',
      severity: 'critical',
      oldValue: false,
      newValue: true,
      description: 'Blacklist functionality has been activated',
    });
  }

  if (current.ownerAddress !== previous.ownerAddress && previous.ownerAddress !== null) {
    changes.push({
      type: 'OWNER_CHANGED',
      severity: 'critical',
      oldValue: previous.ownerAddress ?? 'none',
      newValue: current.ownerAddress ?? 'none',
      description: `Contract owner changed from ${previous.ownerAddress ?? 'none'} to ${current.ownerAddress ?? 'none'}`,
    });
  }

  if (
    current.logicContractAddress !== previous.logicContractAddress &&
    previous.logicContractAddress !== null
  ) {
    changes.push({
      type: 'LOGIC_CONTRACT_CHANGED',
      severity: 'critical',
      oldValue: previous.logicContractAddress ?? 'none',
      newValue: current.logicContractAddress ?? 'none',
      description: `Logic contract changed from ${previous.logicContractAddress ?? 'none'} to ${current.logicContractAddress ?? 'none'}`,
    });
  }

  return changes;
}

export function getHighestAlertLevel(changes: ChangeDetection[]): AlertLevel {
  if (changes.length === 0) return 'low';

  const severityOrder: AlertLevel[] = ['low', 'medium', 'high', 'critical'];
  let highest: AlertLevel = 'low';

  for (const change of changes) {
    const currentIdx = severityOrder.indexOf(change.severity);
    const highestIdx = severityOrder.indexOf(highest);
    if (currentIdx > highestIdx) {
      highest = change.severity;
    }
  }

  return highest;
}