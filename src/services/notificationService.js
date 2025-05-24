import { InlineKeyboard } from 'grammy';
import { Notification } from '../models/notificationModel.js';
import { User } from '../models/userModel.js';
import { getAllCourtsData } from './courtService.js';
import { timeStringToMinutes } from './timeService.js';
import crypto from 'crypto';
import { getCourtLink, weekdayNames, weekdaysFull } from '../config/constants.js';



export const getUserNotifications = async (telegramId) => {
  try {
    return await Notification.find({ telegramId });
  } catch (error) {
    console.error('Ошибка при получении уведомлений:', error);
    return [];
  }
};

export const createNotification = async (telegramId, timeRange, weekdays) => {
  try {
    const user = await User.findOne({ telegramId });

    if (!user) {
      const newUser = new User({
        telegramId,
        chatId: telegramId,
        createdAt: new Date()
      });
      await newUser.save();
    }

    const notification = new Notification({
      userId: user?._id,
      telegramId,
      timeRange,
      weekdays,
      isActive: true,
      createdAt: new Date()
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Ошибка при создании уведомления:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await Notification.findByIdAndDelete(notificationId);
    return true;
  } catch (error) {
    console.error('Ошибка при удалении уведомления:', error);
    return false;
  }
};

export const generateNotificationsKeyboard = async (telegramId) => {
  const notifications = await getUserNotifications(telegramId);
  const keyboard = new InlineKeyboard();

  if (notifications.length === 0) {
    return keyboard.row({ text: "Добавить уведомление", callback_data: "add_notification" });
  }

  notifications.forEach((notification, index) => {
    const weekdayText = notification.weekdays.map(day => weekdayNames[day]).join(', ');
    const timeText = `${notification.timeRange.start}-${notification.timeRange.end}`;

    keyboard.row({
      text: `${index + 1}. ${timeText} (${weekdayText})`,
      callback_data: `notification_${notification._id}`
    });
  });

  keyboard.row({ text: "Добавить уведомление", callback_data: "add_notification" });

  return keyboard;
};

export const formatWeekdaysList = (weekdays) => {
  return weekdays.map(day => weekdaysFull[day]).join(', ');
};

export const validateTimeRange = (timeInput) => {
  const timeRegex = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
  const match = timeInput.match(timeRegex);

  if (!match) {
    return { valid: false, message: 'Неверный формат времени. Используйте формат ЧЧ:ММ-ЧЧ:ММ, например: 10:00-21:00' };
  }

  const [_, startHour, startMin, endHour, endMin] = match;
  const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
  const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);

  if (startMinutes >= endMinutes) {
    return {
      valid: false,
      message: 'Время начала должно быть раньше времени окончания'
    };
  }

  if (startMinutes < 7 * 60 || endMinutes > 23 * 60) {
    return {
      valid: false,
      message: 'Время должно быть в пределах 07:00-23:00'
    };
  }

  return {
    valid: true,
    timeRange: {
      start: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
      end: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
    }
  };
};

export const validateWeekdays = (weekdaysInput) => {
  const weekdayMap = {
    'ВС': 0, 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6
  };

  const days = weekdaysInput.toUpperCase().split(/[,\s]+/).filter(Boolean);
  const validDays = days.filter(day => weekdayMap[day] !== undefined);

  if (validDays.length === 0) {
    return {
      valid: false,
      message: 'Не указан ни один день недели. Используйте сокращения: ПН, ВТ, СР, ЧТ, ПТ, СБ, ВС'
    };
  }

  return {
    valid: true,
    weekdays: validDays.map(day => weekdayMap[day])
  };
};

export const generateWeekdaysKeyboard = () => {
  const keyboard = new InlineKeyboard();

  keyboard.row(
    { text: "ПН", callback_data: "weekday_1" },
    { text: "ВТ", callback_data: "weekday_2" },
    { text: "СР", callback_data: "weekday_3" }
  ).row(
    { text: "ЧТ", callback_data: "weekday_4" },
    { text: "ПТ", callback_data: "weekday_5" },
    { text: "СБ", callback_data: "weekday_6" }
  ).row(
    { text: "ВС", callback_data: "weekday_0" }
  ).row(
    { text: "✅ Готово", callback_data: "weekdays_done" }
  );

  return keyboard;
};

function getMonthName(monthIndex) {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  return months[monthIndex];
}

export const checkAvailableCourts = async (bot) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    const courtsData = await getAllCourtsData(year);
    const notifications = await Notification.find();

    for (const notification of notifications) {
      const { timeRange, weekdays } = notification;

      const weekdaysNumbers = weekdays.map(day => Number(day));
      const availableSlots = {};

      const allDates = new Set();

      Object.values(courtsData).forEach(courtData => {
        Object.keys(courtData).forEach(date => allDates.add(date));
      });

      for (const dateStr of allDates) {
        const [yearStr, monthStr, dayStr] = dateStr.split('-').map(Number);
        const checkDate = new Date(yearStr, monthStr - 1, dayStr);

        if (checkDate < currentDate) {
          continue;
        }

        const checkDayOfWeek = checkDate.getDay();

        if (!weekdaysNumbers.includes(checkDayOfWeek)) {
          continue;
        }

        const startMinutes = timeStringToMinutes(timeRange.start);
        const endMinutes = timeStringToMinutes(timeRange.end);

        for (const [courtNum, courtData] of Object.entries(courtsData)) {
          const slots = courtData[dateStr] || [];

          if (slots.length === 0) {
            continue;
          }

          const filteredSlots = slots.filter(slot => {
            const [slotStart] = slot.split('-');
            const slotStartMinutes = timeStringToMinutes(slotStart);
            return slotStartMinutes >= startMinutes && slotStartMinutes <= endMinutes;
          });

          const hourSlots = filteredSlots.filter(slot => {
            const [start, end] = slot.split('-').map(timeStringToMinutes);
            return (end - start) >= 60;
          });

          if (hourSlots.length > 0) {
            if (!availableSlots[dateStr]) {
              availableSlots[dateStr] = {};
            }
            availableSlots[dateStr][courtNum] = hourSlots;
          }
        }
      }

      const prevSlotsData = notification.lastSentData?.slotsData || {};

      const changedDates = [];
      for (const dateStr of Object.keys(availableSlots)) {
        const currentDateSlots = JSON.stringify(availableSlots[dateStr]);
        const prevDateSlots = prevSlotsData[dateStr] ? prevSlotsData[dateStr] : null;

        if (!prevDateSlots || currentDateSlots !== prevDateSlots) {
          changedDates.push(dateStr);
        }
      }

      if (changedDates.length > 0) {
        const user = await User.findById(notification.userId);

        if (!user) {
          continue;
        }

        const userName = user.firstName + ' ' + user.lastName || 'пользователь';

        try {
          await bot.api.sendMessage(
            user.chatId,
            `Привет, ${userName}! Найдены изменения в расписании кортов согласно вашим предпочтениям:`
          );

          const sortedDates = changedDates.sort();

          const newSlotsData = {};

          for (const dateStr of sortedDates) {
            newSlotsData[dateStr] = JSON.stringify(availableSlots[dateStr]);

            const dateParts = dateStr.split('-');
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const weekdayName = weekdaysFull[date.getDay()];
            const dateFormatted = `${date.getDate()} ${getMonthName(date.getMonth())}`;

            let dateMessage = `🗓 ${weekdayName}, ${dateFormatted} (изменения в расписании):\n`;

            for (const [courtNum, slots] of Object.entries(availableSlots[dateStr])) {
              dateMessage += `\n🏸 Корт ${courtNum} ${getCourtLink(courtNum)}:\n${slots.join('\n')}\n`;
            }

            await bot.api.sendMessage(user.chatId, dateMessage, { parse_mode: "HTML" });
          }

          const updatedSlotsData = { ...prevSlotsData, ...newSlotsData };

          await Notification.updateOne(
            { _id: notification._id },
            {
              $set: {
                lastSentData: {
                  timestamp: new Date(),
                  slotsData: updatedSlotsData,
                  slotsHash: crypto.createHash('md5').update(JSON.stringify(updatedSlotsData)).digest('hex')
                }
              }
            }
          );
        } catch (error) {
          console.error(`Ошибка при отправке уведомления: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке доступности кортов:', error);
  }
};
