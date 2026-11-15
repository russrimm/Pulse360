/**
 * Pure status mapping shared by every health provider: Graph status strings
 * to levels, severities, labels and active/resolved state.
 */
import type {
  HealthClassification,
  HealthEvent,
  HealthLevel,
  HealthSeverity,
  HealthService,
} from './types';

/** Statuses that mean the problem is over, even if endDateTime is missing. */
const RESOLVED_STATUSES = new Set([
  'serviceoperational',
  'servicerestored',
  'postincidentreviewpublished',
  'falsepositive',
  'investigationsuspended',
  'resolved',
  'resolvedexternal',
  'mitigated',
  'mitigatedexternal',
]);

const STATUS_LABELS: Record<string, string> = {
  serviceoperational: 'Operational',
  investigating: 'Investigating',
  restoringservice: 'Restoring service',
  verifyingservice: 'Verifying service',
  servicerestored: 'Service restored',
  postincidentreviewpublished: 'Post-incident review published',
  servicedegradation: 'Service degradation',
  serviceinterruption: 'Service interruption',
  extendedrecovery: 'Extended recovery',
  falsepositive: 'False positive',
  investigationsuspended: 'Investigation suspended',
  resolved: 'Resolved',
  mitigatedexternal: 'Mitigated externally',
  mitigated: 'Mitigated',
  resolvedexternal: 'Resolved externally',
  confirmed: 'Confirmed',
  reported: 'Reported',
};

const LEVEL_RANK: Record<HealthLevel, number> = {
  interruption: 0,
  extended: 1,
  degraded: 2,
  restoring: 3,
  investigating: 4,
  unknown: 5,
  operational: 6,
};

export const LEVEL_LABELS: Record<HealthLevel, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  interruption: 'Interruption',
  investigating: 'Investigating',
  restoring: 'Restoring',
  extended: 'Extended recovery',
  unknown: 'Unknown',
};

export const SEVERITY_LABELS: Record<HealthSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  informational: 'Informational',
};

export const CLASSIFICATION_LABELS: Record<HealthClassification, string> = {
  incident: 'Incident',
  advisory: 'Advisory',
  other: 'Other',
};

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

export function isResolvedStatus(status: string): boolean {
  return RESOLVED_STATUSES.has(normalizeStatus(status));
}

export function levelFromStatus(status: string): HealthLevel {
  const value = normalizeStatus(status);
  if (!value) return 'unknown';
  if (RESOLVED_STATUSES.has(value)) return 'operational';
  if (value.includes('interruption')) return 'interruption';
  if (value.includes('degradation')) return 'degraded';
  if (value.includes('extended')) return 'extended';
  if (value.includes('restoring') || value.includes('verifying')) return 'restoring';
  if (value === 'investigating' || value === 'confirmed' || value === 'reported') {
    return 'investigating';
  }
  return 'unknown';
}

export function statusLabel(status: string): string {
  const value = normalizeStatus(status);
  if (!value) return 'Unknown';
  const known = STATUS_LABELS[value];
  if (known) return known;
  // Unknown future values: split camelCase into a sentence.
  const words = status
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function classificationFromGraph(value: string): HealthClassification {
  const normalized = normalizeStatus(value);
  if (normalized === 'incident') return 'incident';
  if (normalized === 'advisory') return 'advisory';
  return 'other';
}

interface ActiveInput {
  status: string;
  isResolved: boolean;
  endedAt: string | null;
}

export function isEventActive({ status, isResolved, endedAt }: ActiveInput): boolean {
  if (isResolved || endedAt) return false;
  return !isResolvedStatus(status);
}

export function severityFor(
  level: HealthLevel,
  classification: HealthClassification,
  isActive: boolean
): HealthSeverity {
  if (!isActive) return 'informational';
  if (level === 'interruption' || level === 'extended') return 'critical';
  if (level === 'operational') return 'informational';
  if (level !== 'unknown' || classification === 'incident') return 'warning';
  return 'informational';
}

export function compareServicesByImpact(a: HealthService, b: HealthService): number {
  return (
    LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
    b.activeEventCount - a.activeEventCount ||
    a.name.localeCompare(b.name)
  );
}

/** Active first, then most recently updated. */
export function compareEvents(a: HealthEvent, b: HealthEvent): number {
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
  return Date.parse(b.lastModifiedAt) - Date.parse(a.lastModifiedAt);
}

/** Graph issue IDs look like "EX123456"; reject anything else before it reaches a URL. */
export function isValidHealthIssueId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

/** Stable UTC timestamp so server and client renders never disagree. */
export function formatHealthDate(iso: string | null | undefined): string {
  if (!iso) return 'Not available';
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return 'Not available';
  return `${new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  })} UTC`;
}
