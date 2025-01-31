import {
  handleTimeSelection, handleMonthNavigation, handleDaySelection,
  handleCourtSelection, handleSelectAllCourts, handleMenuBack,
  handleBackToCourts, handleBackToTime
} from '../services/handlersService.js';

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
      } else {
        await ctx.answerCallbackQuery("⚠️ Неизвестная команда");
        console.warn("Необработанный callback:", data);
      }
    } catch (error) {
      console.error("Ошибка обработки callback:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка при обработке запроса");
    }
  });
};