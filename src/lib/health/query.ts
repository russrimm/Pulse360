/**
 * Listing and summary helpers for health snapshots. Reuses the shared
 * URL-param list engine so filters, pagination and sharing behave like the
 * other Pulse 360 lists.
 */
import type { ListQueryConfig } from '../list-query';
import { CLASSIFICATION_LABELS, SEVERITY_LABELS, compareEvents } from './status';
import type { HealthEvent, HealthSnapshot } from './types';

export const HEALTH_FACET_KEYS = ['service', 'severity', 'classification', 'status'] as const;

export const HEALTH_PAGE_SIZE = 12;

export const healthListConfig: ListQueryConfig<HealthEvent> = {
  pageSize: HEALTH_PAGE_SIZE,
  getDate: event => event.lastModifiedAt || event.startedAt,
  getSearchText: event =>
    [event.id, event.title, event.service, event.feature, event.featureGroup, event.impact].join(' '),
  facets: [
    { key: 'service', label: 'Service', getValues: event => [event.service] },
    { key: 'severity', label: 'Severity', getValues: event => [SEVERITY_LABELS[event.severity]] },
    {
      key: 'classification',
      label: 'Classification',
      getValues: event => [CLASSIFICATION_LABELS[event.classification]],
    },
    { key: 'status', label: 'Status', getValues: event => [event.statusLabel] },
  ],
  compare: compareEvents,
};

export type HealthHeadline = 'impact' | 'advisories-only' | 'healthy' | 'unknown';

export interface HealthSummary {
  serviceCount: number;
  affectedServiceCount: number;
  activeEventCount: number;
  criticalEventCount: number;
  /**
   * 'healthy' is only claimed when service status loaded, every service is
   * operational, and no active issue exists. If either source is missing the
   * headline stays 'unknown' rather than implying all is well.
   */
  headline: HealthHeadline;
}

export function summarizeHealth(snapshot: HealthSnapshot): HealthSummary {
  const affectedServiceCount = snapshot.services.filter(service => service.level !== 'operational').length;
  const activeEvents = snapshot.events.filter(event => event.isActive);
  const criticalEventCount = activeEvents.filter(event => event.severity === 'critical').length;

  const isFullyLoaded =
    snapshot.sections.services === 'ok' &&
    snapshot.sections.events === 'ok' &&
    snapshot.services.length > 0;

  let headline: HealthHeadline = 'unknown';
  if (affectedServiceCount > 0 || criticalEventCount > 0) {
    headline = 'impact';
  } else if (activeEvents.length > 0) {
    headline = 'advisories-only';
  } else if (isFullyLoaded) {
    headline = 'healthy';
  }

  return {
    serviceCount: snapshot.services.length,
    affectedServiceCount,
    activeEventCount: activeEvents.length,
    criticalEventCount,
    headline,
  };
}
