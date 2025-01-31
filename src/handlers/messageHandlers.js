import { userAwaitingTimeInput, userTimePreferences, userCalendarState } from '../store/userState.js';
import { generateCalendar } from '../services/calendarService.js';

export const setupMessageHandlers = (bot) => {
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id;

    if (!userAwaitingTimeInput.get(userId)) return;

    const timeInput = ctx.message.text;
    const timeRegex = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/;
    const match = timeInput.match(timeRegex);

    if (!match) {
      await ctx.reply(
        '❌ Неверный формат времени. Пожалуйста, используйте формат ЧЧ:ММ-ЧЧ:ММ\n' +
        'Например: 10:00-21:00'
      );
      return;
    }

    const [_, startHour, startMin, endHour, endMin] = match;
    const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
    const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);

    if (startMinutes >= endMinutes || startMinutes < 7 * 60 || endMinutes > 23 * 60) {
      await ctx.reply(
        '❌ Некорректное время. Убедитесь что:\n' +
        '• Время начала раньше времени окончания\n' +
        '• Время в пределах 07:00-23:00'
      );
      return;
    }

    userTimePreferences.set(userId, { start: startMinutes, end: endMinutes });
    userAwaitingTimeInput.set(userId, false);

    const state = {
      year: new Date().getFullYear(),
      month: new Date().getMonth()
    };
    userCalendarState.set(userId, state);

    const keyboard = await generateCalendar(state.year, state.month, userId);
    await ctx.reply('Выберите дату:',
      { parse_mode: "MarkdownV2", reply_markup: keyboard });
  });
};