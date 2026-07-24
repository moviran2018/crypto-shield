export interface BotConfig {
  token: string;
  botName: string;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  welcomeMessage: string;
  supportLink: string;
  subscriptionLink: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
  entities?: TelegramMessageEntity[];
  from?: TelegramUser;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessageEntity {
  type: 'bot_command' | 'text_mention' | 'mention' | 'hashtag';
  offset: number;
  length: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface BotCommand {
  command: string;
  description: string;
  handler: (update: TelegramUpdate, config: BotConfig) => Promise<SendMessageParams | null>;
}

export interface SendMessageParams {
  chat_id: number;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_markup?: InlineKeyboardMarkup;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}
