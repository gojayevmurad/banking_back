export function getLastWeekDates() {
  const now = Date.now();
  const endDate = new Date(now).toISOString();

  const startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  return { startDate, endDate };
}
