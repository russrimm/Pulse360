export interface LifecycleDateFields {
  endOfSupportDate: string | null;
  mainStreamEndDate: string | null;
  extendedEndDate: string | null;
  retirementDate: string | null;
}

export type LifecycleExpiryStatus = 'expired' | 'expiring-soon' | 'active' | 'unknown';

const EXPIRING_SOON_DAYS = 180;

export function parseLifecycleDate(value: string): Date | null {
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function getLifecycleExpiryStatus(
  row: LifecycleDateFields,
  now = new Date(),
): LifecycleExpiryStatus {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const dates = [
    row.endOfSupportDate,
    row.mainStreamEndDate,
    row.extendedEndDate,
    row.retirementDate,
  ]
    .filter((value): value is string => Boolean(value))
    .map(parseLifecycleDate)
    .filter((date): date is Date => date !== null);

  if (dates.length === 0) return 'unknown';

  const latestTimestamp = Math.max(...dates.map(date => date.getTime()));
  if (latestTimestamp < today.getTime()) return 'expired';

  const expiringSoonMs = EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
  return latestTimestamp - today.getTime() <= expiringSoonMs ? 'expiring-soon' : 'active';
}
