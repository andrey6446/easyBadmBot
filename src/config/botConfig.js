import { Bot } from 'grammy';
import { commands } from './constants.js';
import dotenv from 'dotenv';

dotenv.config();

export const bot = new Bot(process.env.BOT_API_KEY);

bot.api.setMyCommands(Object.entries(commands).map(([command, description]) => ({
  command,
  description
})));