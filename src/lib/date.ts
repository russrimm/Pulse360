import { format } from 'date-fns';

export function parseCalendarDate(value: string): Date | null {
  const monthOnlyMatch = value.match(/^(\d{4})-(\d{2})$/);
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = monthOnlyMatch
    ? new Date(Number(monthOnlyMatch[1]), Number(monthOnlyMatch[2]) - 1, 1)
    : dateOnlyMatch
      ? new Date(
          Number(dateOnlyMatch[1]),
          Number(dateOnlyMatch[2]) - 1,
          Number(dateOnlyMatch[3])
        )
      : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCalendarDate(value: string, pattern = 'MMM d, yyyy'): string {
  const date = parseCalendarDate(value);
  return date ? format(date, pattern) : 'Date unavailable';
}
