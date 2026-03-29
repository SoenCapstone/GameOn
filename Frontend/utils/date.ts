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

export function formatMemberSince(joinedAt: string): string | undefined {
  const date = new Date(joinedAt);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return `Member Since ${Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}

export function buildStartEndIso(date: Date, startTime: Date, endTime: Date) {
  const start = new Date(date);
  start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
  const end = new Date(date);
  end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

  return {
    startTime: toOffsetIsoString(start),
    endTime: toOffsetIsoString(end),
  };
}

export function formatLocalDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toOffsetIsoString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  const timezoneOffsetMinutes = -value.getTimezoneOffset();
  const sign = timezoneOffsetMinutes >= 0 ? "+" : "-";
  const absoluteOffsetMinutes = Math.abs(timezoneOffsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffsetMinutes / 60)).padStart(
    2,
    "0",
  );
  const offsetMinutes = String(absoluteOffsetMinutes % 60).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
}

export function isValidTimeRange(date: Date, startTime: Date, endTime: Date) {
  const { startTime: startIso, endTime: endIso } = buildStartEndIso(
    date,
    startTime,
    endTime,
  );
  return new Date(endIso).getTime() > new Date(startIso).getTime();
}
