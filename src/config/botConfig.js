import { Bot } from 'grammy';
import { commands } from './constants.js';
import dotenv from 'dotenv';

dotenv.config();

const BOT_API_KEY = process.env.BOT_API_KEY;
if (!BOT_API_KEY) {
  console.error('Ошибка: BOT_API_KEY не найден. Убедитесь, что токен указан в файле .env');
  process.exit(1);
}

export const bot = new Bot(BOT_API_KEY);

bot.api.setMyCommands(Object.entries(commands).map(([command, description]) => ({
  command,
  description
})));