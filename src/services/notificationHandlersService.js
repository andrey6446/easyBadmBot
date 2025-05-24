import { InlineKeyboard } from 'grammy';
import {
  userNotificationState,
  userAwaitingNotificationTimeRange,
  userAwaitingNotificationWeekdays
} from '../store/userState.js';
import {
  generateNotificationsKeyboard,
  deleteNotification,
  generateWeekdaysKeyboard,
  createNotification
} from './notificationService.js';

import {
  safeEditMessageText,
} from '../utils/keyboardUtils.js';

export async function handleAddNotification(ctx) {
  const userId = ctx.from.id;

  userAwaitingNotificationTimeRange.set(userId, true);
  userNotificationState.set(userId, { weekdays: [] });

  await safeEditMessageText(ctx,
    'Укажите желаемый временной промежуток для уведомлений в формате ЧЧ:ММ-ЧЧ:ММ\n' +
    'Например: 10:00-21:00\n\n' +
    'Если в указанное время освободится хотя бы 1 час на любом корте, вы получите уведомление'
  );
  await ctx.answerCallbackQuery();
}

export async function handleNotificationSelection(data, ctx) {
  const notificationId = data.split('_')[1];

  const keyboard = new InlineKeyboard()
    .row({ text: "✅ Да, удалить", callback_data: `confirm_delete_${notificationId}` })
    .row({ text: "❌ Нет, оставить", callback_data: "cancel_delete" });

  await safeEditMessageText(ctx,
    'Вы уверены, что хотите удалить это уведомление?',
    { reply_markup: keyboard }
  );
  await ctx.answerCallbackQuery();
}

export async function handleConfirmDelete(data, ctx) {
  const notificationId = data.split('_')[2];
  const success = await deleteNotification(notificationId);

  if (success) {
    const keyboard = await generateNotificationsKeyboard(ctx.from.id);
    await safeEditMessageText(ctx,
      'Уведомление успешно удалено!\n\n' +
      'Ваши уведомления о свободных кортах:',
      { reply_markup: keyboard }
    );
  } else {
    await safeEditMessageText(ctx,
      'Произошла ошибка при удалении уведомления.\n' +
      'Пожалуйста, попробуйте снова позже.'
    );
  }
  await ctx.answerCallbackQuery();
}

export async function handleCancelDelete(ctx) {
  const keyboard = await generateNotificationsKeyboard(ctx.from.id);
  await safeEditMessageText(ctx,
    'Ваши уведомления о свободных кортах:',
    { reply_markup: keyboard }
  );
  await ctx.answerCallbackQuery();
}

export async function handleWeekdaySelection(data, ctx) {
  const userId = ctx.from.id;
  const weekdayNum = parseInt(data.split('_')[1]);
  const state = userNotificationState.get(userId) || { weekdays: [] };

  if (state.weekdays.includes(weekdayNum)) {
    state.weekdays = state.weekdays.filter(day => day !== weekdayNum);
  } else {
    state.weekdays.push(weekdayNum);
  }

  userNotificationState.set(userId, state);

  const keyboard = generateWeekdaysKeyboard(state.weekdays);

  await safeEditMessageText(ctx,
    'Выберите дни недели для уведомлений.\n' +
    'Нажмите на день, чтобы добавить/удалить его из списка.\n' +
    'После выбора нажмите "Готово".',
    { reply_markup: keyboard }
  );
  await ctx.answerCallbackQuery();
}

export async function handleWeekdaysDone(ctx) {
  const userId = ctx.from.id;
  const state = userNotificationState.get(userId);

  if (!state || !state.weekdays || state.weekdays.length === 0) {
    await ctx.answerCallbackQuery("⚠️ Выберите хотя бы один день недели");
    return;
  }

  try {
    await createNotification(userId, state.timeRange, state.weekdays);

    const keyboard = await generateNotificationsKeyboard(userId);
    await safeEditMessageText(ctx,
      'Уведомление успешно создано!\n\n' +
      'Ваши уведомления о свободных кортах:',
      { reply_markup: keyboard }
    );
  } catch (error) {
    await safeEditMessageText(ctx,
      'Произошла ошибка при создании уведомления.\n' +
      'Пожалуйста, попробуйте снова позже.'
    );
  }

  userNotificationState.delete(userId);
  userAwaitingNotificationTimeRange.delete(userId);
  userAwaitingNotificationWeekdays.delete(userId);

  await ctx.answerCallbackQuery();
}