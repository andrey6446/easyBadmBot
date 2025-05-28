import { bot } from './src/config/botConfig.js';
import { setupCommandHandlers } from './src/handlers/commandHandlers.js';
import { setupCallbackHandlers } from './src/handlers/callbackHandlers.js';
import { setupMessageHandlers } from './src/handlers/messageHandlers.js';
import { connectDB } from './src/config/dbConfig.js';
import cron from 'node-cron';
import { checkAvailableCourts } from './src/services/notificationService.js';

connectDB();

setupCommandHandlers(bot);
setupCallbackHandlers(bot);
setupMessageHandlers(bot);

cron.schedule('*/1 * * * *', () => {
  checkAvailableCourts(bot);
});

bot.command('check_now', async (ctx) => {
  ctx.reply('Запускаем принудительную проверку доступности кортов...');
  await checkAvailableCourts(bot);
  ctx.reply('Проверка завершена. Проверьте логи сервера для деталей.');
});

bot.catch((err) => {
  console.error('Ошибка в боте:', err);
});


bot.start();

console.log('Бот запущен, выполняем первоначальную проверку доступности...');
checkAvailableCourts(bot).then(() => {
  console.log('Первоначальная проверка завершена');
}).catch(error => {
  console.error('Ошибка при выполнении первоначальной проверки:', error);
});