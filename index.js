import { bot } from './src/config/botConfig.js';
import { setupCommandHandlers } from './src/handlers/commandHandlers.js';
import { setupCallbackHandlers } from './src/handlers/callbackHandlers.js';
import { setupMessageHandlers } from './src/handlers/messageHandlers.js';
import { connectDB } from './src/config/dbConfig.js';

connectDB();

setupCommandHandlers(bot);
setupCallbackHandlers(bot);
setupMessageHandlers(bot);

bot.catch((err) => {
  console.error('Ошибка в боте:', err);
});

bot.start();
