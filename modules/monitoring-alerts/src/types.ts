export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

export type AlertChannel = 'email' | 'telegram' | 'in_app';

export interface MonitoredContract {
  id: string;
  userId: string;
  contractAddress: string;
  chain: 'bsc' | 'ethereum';
  lastScan: number;
  isActive: boolean;
  alertLevel: AlertLevel;
  createdAt: number;
}

export interface MonitoringResult {
  contractId: string;
  contractAddress: string;
  scanTime: number;
  trustScore: number;
  buyTax: number;
  sellTax: number;
  isBlacklisted: boolean;
  ownerChanged: boolean;
  alertTriggered: boolean;
  alertLevel: AlertLevel;
  changesDetected: Record<string, unknown>;
}

export interface UserAlertSettings {
  userId: string;
  emailAlerts: boolean;
  telegramAlerts: boolean;
  inAppAlerts: boolean;
  minAlertLevel: AlertLevel;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'alert' | 'info' | 'warning';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}

export interface ChangeDetection {
  type: 'TAX_INCREASE' | 'BLACKLIST_ACTIVATED' | 'OWNER_CHANGED' | 'LOGIC_CONTRACT_CHANGED';
  severity: AlertLevel;
  oldValue: string | number;
  newValue: string | number;
  description: string;
}

export interface ScanHistoryEntry {
  scanId: string;
  contractAddress: string;
  scanTime: number;
  trustScore: number;
  buyTax: number;
  sellTax: number;
  isBlacklisted: boolean;
  ownerChanged: boolean;
  alertTriggered: boolean;
  alertLevel: AlertLevel;
  changesDetected: ChangeDetection[];
}