/**
 * Microsoft 365 Service Health via Microsoft Graph
 * (`/admin/serviceAnnouncement/healthOverviews` and `/issues`).
 *
 * Pure of Next.js and the database so it can be unit tested with an injected
 * `fetch`. Requires the `ServiceHealth.Read.All` application permission.
 */
import {
  DIRECT_GRAPH_BASE_URL,
  getGraphConfig,
  getGraphToken,
  graphUrl,
  isEmptyAccessTokenGraphError,
  isGraphMicrosoftHost,
} from '../graph-token';
import { HealthError, GRAPH_HEALTH_PERMISSION } from './errors';
import {
  classificationFromGraph,
  compareEvents,
  compareServicesByImpact,
  isEventActive,
  levelFromStatus,
  severityFor,
  statusLabel,
} from './status';
import type { HealthEvent, HealthPost, HealthSectionState, HealthService, HealthSnapshot } from './types';

export const HEALTH_WINDOW_DAYS = 30;

const ISSUES_PAGE_SIZE = 100;
const ISSUES_MAX_PAGES = 10;
const OVERVIEWS_MAX_PAGES = 3;
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 250;
const MAX_RETRY_DELAY_MS = 3_000;
const REQUEST_TIMEOUT_MS = 15_000;
const DAY_MS = 24 * 60 * 60 * 1000;

type EnvSource = Record<string, string | undefined>;

export interface GraphHealthOptions {
  env?: EnvSource;
  fetchImpl?: typeof fetch;
  /** Overrides token acquisition (defaults to the shared app-only token). */
  getToken?: () => Promise<string>;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

interface GraphPage {
  value?: unknown;
  '@odata.nextLink'?: unknown;
}

interface PagedResult {
  items: unknown[];
  state: HealthSectionState;
  warning?: string;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function retryDelayMs(response: Response, attempt: number): number {
  const header = response.headers.get('retry-after');
  const seconds = header ? Number(header) : Number.NaN;
  if (Number.isFinite(seconds)) return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, seconds * 1000));
  return Math.min(MAX_RETRY_DELAY_MS, BASE_RETRY_DELAY_MS * 2 ** (attempt - 1));
}

/**
 * Keeps pagination on the host we are authorized to talk to. Graph returns
 * absolute `@odata.nextLink` URLs; behind API Management they can point at
 * graph.microsoft.com, so those are re-rooted onto the gateway. Anything else
 * is refused so a bearer token is never sent to an unexpected origin.
 */
export function resolveNextLink(nextLink: string, baseUrl: string): string | null {
  let next: URL;
  let base: URL;
  try {
    next = new URL(nextLink);
    base = new URL(baseUrl);
  } catch {
    return null;
  }
  if (next.origin === base.origin) return next.toString();
  if (isGraphMicrosoftHost(next.toString()) && /^\/(v1\.0|beta)\//.test(next.pathname)) {
    return `${baseUrl}${next.pathname}${next.search}`;
  }
  return null;
}

