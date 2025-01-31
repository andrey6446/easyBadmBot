import { TIME_SLOT_DURATION, MIN_BOOKING_DURATION } from '../config/constants.js';

export const filterSlotsByTimePreference = (slots, timePreference) => {
  if (!timePreference) return slots;

  return slots.filter(slot => {
    const [startStr, _] = slot.split('-');
    const slotStart = timeStringToMinutes(startStr);

    return slotStart >= timePreference.start && slotStart <= timePreference.end;
  });
};

export const timeStringToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const timeMinutesToString = (minutes) => {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
};

export const mergeConsecutiveSlots = (slots) => {
  const merged = [];
  let current = null;

  for (const time of slots) {
    if (!current) {
      current = { start: time, end: time + TIME_SLOT_DURATION };
    } else if (time === current.end) {
      current.end += TIME_SLOT_DURATION;
    } else {
      if (current.end - current.start >= MIN_BOOKING_DURATION) {
        merged.push(`${timeMinutesToString(current.start)}-${timeMinutesToString(current.end)}`);
      }
      current = { start: time, end: time + TIME_SLOT_DURATION };
    }
  }

  if (current && current.end - current.start >= MIN_BOOKING_DURATION) {
    merged.push(`${timeMinutesToString(current.start)}-${timeMinutesToString(current.end)}`);
  }

  return merged;
};