export const courts = {
  1: '31', 2: '32', 3: '33', 4: '34', 5: '35', 6: '36', 7: '11'
};

export const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export const TIME_SLOT_DURATION = 30;
export const MIN_BOOKING_DURATION = 60;
export const FETCH_TIMEOUT = 5000;

export const commands = {
  start: "Привет",
  calendar: "Календарь",
  notifications: "Уведомления",
  help: "Помощь",
};

export const weekdayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
export const weekdaysFull = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];

export const getCourtLink = (courtNum) => `<a href="https://booking.alexclub.ru/product/badmintonnyj-kort-${courtNum}/">Забронировать</a>`;

