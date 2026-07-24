import type { BotConfig, TelegramUpdate, SendMessageParams, BotCommand } from './types.js';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export async function sendMessage(
  token: string,
  params: SendMessageParams
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function setWebhook(
  token: string,
  url: string
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function setCommands(
  token: string,
  commands: Array<{ command: string; description: string }>
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function handleUpdate(
  update: TelegramUpdate,
  config: BotConfig,
  commands: BotCommand[]
): Promise<SendMessageParams | null> {
  const message = update.message;
  if (!message?.text) return null;

  const text = message.text;
  let matchedCommand: BotCommand | null = null;

  for (const cmd of commands) {
    if (text.startsWith(cmd.command) || text.startsWith(`/${cmd.command}`)) {
      matchedCommand = cmd;
      break;
    }
  }

  if (matchedCommand) {
    return matchedCommand.handler(update, config);
  }

  return null;
}