function createGraphGetter(options: GraphHealthOptions) {
  const {
    env = process.env,
    fetchImpl = fetch,
    sleep = defaultSleep,
    getToken = () => getGraphToken({ env, fetchImpl }),
  } = options;
  const config = getGraphConfig(env);

  if (!config.hasRequiredEnvVars) {
    throw new HealthError('not-configured', 'Microsoft Graph is not configured');
  }

  let baseUrl = config.baseUrl;
  let token: string | null = null;
  let hasFallenBack = false;
  let tokenPromise: Promise<string> | null = null;

  async function ensureToken(): Promise<string> {
    if (token) return token;
    tokenPromise ??= getToken().then(
      value => {
        token = value;
        return value;
      },
      error => {
        tokenPromise = null;
        throw new HealthError(
          'unavailable',
          error instanceof Error ? error.message : 'Failed to acquire a Graph token'
        );
      }
    );
    return tokenPromise;
  }

  // Direct mode always authenticates; in APIM mode the gateway does it until a
  // 401 "access token is empty" forces the local-credentials fallback.
  async function getJson(target: string): Promise<GraphPage> {
    for (let attempt = 1; ; attempt++) {
      if (!config.isApimMode || hasFallenBack) await ensureToken();

      const url = target.startsWith('/') ? graphUrl(target, 'v1.0', baseUrl) : target;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      let response: Response;
      try {
        response = await fetchImpl(url, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        if (attempt < MAX_ATTEMPTS) {
          await sleep(Math.min(MAX_RETRY_DELAY_MS, BASE_RETRY_DELAY_MS * 2 ** (attempt - 1)));
          continue;
        }
        throw new HealthError(
          'unavailable',
          error instanceof Error ? error.message : 'Microsoft Graph request failed'
        );
      }

      if (response.ok) {
        try {
          return (await response.json()) as GraphPage;
        } catch {
          throw new HealthError('unavailable', 'Microsoft Graph returned an unreadable response', 502);
        }
      }

      if (response.status === 401 && config.isApimMode && !hasFallenBack && config.hasLocalCredentials) {
        const errorText = await response.text().catch(() => '');
        if (isEmptyAccessTokenGraphError(errorText) && target.startsWith('/')) {
          hasFallenBack = true;
          baseUrl = DIRECT_GRAPH_BASE_URL;
          continue;
        }
        throw new HealthError('forbidden', 'Microsoft Graph rejected the credentials', 401);
      }

      if (response.status === 401 || response.status === 403) {
        throw new HealthError(
          'forbidden',
          `Microsoft Graph returned ${response.status}; check the ${GRAPH_HEALTH_PERMISSION} permission and admin consent`,
          response.status
        );
      }
      if (response.status === 404) {
        throw new HealthError('not-found', 'Not found', 404);
      }
      if ((response.status === 429 || response.status >= 500) && attempt < MAX_ATTEMPTS) {
        await sleep(retryDelayMs(response, attempt));
        continue;
      }
      throw new HealthError(
        response.status === 429 ? 'throttled' : 'unavailable',
        `Microsoft Graph returned ${response.status}`,
        response.status
      );
    }
  }

  async function getPages(path: string, maxPages: number, label: string): Promise<PagedResult> {
    const items: unknown[] = [];
    let target: string | null = path;
    let pages = 0;

    while (target && pages < maxPages) {
      let page: GraphPage;
      try {
        page = await getJson(target);
      } catch (error) {
        // A first-page failure is a real failure; later pages degrade to partial.
        if (pages === 0) throw error;
        return {
          items,
          state: 'partial',
          warning: `${label} stopped after ${pages} page${pages === 1 ? '' : 's'} because a later page failed. Results are partial.`,
        };
      }
      pages++;
      if (Array.isArray(page.value)) items.push(...page.value);

      const next: unknown = page['@odata.nextLink'];
      if (typeof next !== 'string' || !next) {
        target = null;
      } else {
        target = resolveNextLink(next, baseUrl);
        if (!target) {
          return {
            items,
            state: 'partial',
            warning: `${label} returned an unexpected pagination link. Results are partial.`,
          };
        }
      }
    }

    if (target) {
      return {
        items,
        state: 'partial',
        warning: `${label} reached its ${maxPages}-page safety limit. Results are partial.`,
      };
    }
    return { items, state: 'ok' };
  }

  return { getJson, getPages };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asIsoOrEmpty(value: unknown): string {
  const text = asString(value);
  return text && !Number.isNaN(Date.parse(text)) ? text : '';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizePosts(raw: unknown): HealthPost[] {
  if (!Array.isArray(raw)) return [];
  const posts: HealthPost[] = [];
  for (const entry of raw) {
    const post = asRecord(entry);
    const description = asRecord(post?.description);
    const content = asString(description?.content);
    if (!post || !content) continue;
    posts.push({
      createdAt: asIsoOrEmpty(post.createdDateTime),
      kind: asString(post.postType),
      contentType: asString(description?.contentType).toLowerCase() === 'html' ? 'html' : 'text',
      content,
    });
  }
  return posts.sort((a, b) => Date.parse(a.createdAt || '') - Date.parse(b.createdAt || ''));
}

export function normalizeGraphIssue(raw: unknown): HealthEvent | null {
  const issue = asRecord(raw);
  const id = asString(issue?.id);
  if (!issue || !id) return null;

  const status = asString(issue.status);
  const startedAt = asIsoOrEmpty(issue.startDateTime);
  const endedAt = asIsoOrEmpty(issue.endDateTime) || null;
  const classification = classificationFromGraph(asString(issue.classification));
  const level = levelFromStatus(status);
  const isActive = isEventActive({ status, isResolved: issue.isResolved === true, endedAt });
  const details = Array.isArray(issue.details)
    ? issue.details.flatMap(entry => {
        const detail = asRecord(entry);
        const name = asString(detail?.name);
        const value = asString(detail?.value);
        return name && value ? [{ name, value }] : [];
      })
    : [];

  return {
    id,
    provider: 'm365',
    title: asString(issue.title) || id,
    service: asString(issue.service) || 'Unknown service',
    feature: asString(issue.feature),
    featureGroup: asString(issue.featureGroup),
    classification,
    severity: severityFor(level, classification, isActive),
    level,
    statusLabel: statusLabel(status),
    isActive,
    impact: asString(issue.impactDescription),
    startedAt,
    lastModifiedAt: asIsoOrEmpty(issue.lastModifiedDateTime) || startedAt,
    endedAt,
    origin: asString(issue.origin),
    details,
    posts: normalizePosts(issue.posts),
  };
}

function buildServices(rawOverviews: unknown[], events: HealthEvent[]): HealthService[] {
  const services: HealthService[] = [];
  const seen = new Set<string>();

  for (const raw of rawOverviews) {
    const overview = asRecord(raw);
    const name = asString(overview?.service) || asString(overview?.id);
    if (!overview || !name || seen.has(name)) continue;
    seen.add(name);
    const status = asString(overview.status);
    services.push({
      id: asString(overview.id) || name,
      provider: 'm365',
      name,
      level: levelFromStatus(status),
      statusLabel: statusLabel(status),
      activeEventCount: events.filter(event => event.isActive && event.service === name).length,
    });
  }

  return services.sort(compareServicesByImpact);
}

function sectionOf(result: PromiseSettledResult<PagedResult>): HealthSectionState {
  return result.status === 'fulfilled' ? result.value.state : 'unavailable';
}

/** Load the tenant's service status and recent issues. Throws HealthError on total failure. */
export async function fetchM365Health(options: GraphHealthOptions = {}): Promise<HealthSnapshot> {
  const now = options.now ?? Date.now;
  const graph = createGraphGetter(options);
  const since = new Date(now() - HEALTH_WINDOW_DAYS * DAY_MS).toISOString();
  const issuesPath = `/admin/serviceAnnouncement/issues?$filter=${encodeURIComponent(
    `startDateTime gt ${since}`
  )}&$top=${ISSUES_PAGE_SIZE}`;

  const [overviews, issues] = await Promise.allSettled([
    graph.getPages('/admin/serviceAnnouncement/healthOverviews', OVERVIEWS_MAX_PAGES, 'Service status'),
    graph.getPages(issuesPath, ISSUES_MAX_PAGES, 'Issue history'),
  ]);

  // Permission problems need fixing before any data is trustworthy.
  for (const result of [overviews, issues]) {
    if (result.status === 'rejected' && result.reason instanceof HealthError) {
      if (result.reason.kind === 'forbidden' || result.reason.kind === 'not-configured') {
        throw result.reason;
      }
    }
  }
  if (overviews.status === 'rejected' && issues.status === 'rejected') {
    throw overviews.reason;
  }

  const warnings: string[] = [];
  const events =
    issues.status === 'fulfilled'
      ? issues.value.items
          .map(normalizeGraphIssue)
          .filter((event): event is HealthEvent => event !== null)
          .sort(compareEvents)
      : [];
  if (issues.status === 'fulfilled' && issues.value.warning) warnings.push(issues.value.warning);
  if (issues.status === 'rejected') warnings.push('Issue history is temporarily unavailable.');

  const services = overviews.status === 'fulfilled' ? buildServices(overviews.value.items, events) : [];
  if (overviews.status === 'fulfilled' && overviews.value.warning) {
    warnings.push(overviews.value.warning);
  }
  if (overviews.status === 'rejected') warnings.push('Current service status is temporarily unavailable.');

  return {
    provider: 'm365',
    fetchedAt: new Date(now()).toISOString(),
    windowDays: HEALTH_WINDOW_DAYS,
    services,
    events,
    sections: { services: sectionOf(overviews), events: sectionOf(issues) },
    warnings,
  };
}

/** Load one issue by ID, for issues older than the list window. Returns null when Graph has none. */
export async function fetchM365Issue(
  id: string,
  options: GraphHealthOptions = {}
): Promise<HealthEvent | null> {
  const graph = createGraphGetter(options);
  try {
    const raw = await graph.getJson(`/admin/serviceAnnouncement/issues/${encodeURIComponent(id)}`);
    return normalizeGraphIssue(raw);
  } catch (error) {
    if (error instanceof HealthError && error.kind === 'not-found') return null;
    throw error;
  }
}
