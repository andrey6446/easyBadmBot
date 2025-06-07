import { InlineKeyboard } from 'grammy';
import { courts, FETCH_TIMEOUT } from '../config/constants.js';
import { allCourtsData, userTimePreferences } from '../store/userState.js';
import { timeStringToMinutes, mergeConsecutiveSlots, filterSlotsByTimePreference } from './timeService.js';

const courtDataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

export const fetchData = async (courtId, year, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const response = await fetch('https://booking.alexclub.ru/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({
          action: 'dopbsp_calendar_schedule_get',
          dopbsp_frontend_ajax_request: 'true',
          id: courtId,
          year: year,
          firstYear: 'false'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      const isLastAttempt = attempt === retries - 1;

      if (error.name === 'AbortError') {
        console.error(`Таймаут запроса для корта ${courtId}${isLastAttempt ? '' : ', повторная попытка...'}`);
      } else {
        console.error(`Ошибка при запросе данных для корта ${courtId}: ${error.message}${isLastAttempt ? '' : ', повторная попытка...'}`);
      }

      if (isLastAttempt) {
        return null;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

export const getAllCourtsData = async (year) => {
  const cacheKey = `courts_${year}`;
  const cached = courtDataCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const fetchPromises = Object.entries(courts).map(async ([courtNum, courtId]) => {
      const courtData = await fetchData(courtId, year);
      return [courtNum, processCourtData(courtData || {})];
    });

    const results = await Promise.all(fetchPromises);
    const data = Object.fromEntries(results);

    courtDataCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    Object.assign(allCourtsData, data);
    return data;
  } catch (error) {
    console.error('Error fetching courts data:', error);
    return cached?.data || allCourtsData;
  }
};

export const generateCourtsKeyboard = async (selectedDate, ctx) => {
  const keyboard = new InlineKeyboard();
  const userId = ctx.from.id;

  Object.keys(courts).forEach(courtNum => {
    const slots = allCourtsData[courtNum]?.[selectedDate] || [];
    const filteredSlots = filterSlotsByTimePreference(slots, userTimePreferences.get(userId));
    const hasAvailableSlots = filteredSlots.length > 0;

    keyboard.row({
      text: `Корт ${courtNum} ${hasAvailableSlots ? '🟢' : '🔴'}`,
      callback_data: `select_court_${courtNum}_${selectedDate}`
    });
  });

  const hasAnySlots = Object.keys(courts).some(courtNum => {
    const slots = allCourtsData[courtNum]?.[selectedDate] || [];
    const filteredSlots = filterSlotsByTimePreference(slots, userTimePreferences.get(userId));
    return filteredSlots.length > 0;
  });

  keyboard
    .row({
      text: `Все корты ${hasAnySlots ? '🟢' : '🔴'}`,
      callback_data: `select_all_${selectedDate}`
    })
    .row({
      text: '« Назад к календарю',
      callback_data: 'menu_back'
    });

  return keyboard;
};

function processCourtData(rawData) {
  return Object.entries(rawData).reduce((result, [date, dateData]) => {
    const data = JSON.parse(dateData);
    const availableSlots = Object.entries(data.hours)
      .filter(([_, info]) => info.status === 'available')
      .map(([time]) => timeStringToMinutes(time))
      .sort((a, b) => a - b);

    result[date] = mergeConsecutiveSlots(availableSlots);
    return result;
  }, {});
}