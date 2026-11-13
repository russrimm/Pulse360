import 'server-only';
import { M365Update, Message, MessageStatus } from './types';
import { getPrisma } from './prisma';
import { withDbRetry } from './db-retry';
import type { MessageCenterUpdate, Prisma } from '@/generated/prisma';
import { XMLParser } from 'fast-xml-parser';
import { parseGraphDate } from './graph';

// Base URL without version path — supports both /v1.0 and /beta
const RAW_AZURE_API_URL = process.env.AZURE_API_URL?.trim();
const DIRECT_GRAPH_BASE_URL = 'https://graph.microsoft.com';
const GRAPH_REQUEST_TIMEOUT_MS = 25_000;
// Whole-pagination budget. Keeps a slow Graph from blowing past the cron
// route's maxDuration (60s) one 25s page at a time.
const GRAPH_SYNC_BUDGET_MS = 45_000;

function normalizeApiBaseUrl(url?: string): string {
  const value = url || DIRECT_GRAPH_BASE_URL;
  const parsed = new URL(
    value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`
  );

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('AZURE_API_URL must use http or https');
  }

  parsed.hash = '';
  parsed.search = '';
  if (parsed.hostname.toLowerCase() === 'graph.microsoft.com') {
    parsed.pathname = parsed.pathname.replace(/\/(?:v1\.0|beta)\/?$/i, '');
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.toString().replace(/\/$/, '');
}

function isGraphMicrosoftHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase() === 'graph.microsoft.com';
  } catch {
    return false;
  }
}

const GRAPH_BASE_URL = normalizeApiBaseUrl(RAW_AZURE_API_URL);
const API_KEY = process.env.AZURE_CLIENT_SECRET;
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const hasLocalCredentials = Boolean(API_KEY && TENANT_ID && CLIENT_ID);

// APIM mode applies only when AZURE_API_URL points to a non-Graph host.
const isApimMode = Boolean(RAW_AZURE_API_URL) && !isGraphMicrosoftHost(GRAPH_BASE_URL);

const isDev = process.env.NODE_ENV === 'development';

// In APIM mode, no local credentials required; otherwise check env vars
const hasRequiredEnvVars = isApimMode || hasLocalCredentials;

export function isMessageCenterSyncConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && hasRequiredEnvVars);
}

/** Build a Graph API URL with version. Defaults to v1.0. */
function graphUrl(
  path: string,
  version: 'v1.0' | 'beta' = 'v1.0',
  baseUrl = GRAPH_BASE_URL
): string {
  return `${baseUrl}/${version}${path}`;
}

function isEmptyAccessTokenGraphError(errorText: string): boolean {
  try {
    const parsed = JSON.parse(errorText) as {
      error?: { code?: string; message?: string };
    };
    const code = parsed.error?.code ?? '';
    const message = parsed.error?.message ?? '';
    return code === 'InvalidAuthenticationToken' && /access token is empty/i.test(message);
  } catch {
    return (
      /InvalidAuthenticationToken/i.test(errorText) && /access token is empty/i.test(errorText)
    );
  }
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

interface AzureTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
  error?: unknown;
  error_description?: unknown;
}

let cachedToken: CachedToken | null = null;

async function getToken(): Promise<string> {
  if (!hasRequiredEnvVars) {
    const missing = [];
    if (!API_KEY) missing.push('AZURE_CLIENT_SECRET');
    if (!TENANT_ID) missing.push('AZURE_TENANT_ID');
    if (!CLIENT_ID) missing.push('AZURE_CLIENT_ID');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  if (CLIENT_ID) params.append('client_id', CLIENT_ID);
  params.append('scope', 'https://graph.microsoft.com/.default');
  if (API_KEY) params.append('client_secret', API_KEY);
  params.append('grant_type', 'client_credentials');

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error_description) {
        errorDetails = errorJson.error_description;
      }
    } catch {
      // Keep original error text if not JSON
    }

    throw new Error(
      `Failed to get Azure AD token (${response.status}): ${errorDetails}. Please verify TENANT_ID, CLIENT_ID, and API_KEY in environment variables.`
    );
  }

  const data = (await response.json()) as AzureTokenResponse;

  if (typeof data.access_token !== 'string') {
    throw new Error(
      `Azure AD returned no access_token. Response: ${JSON.stringify({ error: data.error, error_description: data.error_description })}`
    );
  }

  const accessToken = data.access_token.trim();
  if (!accessToken) {
    throw new Error('Azure AD returned an empty access_token.');
  }

  const expiresInSeconds =
    typeof data.expires_in === 'number' && Number.isFinite(data.expires_in)
      ? data.expires_in
      : 3600;
  cachedToken = {
    value: accessToken,
    expiresAt: Date.now() + Math.max(60, expiresInSeconds - 60) * 1000,
  };

  return cachedToken.value;
}

interface GraphApiMessage {
  id: string;
  title: string;
  startDateTime: string;
  lastModifiedDateTime: string;
  category: string;
  severity: string;
  tags: string[];
  services: string[];
  details: {
    name: string;
    value: string;
  }[];
  body: {
    contentType: string;
    content: string;
  };
  isMajorChange: boolean;
  actionRequiredByDateTime?: string;
}

interface GraphApiResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string;
  value: GraphApiMessage[];
}

const messageListSelect = {
  id: true,
  title: true,
  service: true,
  tags: true,
  content: true,
  summary: true,
  isMajorChange: true,
  severity: true,
  published: true,
  lastUpdated: true,
  status: true,
  firstSeenAt: true,
  lastSeenAt: true,
} satisfies Prisma.MessageCenterUpdateSelect;

type MessageListRow = Prisma.MessageCenterUpdateGetPayload<{ select: typeof messageListSelect }>;

export async function getMessages(): Promise<Message[]> {
  const prisma = getPrisma();
  const rows = await withDbRetry(
    () =>
      prisma.messageCenterUpdate.findMany({
        select: messageListSelect,
        orderBy: { lastUpdated: 'desc' },
      }),
    'getMessages'
  );

  // Vercel Cron (see vercel.json → /api/cron/sync-messages) is the baseline
  // sync path. On-demand sync here is a safety net:
  //   - DB has rows: fire-and-forget so page loads never block on Graph.
  //   - DB empty (first-ever deploy or wipe): block once so users don't see
  //     an empty screen before cron fires.
  if (rows.length === 0) {
    await ensureMessagesSynced();
    const rehydrated = await withDbRetry(
      () =>
        prisma.messageCenterUpdate.findMany({
          select: messageListSelect,
          orderBy: { lastUpdated: 'desc' },
        }),
      'getMessages(rehydrate)'
    );
    return rehydrated.map(rowToListMessage);
  }

  void ensureMessagesSynced().catch(() => undefined);
  return rows.map(rowToListMessage);
}

export async function getMessageSyncMetadata(): Promise<{
  lastSyncAt: string | null;
  isStale: boolean;
}> {
  let lastSyncAt: Date | null = null;

  try {
    const state = await withDbRetry(
      () =>
        getPrisma().syncState.findUnique({
          where: { key: MESSAGE_CENTER_SYNC_KEY },
          select: { lastSyncAt: true },
        }),
      'getMessageSyncMetadata'
    );
    lastSyncAt = state?.lastSyncAt ?? null;
  } catch (error) {
    // Metadata is a footnote on the page; never fail the render over it.
    console.error('Sync metadata lookup failed:', error);
  }

  return {
    lastSyncAt: lastSyncAt?.toISOString() ?? null,
    isStale: !lastSyncAt || Date.now() - lastSyncAt.getTime() > MESSAGE_CENTER_STALE_MS,
  };
}

function isAbortOrNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'TimeoutError' ||
    error.name === 'AbortError' ||
    error.name === 'TypeError' || // undici wraps connection resets as TypeError
    /fetch failed|socket hang up|econnreset|etimedout/i.test(error.message)
  );
}

/**
 * Fetches one Graph page within the remaining sync budget, retrying once on a
 * timeout or connection blip. Throws when the budget is exhausted so a slow
 * Graph fails the sync outright instead of returning a truncated dataset.
 */
async function fetchGraphPage(
  url: string,
  headers: Record<string, string>,
  deadline: number
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new Error(
        `Graph pagination exceeded the ${GRAPH_SYNC_BUDGET_MS}ms sync budget`,
        lastError instanceof Error ? { cause: lastError } : undefined
      );
    }

    try {
      return await fetch(url, {
        headers,
        // Persistence is our cache now; skip Next's fetch cache.
        cache: 'no-store',
        signal: AbortSignal.timeout(Math.min(GRAPH_REQUEST_TIMEOUT_MS, remainingMs)),
      });
    } catch (error) {
      lastError = error;
      if (attempt === 1 || !isAbortOrNetworkError(error)) {
        throw error;
      }
      console.warn('Graph page request failed; retrying once:', error);
    }
  }

  throw lastError;
}

async function fetchAllMessagesFromGraph(): Promise<GraphApiMessage[]> {
  if (!hasRequiredEnvVars) {
    throw new Error(
      'API not configured. Set AZURE_API_URL (APIM endpoint) or AZURE_CLIENT_ID + AZURE_TENANT_ID + AZURE_CLIENT_SECRET (direct Graph).'
    );
  }

  // In APIM mode, no token needed initially — APIM policy should handle auth.
  // If APIM returns an empty-token error, fallback to direct Graph with local creds.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isApimMode) {
    // APIM handles Authorization; no Bearer token needed from the app
  } else {
    const token = await getToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  let allMessages: GraphApiMessage[] = [];
  let requestBaseUrl = GRAPH_BASE_URL;
  const firstPagePath = `/admin/serviceAnnouncement/messages?$top=500&$orderby=lastModifiedDateTime desc`;
  let didFallbackToDirectGraph = false;
  const MAX_PAGES = 10;
  let nextLink: string | undefined = graphUrl(firstPagePath, 'v1.0', requestBaseUrl);
  const deadline = Date.now() + GRAPH_SYNC_BUDGET_MS;

  let pageCount = 0;
  while (nextLink && pageCount < MAX_PAGES) {
    pageCount++;
    const response = await fetchGraphPage(nextLink, headers, deadline);

    if (!response.ok) {
      const errorText = await response.text();

      const canFallbackToDirectGraph =
        isApimMode &&
        hasLocalCredentials &&
        !didFallbackToDirectGraph &&
        response.status === 401 &&
        isEmptyAccessTokenGraphError(errorText);

      if (canFallbackToDirectGraph) {
        const token = await getToken();
        headers['Authorization'] = `Bearer ${token}`;
        requestBaseUrl = DIRECT_GRAPH_BASE_URL;
        didFallbackToDirectGraph = true;
        allMessages = [];
        pageCount = 0;
        nextLink = graphUrl(firstPagePath, 'v1.0', requestBaseUrl);
        continue;
      }

      throw new Error(
        `Failed to fetch messages: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: GraphApiResponse = await response.json();
    allMessages = [...allMessages, ...(data.value ?? [])];
    nextLink = data['@odata.nextLink'];
  }

  if (nextLink) {
    throw new Error(`Graph pagination exceeded the ${MAX_PAGES}-page safety limit`);
  }

  return allMessages;
}

