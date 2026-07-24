import type { BotCommand, TelegramUpdate, SendMessageParams, BotConfig } from '../types.js';

export const helpCommand: BotCommand = {
  command: 'help',
  description: 'Show available commands and help',
  handler: async (update: TelegramUpdate, config: BotConfig): Promise<SendMessageParams | null> => {
    const message = update.message;
    if (!message?.chat?.id) return null;

    return {
      chat_id: message.chat.id,
      text: `🛡️ *${config.brandName} - Crypto Security Bot*\n\n*Available Commands:*\n\n🔍 \`/check <address>\` - Analyze a contract\n💎 \`/subscribe\` - Get premium access\n❓ \`/help\` - Show this message\n\n*What we check:*\n• Buy/Sell taxes\n• Blacklist functions\n• Owner status\n• Hidden mint capabilities\n• Proxy detection\n\nPowered by 3 security sources for maximum accuracy\\.`,
      parse_mode: 'MarkdownV2',
    };
  },
};
