export { scanContract } from './scanner.js';
export { detectChanges, getHighestAlertLevel } from './detector.js';
export { saveScanResult, getScanHistory, clearScanHistory, setStorageBackend } from './history.js';
export { sendAlert, createAlertNotification, getAlertMessage, setNotificationSender } from './notifier.js';
export {
  executeScheduledScan,
  startScheduler,
  stopScheduler,
  shouldRunScan,
  registerContracts,
  addContract,
  removeContract,
  getSchedulerState,
} from './scheduler.js';
export type {
  MonitoredContract,
  MonitoringResult,
  UserAlertSettings,
  Notification,
  ChangeDetection,
  ScanHistoryEntry,
  AlertLevel,
  AlertChannel,
} from './types.js';