export async function getMessage(id: string): Promise<Message | null> {
  // Validate message ID format to prevent OData injection (IDs are "MC" + digits)
  if (!/^MC\d+$/i.test(id)) {
    throw new Error('Invalid message ID format');
  }

  // Try DB first — this is the common path and works even for archived rows.
  // A database outage must not 404/500 the page: fall through to Graph instead.
  let row: MessageCenterUpdate | null = null;
  try {
    row = await withDbRetry(
      () => getPrisma().messageCenterUpdate.findUnique({ where: { id } }),
      `getMessage(${id})`
    );
  } catch (error) {
    console.error(`Message lookup failed for ${id}; falling back to Graph:`, error);
  }

  if (row) {
    // Background-refresh so archived/expired status stays current.
    void ensureMessagesSynced().catch(() => undefined);
    return rowToMessage(row);
  }

  if (!hasRequiredEnvVars) {
    if (isDev) throw new Error('Message not found');
    return null;
  }

  try {
    const message = await fetchMessageFromGraph(id);
    if (!message) {
      if (isDev) throw new Error(`Message not found: ${id}`);
      return null;
    }

    // Seed into DB in the background so subsequent reads are cheap.
    void getPrisma()
      .messageCenterUpdate.upsert({
        where: { id: message.id },
        create: graphMessageToDbInput(message, deriveStatus(message, 'active')),
        update: graphMessageToDbUpdate(message, deriveStatus(message, 'active')),
      })
      .catch(err => console.error('Failed to seed single message into DB:', err));

    return graphMessageToApiShape(message, {
      status: deriveStatus(message, 'active'),
    });
  } catch (error) {
    if (isDev) throw error;
    return null;
  }
}

