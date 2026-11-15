/**
 * Provider-neutral service health model. Microsoft 365 (Graph) is the first
 * provider; other providers (for example Azure Service Health) normalize into
 * the same shapes so the UI and list filtering stay provider-agnostic.
 *
 * Everything here is JSON-serializable because snapshots are cached in
 * Postgres and passed from server to client components.
 */

export type HealthProvider = 'm365' | 'azure';

/** How a service or event is affecting customers right now. */
export type HealthLevel =
  | 'operational'
  | 'degraded'
  | 'interruption'
  | 'investigating'
  | 'restoring'
  | 'extended'
  | 'unknown';

export type HealthSeverity = 'critical' | 'warning' | 'informational';

export type HealthClassification = 'incident' | 'advisory' | 'other';

export interface HealthPost {
  createdAt: string;
  kind: string;
  contentType: 'html' | 'text';
  content: string;
}

export interface HealthDetail {
  name: string;
  value: string;
}

export interface HealthEvent {
  id: string;
  provider: HealthProvider;
  title: string;
  service: string;
  feature: string;
  featureGroup: string;
  classification: HealthClassification;
  severity: HealthSeverity;
  level: HealthLevel;
  /** Human-readable status, for example "Service degradation". */
  statusLabel: string;
  isActive: boolean;
  /** Plain text. Never render as HTML. */
  impact: string;
  startedAt: string;
  lastModifiedAt: string;
  endedAt: string | null;
  origin: string;
  details: HealthDetail[];
  posts: HealthPost[];
}

export interface HealthService {
  id: string;
  provider: HealthProvider;
  name: string;
  level: HealthLevel;
  statusLabel: string;
  activeEventCount: number;
}

/**
 * - ok: loaded completely.
 * - partial: loaded, but pagination stopped early, so more data may exist.
 * - unavailable: could not be loaded; the UI must not present it as empty.
 */
export type HealthSectionState = 'ok' | 'partial' | 'unavailable';

export interface HealthSnapshot {
  provider: HealthProvider;
  fetchedAt: string;
  /** Length of the event window, in days, so the UI can state what "none" means. */
  windowDays: number;
  services: HealthService[];
  events: HealthEvent[];
  sections: {
    services: HealthSectionState;
    events: HealthSectionState;
  };
  warnings: string[];
}
