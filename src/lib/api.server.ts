import 'server-only';
import { M365Update, Message, MessageStatus } from './types';
import { getPrisma } from './prisma';
import type { MessageCenterUpdate, Prisma } from '@/generated/prisma';
import { XMLParser } from 'fast-xml-parser';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseGraphDate } from './graph';

// Base URL without version path — supports both /v1.0 and /beta
const RAW_AZURE_API_URL = process.env.AZURE_API_URL?.trim();
const DIRECT_GRAPH_BASE_URL = 'https://graph.microsoft.com';
const GRAPH_REQUEST_TIMEOUT_MS = 15_000;

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
  const rows = await prisma.messageCenterUpdate.findMany({
    select: messageListSelect,
    orderBy: { lastUpdated: 'desc' },
  });

  // Vercel Cron (see vercel.json → /api/cron/sync-messages) is the baseline
  // sync path. On-demand sync here is a safety net:
  //   - DB has rows: fire-and-forget so page loads never block on Graph.
  //   - DB empty (first-ever deploy or wipe): block once so users don't see
  //     an empty screen before cron fires.
  if (rows.length === 0) {
    await ensureMessagesSynced();
    const rehydrated = await prisma.messageCenterUpdate.findMany({
      select: messageListSelect,
      orderBy: { lastUpdated: 'desc' },
    });
    return rehydrated.map(rowToListMessage);
  }

  void ensureMessagesSynced().catch(() => undefined);
  return rows.map(rowToListMessage);
}

