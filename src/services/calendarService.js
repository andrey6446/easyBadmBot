import { InlineKeyboard } from 'grammy';
import { getAllCourtsData } from './courtService.js';
import { addNavigationRow } from '../utils/keyboardUtils.js'
import { userTimePreferences } from '../store/userState.js';
import { timeStringToMinutes } from './timeService.js';
import { addWeekdaysRow } from '../utils/keyboardUtils.js';


export const generateCalendar = async (year, month, userId) => {
  const adjustedDate = new Date(year, month, 1);
  const availability = await getAllCourtsData(year);
  const calendarData = getCalendarMatrix(adjustedDate, availability, userId);

  const keyboard = new InlineKeyboard();
  addNavigationRow(keyboard, adjustedDate);
  addWeekdaysRow(keyboard);
  calendarData.weeks.forEach(week => keyboard.row(...week));

  keyboard.row({ text: "« Назад к выбору времени", callback_data: "back_to_time" });

  return keyboard;
};

export const getCalendarMatrix = (adjustedDate, availability, userId) => {
  const year = adjustedDate.getFullYear();
  const month = adjustedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  const timePreference = userTimePreferences.get(userId);

  const weeks = [];
  let week = Array(startDay).fill({ text: " ", callback_data: "#" });

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const hasAnySlots = Object.values(availability).some(court => {
      const slots = court[dateStr] || [];
      if (!slots.length) return false;

      if (!timePreference) return true;

      return slots.some(slot => {
        const [startTime] = slot.split('-');
        const slotMinutes = timeStringToMinutes(startTime);
        return slotMinutes >= timePreference.start && slotMinutes <= timePreference.end;
      });
    });

    week.push({
      text: `${String(day).padStart(2, '0')}${hasAnySlots ? '🟢' : '🔴'}`,
      callback_data: `select_day_${dateStr}`
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    weeks.push([...week, ...Array(7 - week.length).fill({ text: " ", callback_data: "#" })]);
  }

  return { weeks };
};

