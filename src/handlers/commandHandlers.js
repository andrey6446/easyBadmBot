import { InlineKeyboard } from 'grammy';
import { userCalendarState } from '../store/userState.js'

export const setupCommandHandlers = (bot) => {
  bot.command('start', (ctx) => {
    ctx.reply('Привет 👋 \nЯ бот-помощник по бадминтону в Алексеева!');
  });

  bot.command("calendar", async (ctx) => {
    const userId = ctx.from.id;
    userCalendarState.set(userId, {
      year: new Date().getFullYear(),
      month: new Date().getMonth()
    });

    const keyboard = new InlineKeyboard()
      .row({ text: "Любое время", callback_data: "time_any" })
      .row({ text: "Указать время", callback_data: "time_custom" });

    await ctx.reply(
      'Выберите удобное время для начала игры:\n\n' +
      'Нажмите "Любое время" или "Указать время" для ввода конкретного временного промежутка',
      { reply_markup: keyboard }
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply('Помощи не ждите 😭 \n [Андрей](https://t.me/this_object)', {
      parse_mode: 'MarkdownV2'
    });
  });

};