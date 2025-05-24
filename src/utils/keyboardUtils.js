import { monthNames } from '../config/constants.js';
import { userErrorMessages } from '../store/userState.js';

export const addNavigationRow = (keyboard, adjustedDate) => {
  const year = adjustedDate.getFullYear();
  const month = adjustedDate.getMonth();
  const prevDate = new Date(year, month - 1);
  const nextDate = new Date(year, month + 1);

  keyboard.row(
    { text: "◀", callback_data: `nav_month_${prevDate.getFullYear()}-${prevDate.getMonth()}` },
    { text: monthNames[month], callback_data: "#" },
    { text: "▶", callback_data: `nav_month_${nextDate.getFullYear()}-${nextDate.getMonth()}` }
  );
};

export const addWeekdaysRow = (keyboard) => {
  keyboard.row(...["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => ({ text: day, callback_data: "#" })));
};

export const clearErrorMessages = async (ctx) => {
  const userId = ctx.from.id;
  const messageIds = userErrorMessages.get(userId) || [];

  for (const messageId of messageIds) {
    try {
      await ctx.api.deleteMessage(ctx.chat.id, messageId);
    } catch (error) {
      console.log('Message already deleted or unavailable');
    }
  }

  userErrorMessages.set(userId, []);
};
export const safeEditMessageText = async (ctx, text, options = {}) => {
  try {
    await ctx.editMessageText(text, options);
  } catch (error) {
    if (!error.description || !error.description.includes('message is not modified')) {
      throw error;
    }
  }
};

export const safeEditMessageReplyMarkup = async (ctx, options = {}) => {
  try {
    await ctx.editMessageReplyMarkup(options);
  } catch (error) {
    if (!error.description || !error.description.includes('message is not modified')) {
      throw error;
    }
  }
};