export async function getMessageSyncMetadata(): Promise<{
  lastSyncAt: string | null;
  isStale: boolean;
}> {
  const state = await getPrisma().syncState.findUnique({
    where: { key: MESSAGE_CENTER_SYNC_KEY },
    select: { lastSyncAt: true },
  });
  const lastSyncAt = state?.lastSyncAt ?? null;

  return {
    lastSyncAt: lastSyncAt?.toISOString() ?? null,
    isStale: !lastSyncAt || Date.now() - lastSyncAt.getTime() > MESSAGE_CENTER_STALE_MS,
  };
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

  let pageCount = 0;
  while (nextLink && pageCount < MAX_PAGES) {
    pageCount++;
    const response = await fetch(nextLink, {
      headers,
      // Persistence is our cache now; skip Next's fetch cache.
      cache: 'no-store',
      signal: AbortSignal.timeout(GRAPH_REQUEST_TIMEOUT_MS),
    });

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
  const row = await getPrisma().messageCenterUpdate.findUnique({ where: { id } });
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
    const state = await prisma.syncState.findUnique({
      where: { key: MESSAGE_CENTER_SYNC_KEY },
    });
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
    prisma.messageCenterUpdate.count({ where: { status: 'active' } }),
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
    await prisma.$transaction([
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
    ]);
  }

  // Mark any previously-active rows that Graph no longer returns.
  const stale = await prisma.messageCenterUpdate.findMany({
    where: {
      status: 'active',
      id: { notIn: Array.from(seenIds) },
      lastSeenAt: { lt: syncStartedAt },
    },
    select: { id: true, actionRequiredByDateTime: true },
  });

  if (stale.length > 0) {
    await prisma.$transaction(
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
    );
  }

  // Also flip still-in-Graph but past-due rows to expired.
  await prisma.messageCenterUpdate.updateMany({
    where: {
      status: 'active',
      actionRequiredByDateTime: { lt: now },
    },
    data: { status: 'expired' },
  });

  await prisma.syncState.upsert({
    where: { key: MESSAGE_CENTER_SYNC_KEY },
    create: { key: MESSAGE_CENTER_SYNC_KEY, lastSyncAt: now, lastError: null },
    update: { lastSyncAt: now, lastError: null },
  });
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

// In-memory cache for release-planner product responses. Sidesteps Next.js's
// 2MB Data Cache entry limit (which logs a warning and skips caching for the
// large Dynamics 365 product payload).
interface ReleasePlannerProductCacheEntry {
  plans: unknown[];
  cachedAt: number;
}
const RELEASE_PLANNER_MEMORY_TTL_MS = 60 * 60 * 1000;
const releasePlannerMemoryCache = new Map<string, ReleasePlannerProductCacheEntry>();

export async function getReleasePlans() {
  interface ReleasePlanProduct {
    id: string;
    name: string;
  }

  interface ReleasePlanApiItem {
    ReleasePlanID?: string;
    'Release Plan ID'?: string;
    FeatureName?: string;
    'Feature name'?: string;
    FeatureDetails?: string;
    'Feature details'?: string;
    Product?: string;
    'Product name'?: string;
    ProductArea?: string;
    'Investment area'?: string;
    BusinessValue?: string;
    'Business value'?: string;
    EnabledFor?: string;
    'Enabled for'?: string;
    PublicPreviewDate?: string;
    'Public preview date'?: string;
    GADate?: string;
    'GA date'?: string;
    ReleaseWaveName?: string;
    'Public Preview Release Wave'?: string;
    GAReleaseWaveName?: string;
    'GA Release Wave'?: string;
    GitCommitDate?: string;
    'Last Gitcommit date'?: string;
    Createdon?: string;
  }

  interface ReleasePlanApiPayload {
    results?: ReleasePlanApiItem[];
  }

  interface EmptyProductCacheEntry {
    emptyAt: number;
    productName: string;
  }

  interface EmptyProductCacheFile {
    updatedAt: number;
    products: Record<string, EmptyProductCacheEntry>;
  }

  const PRODUCT_CATALOG: ReleasePlanProduct[] = [
    { id: 'bb2f17ac-715d-e911-a968-000d3a4e32b5', name: 'Dynamics 365 Sales' },
    { id: 'bf2f17ac-715d-e911-a968-000d3a4e32b5', name: 'Dynamics 365 Customer Service' },
    { id: '656ef9c3-c601-ef11-a1fd-6045bdfe3ffa', name: 'Dynamics 365 Contact Center' },
    { id: 'c12f17ac-715d-e911-a968-000d3a4e32b5', name: 'Dynamics 365 Field Service' },
    { id: '3938c1dd-9c6d-f011-bec2-7c1e521724c0', name: 'Microsoft Sustainability Manager' },
    { id: '50a470c0-d3b7-e911-a992-000d3a4f3343', name: 'Dynamics 365 Finance' },
    {
      id: 'e30c6971-52c8-e911-a968-000d3a4f3883',
      name: 'Finance and Operations cross-app capabilities',
    },
    { id: 'e1a941d5-d3b7-e911-a992-000d3a4f3343', name: 'Dynamics 365 Supply Chain Management' },
    { id: '1304b79a-d3b7-e911-a992-000d3a4f3343', name: 'Dynamics 365 Project Operations' },
    { id: '92fdd980-d3b7-e911-a992-000d3a4f3343', name: 'Dynamics 365 Human Resources' },
    { id: '03283a34-cab7-e911-a963-000d3a4f3883', name: 'Dynamics 365 Commerce' },
    { id: 'c92f17ac-715d-e911-a968-000d3a4e32b5', name: 'Dynamics 365 Business Central' },
    { id: '1480bbd4-7256-ee11-be6f-000d3a574715', name: 'Dynamics 365 Customer Insights - Data' },
    {
      id: '940fa520-7756-ee11-be6f-000d3a574715',
      name: 'Dynamics 365 Customer Insights - Journeys',
    },
    { id: 'e72f17ac-715d-e911-a968-000d3a4e32b5', name: 'Power Apps' },
    { id: '1197f7de-0a44-ec11-8c62-00224829b77f', name: 'Power Pages' },
    { id: 'e92f17ac-715d-e911-a968-000d3a4e32b5', name: 'Power Automate' },
    { id: '1019ec3d-1dc5-e911-a969-000d3a4f36ce', name: 'Microsoft Copilot Studio' },
    { id: 'eb2f17ac-715d-e911-a968-000d3a4e32b5', name: 'AI Builder' },
    { id: 'a0e02858-50a4-ea11-a812-000d3a8faea9', name: 'Microsoft Dataverse' },
    {
      id: 'dbedfa94-1517-ea11-a811-000d3a8f010c',
      name: 'Microsoft Power Platform governance and administration',
    },
    { id: '17d1affa-8c85-ee11-8179-00224827e88b', name: 'Microsoft 365 Copilot for Sales' },
    { id: '56ba60c1-005c-ee11-be6f-000d3a4e5de0', name: 'Finance agents in Microsoft 365' },
  ];

  const RELEASE_PLANNER_LANG = 'en-US';
  const RELEASE_PLANNER_TIMEOUT_MS = 12000;
  const EMPTY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const EMPTY_CACHE_PATH = join(process.cwd(), '.cache', 'release-planner-empty-products.json');

  async function readEmptyCache(): Promise<EmptyProductCacheFile> {
    try {
      const raw = await readFile(EMPTY_CACHE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<EmptyProductCacheFile>;
      if (!parsed.products || typeof parsed.products !== 'object') {
        return { updatedAt: Date.now(), products: {} };
      }

      const now = Date.now();
      const activeProducts: Record<string, EmptyProductCacheEntry> = {};
      for (const [productId, entry] of Object.entries(parsed.products)) {
        if (!entry || typeof entry.emptyAt !== 'number') continue;
        if (now - entry.emptyAt <= EMPTY_CACHE_TTL_MS) {
          activeProducts[productId] = {
            emptyAt: entry.emptyAt,
            productName: typeof entry.productName === 'string' ? entry.productName : '',
          };
        }
      }

      return {
        updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : now,
        products: activeProducts,
      };
    } catch {
      return { updatedAt: Date.now(), products: {} };
    }
  }

  async function writeEmptyCache(cache: EmptyProductCacheFile): Promise<void> {
    try {
      await mkdir(dirname(EMPTY_CACHE_PATH), { recursive: true });
      await writeFile(EMPTY_CACHE_PATH, JSON.stringify(cache), 'utf8');
    } catch {
      // Non-fatal: caching is best-effort.
    }
  }

  function parseReleasePlannerPayload(rawBody: string): ReleasePlanApiPayload {
    try {
      return JSON.parse(rawBody) as ReleasePlanApiPayload;
    } catch {
      if (/"results"\s*:\s*\[\s*\]/i.test(rawBody)) {
        return { results: [] };
      }
      throw new Error('Malformed release planner JSON payload');
    }
  }

  function mapReleasePlan(plan: ReleasePlanApiItem) {
    const id = plan.ReleasePlanID ?? plan['Release Plan ID'] ?? '';
    const title = plan.FeatureName ?? plan['Feature name'] ?? '';
    const content = plan.FeatureDetails ?? plan['Feature details'] ?? '';
    const product = plan.Product ?? plan['Product name'] ?? '';
    const investmentArea = plan.ProductArea ?? plan['Investment area'] ?? '';
    const businessValue = plan.BusinessValue ?? plan['Business value'] ?? '';
    const enabledFor = plan.EnabledFor ?? plan['Enabled for'] ?? '';
    const publicPreviewDate = plan.PublicPreviewDate ?? plan['Public preview date'] ?? '';
    const gaDate = plan.GADate ?? plan['GA date'] ?? '';
    const publicPreviewWave = plan.ReleaseWaveName ?? plan['Public Preview Release Wave'] ?? '';
    const gaWave = plan.GAReleaseWaveName ?? plan['GA Release Wave'] ?? '';
    const commitDate = plan.GitCommitDate ?? plan['Last Gitcommit date'] ?? plan.Createdon ?? '';

    return {
      id,
      title,
      content,
      product,
      investmentArea,
      businessValue,
      enabledFor,
      publicPreviewDate,
      gaDate,
      publicPreviewWave,
      gaWave,
      published: commitDate,
      lastUpdated: commitDate,
      tags: investmentArea ? [investmentArea] : [],
      service: product ? [product] : [],
    };
  }

  try {
    const emptyCache = await readEmptyCache();
    const candidateProducts = PRODUCT_CATALOG.filter(product => !emptyCache.products[product.id]);
    const productResults = await Promise.all(
      candidateProducts.map(async product => {
        const cached = releasePlannerMemoryCache.get(product.id);
        if (cached && Date.now() - cached.cachedAt < RELEASE_PLANNER_MEMORY_TTL_MS) {
          return { product, plans: cached.plans as ReleasePlanApiItem[], failed: false };
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), RELEASE_PLANNER_TIMEOUT_MS);

        try {
          const url = `https://releaseplans.microsoft.com/releaseplanner-json/?langCode=${RELEASE_PLANNER_LANG}&productId=${product.id}`;
          const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            // Deliberately no `next: { revalidate }` — some product payloads
            // exceed Next.js's 2MB Data Cache entry limit. We cache in-memory
            // above instead.
            cache: 'no-store',
          });

          if (!response.ok) {
            return { product, plans: [], failed: true };
          }

          const body = await response.text();
          const payload = parseReleasePlannerPayload(body);
          const plans = Array.isArray(payload.results) ? payload.results : [];

          releasePlannerMemoryCache.set(product.id, { plans, cachedAt: Date.now() });

          return { product, plans, failed: false };
        } catch {
          return { product, plans: [], failed: true };
        } finally {
          clearTimeout(timeout);
        }
      })
    );

    const now = Date.now();
    for (const result of productResults) {
      if (result.failed) continue;
      if (result.plans.length === 0) {
        emptyCache.products[result.product.id] = {
          emptyAt: now,
          productName: result.product.name,
        };
      } else {
        delete emptyCache.products[result.product.id];
      }
    }
    emptyCache.updatedAt = now;
    await writeEmptyCache(emptyCache);

    const deduped = new Map<string, ReturnType<typeof mapReleasePlan>>();
    for (const result of productResults) {
      for (const rawPlan of result.plans) {
        const mapped = mapReleasePlan(rawPlan);
        const dedupeKey =
          mapped.id ||
          [mapped.product, mapped.title, mapped.publicPreviewDate, mapped.gaDate]
            .join('|')
            .toLowerCase();

        if (!deduped.has(dedupeKey)) {
          deduped.set(dedupeKey, mapped);
        }
      }
    }

    if (deduped.size > 0) {
      return Array.from(deduped.values());
    }

    // Last-resort fallback to the legacy endpoint.
    const legacyResponse = await fetch(
      'https://releaseplans.microsoft.com/en-US/allreleaseplans/',
      {
        next: { revalidate: 3600 },
      }
    );
    if (!legacyResponse.ok) {
      return [];
    }
    const legacyData = (await legacyResponse.json()) as ReleasePlanApiPayload;
    if (!Array.isArray(legacyData.results)) {
      return [];
    }
    return legacyData.results.map(mapReleasePlan);
  } catch {
    return [];
  }
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
