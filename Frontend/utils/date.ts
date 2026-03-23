export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function parseDraftDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export function buildStartEndIso(date: Date, startTime: Date, endTime: Date) {
  const start = new Date(date);
  start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
  const end = new Date(date);
  end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

export function isValidTimeRange(date: Date, startTime: Date, endTime: Date) {
  const { startTime: startIso, endTime: endIso } = buildStartEndIso(
    date,
    startTime,
    endTime,
  );
  return new Date(endIso).getTime() > new Date(startIso).getTime();
}