async function fetchMessageFromGraph(id: string): Promise<GraphApiMessage | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isApimMode) {
    // APIM handles Authorization
  } else {
    const token = await getToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestPath = `/admin/serviceAnnouncement/messages?$filter=id eq '${id}'`;
  let requestBaseUrl = GRAPH_BASE_URL;
  let response = await fetch(graphUrl(requestPath, 'v1.0', requestBaseUrl), {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(GRAPH_REQUEST_TIMEOUT_MS),
  });

  if (isApimMode && hasLocalCredentials && response.status === 401) {
    const errorText = await response.text();
    if (isEmptyAccessTokenGraphError(errorText)) {
      const token = await getToken();
      headers['Authorization'] = `Bearer ${token}`;
      requestBaseUrl = DIRECT_GRAPH_BASE_URL;
      response = await fetch(graphUrl(requestPath, 'v1.0', requestBaseUrl), {
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(GRAPH_REQUEST_TIMEOUT_MS),
      });
    } else {
      throw new Error(`Failed to fetch message: ${response.status} ${response.statusText}`);
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch message: ${response.status} ${response.statusText}`);
  }

  const data: GraphApiResponse = await response.json();
  if (!data.value || data.value.length === 0) {
    return null;
  }

  return data.value[0];
}

// --------------------------------------------------------------------------
// Sync + reconciliation: Graph -> Postgres
// --------------------------------------------------------------------------

const MESSAGE_CENTER_SYNC_KEY = 'messageCenter';
const SYNC_TTL_MS = 60 * 60 * 1000; // 1 hour
const MESSAGE_CENTER_STALE_MS = 2 * 60 * 60 * 1000;

/** In-flight sync so concurrent requests coalesce into one Graph pull. */
let inFlightMessageSync: Promise<void> | null = null;

async function ensureMessagesSynced(): Promise<void> {
  if (!hasRequiredEnvVars) {
    // No Graph creds — DB is the source of truth in this environment.
    return;
  }

  if (inFlightMessageSync) {
    return inFlightMessageSync;
  }

  try {
    const prisma = getPrisma();
    const state = await withDbRetry(
      () =>
        prisma.syncState.findUnique({
          where: { key: MESSAGE_CENTER_SYNC_KEY },
        }),
      'ensureMessagesSynced'
    );
    const isFresh = state && Date.now() - state.lastSyncAt.getTime() < SYNC_TTL_MS;
    if (isFresh) {
      return;
    }
  } catch (err) {
    // DB unreachable — surface, but don't retry-loop; caller decides.
    console.error('SyncState lookup failed:', err);
    return;
  }

  inFlightMessageSync = syncMessagesFromGraph()
    .catch(err => {
      console.error('Message Center sync failed; serving stale DB rows:', err);
    })
    .finally(() => {
      inFlightMessageSync = null;
    });

  return inFlightMessageSync;
}

export async function syncMessagesFromGraph(): Promise<void> {
  const prisma = getPrisma();
  const syncStartedAt = new Date();
  const [graphMessages, activeMessageCount] = await Promise.all([
    fetchAllMessagesFromGraph(),
    withDbRetry(
      () => prisma.messageCenterUpdate.count({ where: { status: 'active' } }),
      'syncMessagesFromGraph(count)'
    ),
  ]);

  if (graphMessages.length === 0 && activeMessageCount > 0) {
    throw new Error(
      'Graph returned no Message Center rows; refusing to archive the existing active dataset'
    );
  }

  const now = new Date();
  const seenIds = new Set(graphMessages.map(m => m.id));

  // Upsert every message returned by Graph. Chunk to avoid a single huge tx.
  const CHUNK = 50;
  for (let i = 0; i < graphMessages.length; i += CHUNK) {
    const chunk = graphMessages.slice(i, i + CHUNK);
    await withDbRetry(
      () =>
        prisma.$transaction([
          prisma.messageCenterUpdate.createMany({
            data: chunk.map(m => {
              const status = deriveStatus(m, 'active');
              return graphMessageToDbInput(m, status, syncStartedAt);
            }),
            skipDuplicates: true,
          }),
          ...chunk.map(m => {
            const status = deriveStatus(m, 'active');
            return prisma.messageCenterUpdate.updateMany({
              where: {
                id: m.id,
                lastSeenAt: { lt: syncStartedAt },
                OR: [{ archivedAt: null }, { archivedAt: { lte: syncStartedAt } }],
              },
              data: graphMessageToDbUpdate(m, status, syncStartedAt),
            });
          }),
        ]),
      `syncMessagesFromGraph(upsert chunk ${i / CHUNK})`
    );
  }

  // Mark any previously-active rows that Graph no longer returns.
  const stale = await withDbRetry(
    () =>
      prisma.messageCenterUpdate.findMany({
        where: {
          status: 'active',
          id: { notIn: Array.from(seenIds) },
          lastSeenAt: { lt: syncStartedAt },
        },
        select: { id: true, actionRequiredByDateTime: true },
      }),
    'syncMessagesFromGraph(stale)'
  );

  if (stale.length > 0) {
    await withDbRetry(
      () =>
        prisma.$transaction(
          stale.map(row =>
            prisma.messageCenterUpdate.updateMany({
              where: {
                id: row.id,
                status: 'active',
                lastSeenAt: { lt: syncStartedAt },
              },
              data: {
                status: isPastDate(row.actionRequiredByDateTime) ? 'expired' : 'archived',
                archivedAt: now,
              },
            })
          )
        ),
      'syncMessagesFromGraph(archive)'
    );
  }

  // Also flip still-in-Graph but past-due rows to expired.
  await withDbRetry(
    () =>
      prisma.messageCenterUpdate.updateMany({
        where: {
          status: 'active',
          actionRequiredByDateTime: { lt: now },
        },
        data: { status: 'expired' },
      }),
    'syncMessagesFromGraph(expire)'
  );

  await withDbRetry(
    () =>
      prisma.syncState.upsert({
        where: { key: MESSAGE_CENTER_SYNC_KEY },
        create: { key: MESSAGE_CENTER_SYNC_KEY, lastSyncAt: now, lastError: null },
        update: { lastSyncAt: now, lastError: null },
      }),
    'syncMessagesFromGraph(syncState)'
  );
}

function deriveStatus(m: GraphApiMessage, defaultStatus: MessageStatus): MessageStatus {
  return isPastDate(m.actionRequiredByDateTime) ? 'expired' : defaultStatus;
}

function isPastDate(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

function graphMessageToDbInput(m: GraphApiMessage, status: MessageStatus, firstSeenAt?: Date) {
  return {
    id: m.id,
    title: m.title,
    service: m.services ?? [],
    tags: m.tags ?? [],
    content: m.body?.content ?? '',
    summary: m.details?.find(v => v.name === 'Summary')?.value || '',
    details: (m.details ?? []) as unknown as object,
    isMajorChange: m.isMajorChange || false,
    severity: m.severity ?? null,
    actionRequiredByDateTime: parseGraphDate(m.actionRequiredByDateTime),
    published: parseGraphDate(m.startDateTime),
    lastUpdated: parseGraphDate(m.lastModifiedDateTime),
    status,
    ...(firstSeenAt ? { firstSeenAt, lastSeenAt: firstSeenAt } : {}),
  };
}

function graphMessageToDbUpdate(
  m: GraphApiMessage,
  status: MessageStatus,
  lastSeenAt = new Date()
) {
  return {
    ...graphMessageToDbInput(m, status),
    lastSeenAt,
    // If the message reappears in Graph, clear any archive marker.
    archivedAt: null,
  };
}

function rowToMessage(row: MessageCenterUpdate): Message {
  return {
    id: row.id,
    title: row.title,
    service: row.service,
    lastUpdated: (row.lastUpdated ?? row.lastSeenAt).toISOString(),
    published: (row.published ?? row.firstSeenAt).toISOString(),
    tags: row.tags,
    content: row.content,
    summary: row.summary,
    details: (row.details as unknown as { name: string; value: string }[]) ?? [],
    isMajorChange: row.isMajorChange,
    actionRequiredByDateTime: row.actionRequiredByDateTime?.toISOString(),
    severity: row.severity ?? '',
    status: (row.status as MessageStatus) ?? 'active',
    archivedAt: row.archivedAt?.toISOString(),
  };
}

function rowToListMessage(row: MessageListRow): Message {
  return {
    id: row.id,
    title: row.title,
    service: row.service,
    lastUpdated: (row.lastUpdated ?? row.lastSeenAt).toISOString(),
    published: (row.published ?? row.firstSeenAt).toISOString(),
    tags: row.tags,
    content: row.content,
    summary: row.summary,
    details: [],
    isMajorChange: row.isMajorChange,
    severity: row.severity ?? '',
    status: (row.status as MessageStatus) ?? 'active',
  };
}

function graphMessageToApiShape(m: GraphApiMessage, opts: { status: MessageStatus }): Message {
  return {
    id: m.id,
    title: m.title,
    service: m.services ?? [],
    lastUpdated: m.lastModifiedDateTime,
    published: m.startDateTime,
    tags: m.tags ?? [],
    content: m.body?.content ?? '',
    summary: m.details?.find(v => v.name === 'Summary')?.value || '',
    details:
      m.details?.filter(detail => !['RoadmapIds', 'FeatureStatusJson'].includes(detail.name)) || [],
    isMajorChange: m.isMajorChange || false,
    actionRequiredByDateTime: m.actionRequiredByDateTime,
    severity: m.severity,
    status: opts.status,
  };
}

export interface AzureUpdate {
  id: string;
  title: string;
  description: string;
  productCategories: string[];
  tags: string[];
  products: string[];
  generalAvailabilityDate: string | null;
  previewAvailabilityDate: string | null;
  privatePreviewAvailabilityDate: string | null;
  status: string;
  created: string;
  modified: string;
}

export async function getAzureUpdates(): Promise<AzureUpdate[]> {
  try {
    const response = await fetch('https://www.microsoft.com/releasecommunications/api/v2/azure', {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    if (isDev) throw error;
    return [];
  }
}

interface M365ReleaseApiUpdate {
  id: string | number;
  title: string;
  description: string;
  products?: string[];
  status: string;
  created: string;
  modified: string;
  tags?: string[];
  generalAvailabilityDate?: string;
  previewAvailabilityDate?: string;
  cloudInstances?: string[];
  platforms?: string[];
  releaseRings?: string[];
}

interface M365ReleaseApiResponse {
  value?: M365ReleaseApiUpdate[];
}

export async function getM365Updates(): Promise<M365Update[]> {
  try {
    const response = await fetch('https://www.microsoft.com/releasecommunications/api/v2/m365', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as M365ReleaseApiResponse;
    return (data.value ?? []).map(update => ({
      id: String(update.id),
      title: update.title,
      content: update.description,
      product: update.products?.[0] || '',
      status: update.status,
      published: update.created,
      lastUpdated: update.modified,
      tags: update.tags || [],
      service: update.products || [],
      generalAvailabilityDate: update.generalAvailabilityDate ?? '',
      previewAvailabilityDate: update.previewAvailabilityDate ?? '',
      cloudInstances: update.cloudInstances || [],
      platforms: update.platforms || [],
      releaseRings: update.releaseRings || [],
    }));
  } catch (error) {
    if (isDev) throw error;
    return [];
  }
}

export async function getM365Update(id: string): Promise<M365Update | null> {
  // Validate ID format to prevent path traversal
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error('Invalid update ID format');
  }

  try {
    const response = await fetch(
      `https://www.microsoft.com/releasecommunications/api/v2/m365/rss/${id}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    const result = parser.parse(xmlText);
    const item = result.rss.channel.item;

    // Extract the content from the description
    const content = item.description || '';

    // Extract services from the content
    const servicesMatch = content.match(/<strong>Services<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const services = servicesMatch
      ? servicesMatch[1]
          .replace(/<[^>]*>/g, '')
          .split(',')
          .map((s: string) => s.trim())
      : [];

    // Extract status from the content
    const statusMatch = content.match(/<strong>Status<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const status = statusMatch ? statusMatch[1].replace(/<[^>]*>/g, '').trim() : '';

    // Extract dates from the content
    const gaDateMatch = content.match(/<strong>GA date<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const previewDateMatch = content.match(/<strong>Preview date<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const gaDate = gaDateMatch ? gaDateMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    const previewDate = previewDateMatch ? previewDateMatch[1].replace(/<[^>]*>/g, '').trim() : '';

    // Extract tags from the content
    const tagsMatch = content.match(/<strong>Tags<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const tags = tagsMatch
      ? tagsMatch[1]
          .replace(/<[^>]*>/g, '')
          .split(',')
          .map((tag: string) => tag.trim())
      : [];

    // Extract platforms from the content
    const platformsMatch = content.match(/<strong>Platforms<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const platforms = platformsMatch
      ? platformsMatch[1]
          .replace(/<[^>]*>/g, '')
          .split(',')
          .map((p: string) => p.trim())
      : [];

    // Extract cloud instances from the content
    const cloudInstancesMatch = content.match(
      /<strong>Cloud Instances<\/strong>: (.*?)(?:<br>|<\/p>)/
    );
    const cloudInstances = cloudInstancesMatch
      ? cloudInstancesMatch[1]
          .replace(/<[^>]*>/g, '')
          .split(',')
          .map((c: string) => c.trim())
      : [];

    // Extract release rings from the content
    const releaseRingsMatch = content.match(/<strong>Release Rings<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const releaseRings = releaseRingsMatch
      ? releaseRingsMatch[1]
          .replace(/<[^>]*>/g, '')
          .split(',')
          .map((r: string) => r.trim())
      : [];

    // Extract the actual content by removing all metadata sections
    const metadataSections = [
      /<strong>Services<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Status<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>GA date<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Preview date<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Tags<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Platforms<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Cloud Instances<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Release Rings<\/strong>:.*?(?:<br>|<\/p>)/,
    ];

    let finalContent = content;
    metadataSections.forEach(section => {
      finalContent = finalContent.replace(section, '');
    });
    finalContent = finalContent.replace(/<[^>]*>/g, '').trim();

    return {
      id: id,
      title: item.title,
      content: finalContent,
      product: services[0] || '',
      status: status,
      published: item.pubDate,
      lastUpdated: item.pubDate,
      tags: tags,
      service: services,
      generalAvailabilityDate: gaDate,
      previewAvailabilityDate: previewDate,
      cloudInstances: cloudInstances,
      platforms: platforms,
      releaseRings: releaseRings,
    };
  } catch (error) {
    if (isDev) throw error;
    return null;
  }
}
