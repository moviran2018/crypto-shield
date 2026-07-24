import type { BotCommand, TelegramUpdate, SendMessageParams, BotConfig } from '../types.js';

export const subscribeCommand: BotCommand = {
  command: 'subscribe',
  description: 'Get subscription link for premium features',
  handler: async (update: TelegramUpdate, config: BotConfig): Promise<SendMessageParams | null> => {
    const message = update.message;
    if (!message?.chat?.id) return null;

    return {
      chat_id: message.chat.id,
      text: `🔒 *${config.brandName} Premium*\n\nUnlock all features:\n✅ Unlimited contract analyses\n✅ 3 source verification\n✅ Emergency exit calculator\n✅ Monitoring & alerts\n✅ Full history tracking\n\n👉 [Subscribe Now](${config.subscriptionLink})`,
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Subscribe Now', url: config.subscriptionLink }],
        ],
      },
    };
  },
};
