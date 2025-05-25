import { userAwaitingTimeInput, userTimePreferences, userCalendarState, userAwaitingNotificationTimeRange, userAwaitingNotificationWeekdays, userNotificationState } from '../store/userState.js';
import { generateCalendar } from '../services/calendarService.js';
import {
  validateTimeRange,
  validateWeekdays,
  generateWeekdaysKeyboard,
  createNotification,
  generateNotificationsKeyboard
} from '../services/notificationService.js';

export const setupMessageHandlers = (bot) => {
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;

    if (userAwaitingTimeInput.get(userId)) {
      const timeRegex = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/;
      const match = text.match(timeRegex);

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

      return;
    }

    if (userAwaitingNotificationTimeRange.get(userId)) {
      const validation = validateTimeRange(text);

      if (!validation.valid) {
        await ctx.reply(validation.message);
        return;
      }

      const state = userNotificationState.get(userId) || {};
      state.timeRange = validation.timeRange;
      userNotificationState.set(userId, state);

      userAwaitingNotificationTimeRange.set(userId, false);
      userAwaitingNotificationWeekdays.set(userId, true);

      const keyboard = generateWeekdaysKeyboard();

      await ctx.reply(
        'Выберите дни недели для уведомлений.\n' +
        'Нажмите на день, чтобы добавить/удалить его из списка.\n' +
        'После выбора нажмите "Готово".',
        { reply_markup: keyboard }
      );

      return;
    }

    if (userAwaitingNotificationWeekdays.get(userId)) {
      const validation = validateWeekdays(text);

      if (!validation.valid) {
        await ctx.reply(validation.message);
        return;
      }

      // Сохраняем дни недели
      const state = userNotificationState.get(userId) || {};
      state.weekdays = validation.weekdays;
      userNotificationState.set(userId, state);

      try {
        const notification = await createNotification(
          userId,
          state.timeRange,
          state.weekdays,
          {
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
            username: ctx.from.username
          }
        );

        await ctx.reply('✅ Уведомление успешно создано!');

        const keyboard = await generateNotificationsKeyboard(userId);
        await ctx.reply(
          'Ваши уведомления о свободных кортах:',
          { reply_markup: keyboard }
        );
      } catch (error) {
        await ctx.reply(
          'Произошла ошибка при создании уведомления.\n' +
          'Пожалуйста, попробуйте снова позже.'
        );
      }

      userNotificationState.delete(userId);
      userAwaitingNotificationTimeRange.delete(userId);
      userAwaitingNotificationWeekdays.delete(userId);

      return;
    }

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