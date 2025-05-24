import {
  handleTimeSelection, handleMonthNavigation, handleDaySelection,
  handleCourtSelection, handleSelectAllCourts, handleMenuBack,
  handleBackToCourts, handleBackToTime
} from '../services/handlersService.js';
import { handleConfirmDelete } from '../services/notificationHandlersService.js';
import { handleCancelDelete } from '../services/notificationHandlersService.js';

import {
  handleAddNotification, handleNotificationSelection,
  handleWeekdaySelection, handleWeekdaysDone
} from '../services/notificationHandlersService.js';

export const setupCallbackHandlers = (bot) => {
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    try {
      if (data.startsWith("time_")) {
        await handleTimeSelection(data, ctx);
      } else if (data.startsWith("nav_month_")) {
        await handleMonthNavigation(data, ctx);
      } else if (data.startsWith("select_day_")) {
        await handleDaySelection(data, ctx);
      } else if (data.startsWith("select_court_")) {
        await handleCourtSelection(data, ctx);
      } else if (data.startsWith("select_all_")) {
        await handleSelectAllCourts(data, ctx);
      } else if (data === "menu_back") {
        await handleMenuBack(ctx);
      } else if (data.startsWith("back_to_courts_")) {
        await handleBackToCourts(data, ctx);
      } else if (data.startsWith("back_to_time")) {
        await handleBackToTime(ctx);
      } else if (data === "add_notification") {
        await handleAddNotification(ctx);
      } else if (data.startsWith("notification_")) {
        await handleNotificationSelection(data, ctx);
      } else if (data.startsWith("weekday_")) {
        await handleWeekdaySelection(data, ctx);
      } else if (data === "weekdays_done") {
        await handleWeekdaysDone(ctx);
      } else if (data.startsWith("confirm_delete_")) {
        await handleConfirmDelete(data, ctx);
      } else if (data === "cancel_delete") {
        await handleCancelDelete(ctx);
      } else {
        await ctx.answerCallbackQuery("⚠️ Неизвестная команда");
        console.warn("Необработанный callback:", data);
      }
    } catch (error) {
      if (error.description && error.description.includes('message is not modified')) {
        await ctx.answerCallbackQuery();
      } else {
        console.error("Ошибка обработки callback:", error);
        await ctx.answerCallbackQuery("❌ Произошла ошибка при обработке запроса");
      }
    }
  });
};