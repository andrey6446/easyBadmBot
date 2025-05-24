export const userCalendarState = new Map();
export const userTimePreferences = new Map();
export const userAwaitingTimeInput = new Map();
export const userErrorMessages = new Map();
export let allCourtsData = {};

export const userNotificationState = new Map();
export const userAwaitingNotificationTimeRange = new Map();
export const userAwaitingNotificationWeekdays = new Map();

export const updateAllCourtsData = (data) => {
  allCourtsData = data;
};