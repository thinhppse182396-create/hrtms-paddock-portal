const pad = (value: number) => String(value).padStart(2, "0");

export function toLocalDateString(value = new Date()): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function toLocalTimeString(value = new Date()): string {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function toLocalDateTimeString(value = new Date()): string {
  return `${toLocalDateString(value)} ${toLocalTimeString(value)}`;
}

export function addLocalDays(days: number, value = new Date()): string {
  const next = new Date(value);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return toLocalDateString(next);
}

export function addLocalMinutes(minutes: number, value = new Date()): Date {
  const next = new Date(value);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
    ? parsed
    : null;
}

export function parseLocalDateTime(date: string, time: string): Date | null {
  const parsedDate = parseLocalDate(date);
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!parsedDate || !match) return null;

  const [, hours, minutes] = match.map(Number);
  if (hours > 23 || minutes > 59) return null;

  parsedDate.setHours(hours, minutes, 0, 0);
  return parsedDate;
}

export function calendarDaysBetween(start: string, end: string): number {
  const parsedStart = parseLocalDate(start);
  const parsedEnd = parseLocalDate(end);
  if (!parsedStart || !parsedEnd) return Number.NaN;

  const startUtc = Date.UTC(
    parsedStart.getFullYear(),
    parsedStart.getMonth(),
    parsedStart.getDate(),
  );
  const endUtc = Date.UTC(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}
