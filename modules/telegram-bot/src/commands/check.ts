import type { BotCommand, TelegramUpdate, SendMessageParams, BotConfig } from '../types.js';

export const checkCommand: BotCommand = {
  command: 'check',
  description: 'Analyze a contract address for risks',
  handler: async (update: TelegramUpdate, config: BotConfig): Promise<SendMessageParams | null> => {
    const message = update.message;
    if (!message?.chat?.id) return null;

    const args = message.text?.replace('/check', '').trim() ?? '';

    if (!args || !/^0x[a-fA-F0-9]{40}$/.test(args)) {
      return {
        chat_id: message.chat.id,
        text: `⚠️ *Invalid Address*\n\nPlease provide a valid contract address.\n\nExample: \`/check 0x1234567890abcdef1234567890abcdef12345678\``,
        parse_mode: 'MarkdownV2',
      };
    }

    return {
      chat_id: message.chat.id,
      text: `🔍 *Analyzing Contract*\n\nAddress: \`${args}\`\n\n⏳ Analyzing from 3 sources\\.\\.\\.\n\nPlease wait, this may take a few seconds\\.\\.\\.`,
      parse_mode: 'MarkdownV2',
    };
  },
};
