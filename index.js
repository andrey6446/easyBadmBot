import { bot } from './src/config/botConfig.js';
import { setupCommandHandlers } from './src/handlers/commandHandlers.js';
import { setupCallbackHandlers } from './src/handlers/callbackHandlers.js';
import { setupMessageHandlers } from './src/handlers/messageHandlers.js';

setupCommandHandlers(bot);
setupCallbackHandlers(bot);
setupMessageHandlers(bot);

bot.start();
