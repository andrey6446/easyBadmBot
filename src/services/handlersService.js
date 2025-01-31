import { InlineKeyboard } from 'grammy';
import { userTimePreferences, userAwaitingTimeInput, userCalendarState, userErrorMessages, allCourtsData } from '../store/userState.js'
import { generateCalendar } from './calendarService.js';
import { generateCourtsKeyboard } from './courtService.js';
import { filterSlotsByTimePreference } from './timeService.js';
import { clearErrorMessages } from '../utils/keyboardUtils.js'
import { courts } from '../config/constants.js';

async function handleTimeSelection(data, ctx) {
  const userId = ctx.from.id;

  if (data === "time_any") {
    userTimePreferences.set(userId, null);
    userAwaitingTimeInput.set(userId, false);

    const state = {
      year: new Date().getFullYear(),
      month: new Date().getMonth()
    };
    userCalendarState.set(userId, state);

    const keyboard = await generateCalendar(state.year, state.month, userId);
    await ctx.editMessageText('Выберите дату:',
      { parse_mode: "MarkdownV2", reply_markup: keyboard });
  } else if (data === "time_custom") {
    userAwaitingTimeInput.set(userId, true);
    await ctx.editMessageText(
      'Введите желаемый временной промежуток в формате ЧЧ:ММ-ЧЧ:ММ\n' +
      'Например: 10:00-21:00\n\n' +
      'Доступное время: с 07:00 до 23:00'
    );
  }

  await ctx.answerCallbackQuery();
}

async function handleMonthNavigation(data, ctx) {
  const match = data.match(/nav_month_(\d+)-(\d+)/);
  const userId = ctx.from.id;

  if (!match) {
    await ctx.answerCallbackQuery("⚠️ Ошибка формата навигации");
    return;
  }

  const [_, year, month] = match;
  userCalendarState.set(userId, {
    year: parseInt(year),
    month: parseInt(month)
  });
  const keyboard = await generateCalendar(parseInt(year), parseInt(month), userId);

  await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
  await ctx.answerCallbackQuery();
}

async function handleDaySelection(data, ctx) {
  const parts = data.split('_');
  const selectedDate = parts.slice(2).join('-');
  const keyboard = await generateCourtsKeyboard(selectedDate, ctx);

  await ctx.editMessageText(
    `🏸 Выберите корт на ${selectedDate}:`,
    { reply_markup: keyboard }
  );
  await ctx.answerCallbackQuery();
}

async function handleCourtSelection(data, ctx) {
  const userId = ctx.from.id;
  const parts = data.split('_');
  const courtNum = parts[2];
  const date = parts.slice(3).join('-');
  const timePreference = userTimePreferences.get(ctx.from.id);

  let slots = allCourtsData[courtNum]?.[date] || [];
  slots = filterSlotsByTimePreference(slots, timePreference);

  if (!slots.length) {
    const errorMessage = await ctx.reply(`⚠️ На корте ${courtNum} (${date}) нет подходящих слотов в выбранное время`);
    userErrorMessages.set(userId, [...(userErrorMessages.get(userId) || []), errorMessage.message_id]);
    await ctx.answerCallbackQuery();
    return;
  }

  await clearErrorMessages(ctx);

  const backKeyboard = new InlineKeyboard().text('« Назад к кортам', `back_to_courts_${date}`);

  await ctx.editMessageText(
    `🗓 Свободные слоты на корте ${courtNum} (${date}):\n${slots.join('\n')}`,
    { reply_markup: backKeyboard }
  );
  await ctx.answerCallbackQuery();
}

async function handleSelectAllCourts(data, ctx) {
  const date = data.split('_')[2];
  const timePreference = userTimePreferences.get(ctx.from.id);
  let message = `📅 Все свободные слоты на ${date}:\n`;

  Object.keys(courts).forEach(courtNum => {
    let slots = allCourtsData[courtNum]?.[date] || [];
    slots = filterSlotsByTimePreference(slots, timePreference);

    if (slots.length > 0) {
      message += `\n🏸 Корт ${courtNum}:\n${slots.join('\n')}\n`;
    }
  });

  const backKeyboard = new InlineKeyboard().text('« Назад к кортам', `back_to_courts_${date}`);

  await ctx.editMessageText(message, { reply_markup: backKeyboard });
  await ctx.answerCallbackQuery();
}

async function handleMenuBack(ctx) {
  await clearErrorMessages(ctx);
  const userId = ctx.from.id;
  const state = userCalendarState.get(userId) || {
    year: new Date().getFullYear(),
    month: new Date().getMonth()
  };
  const keyboard = await generateCalendar(state.year, state.month, userId);

  await ctx.editMessageText("📆 Выберите дату для записи:",
    { parse_mode: "MarkdownV2", reply_markup: keyboard });
  await ctx.answerCallbackQuery();
}

async function handleBackToCourts(data, ctx) {
  await clearErrorMessages(ctx);

  const selectedDate = data.split('_')[3];
  const keyboard = await generateCourtsKeyboard(selectedDate, ctx);

  await ctx.editMessageText(`🏸 Выберите корт на ${selectedDate}:`, { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
}

async function handleBackToTime(ctx) {
  const keyboard = new InlineKeyboard()
    .row({ text: "Любое время", callback_data: "time_any" })
    .row({ text: "Указать время", callback_data: "time_custom" });

  await ctx.editMessageText(
    'Выберите удобное время для начала игры:\n\n' +
    'Нажмите "Любое время" или "Указать время" для ввода конкретного временного промежутка (в который вы бы хотели начать игру)',
    { reply_markup: keyboard }
  );
  await ctx.answerCallbackQuery();
}

export { handleTimeSelection, handleMonthNavigation, handleDaySelection, handleCourtSelection, handleSelectAllCourts, handleMenuBack, handleBackToCourts, handleBackToTime };