import type { Notification, AlertLevel, AlertChannel } from './types.js';

interface NotificationSender {
  send(channel: AlertChannel, userId: string, title: string, message: string): Promise<boolean>;
}

let sender: NotificationSender | null = null;

export function setNotificationSender(s: NotificationSender): void {
  sender = s;
}

export async function sendAlert(
  channel: AlertChannel,
  userId: string,
  title: string,
  message: string
): Promise<boolean> {
  if (!sender) {
    console.warn('No notification sender configured');
    return false;
  }
  try {
    return await sender.send(channel, userId, title, message);
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

export function createAlertNotification(
  type: Notification['type'],
  title: string,
  message: string
): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
  return { type, title, message, isRead: false };
}

export function getAlertMessage(level: AlertLevel, changes: string[]): string {
  const emoji = level === 'critical' ? '🚨' : level === 'high' ? '⚠️' : level === 'medium' ? '⚡' : 'ℹ️';
  return `${emoji} [${level.toUpperCase()}] Changes detected:\n${changes.join('\n')}`;
}