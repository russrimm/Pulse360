import 'server-only';
import { M365Update, Message } from './types';
import { XMLParser } from 'fast-xml-parser';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Base URL without version path — supports both /v1.0 and /beta
const RAW_AZURE_API_URL = process.env.AZURE_API_URL?.trim();
const DIRECT_GRAPH_BASE_URL = 'https://graph.microsoft.com';

function normalizeApiBaseUrl(url?: string): string {
  if (!url) {
    return DIRECT_GRAPH_BASE_URL;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Allow bare host values in env vars (common in local/codespaces setup)
  return `https://${url}`;
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

if (!isApimMode && process.env.NODE_ENV === 'development' && (!API_KEY || !TENANT_ID || !CLIENT_ID)) {
  const missing: string[] = [];
  if (!API_KEY) missing.push('AZURE_CLIENT_SECRET');
  if (!TENANT_ID) missing.push('AZURE_TENANT_ID');
  if (!CLIENT_ID) missing.push('AZURE_CLIENT_ID');
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. Please check your .env.local file.`
  );
}

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
    return /InvalidAuthenticationToken/i.test(errorText) && /access token is empty/i.test(errorText);
  }
}

async function getToken(): Promise<string> {
  if (!hasRequiredEnvVars) {
    const missing = [];
    if (!API_KEY) missing.push('AZURE_CLIENT_SECRET');
    if (!TENANT_ID) missing.push('AZURE_TENANT_ID');
    if (!CLIENT_ID) missing.push('AZURE_CLIENT_ID');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  try {
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

    const data = await response.json();

    if (!data.access_token) {
      throw new Error(
        `Azure AD returned no access_token. Response: ${JSON.stringify({ error: data.error, error_description: data.error_description })}`
      );
    }

    const accessToken = typeof data.access_token === 'string' ? data.access_token.trim() : '';
    if (!accessToken) {
      throw new Error('Azure AD returned an empty access_token.');
    }

    return accessToken;
  } catch (error) {
    throw error;
  }
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

export async function getMessages(): Promise<Message[]> {
  if (!hasRequiredEnvVars) {
    return [];
  }

  try {
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
        next: { revalidate: 3600 },
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
      allMessages = [...allMessages, ...data.value];
      nextLink = data['@odata.nextLink'];
    }

    return allMessages.map(message => ({
      id: message.id,
      title: message.title,
      service: message.services,
      lastUpdated: message.lastModifiedDateTime,
      published: message.startDateTime,
      tags: message.tags,
      content: message.body.content,
      summary: message.details?.find(v => v.name === 'Summary')?.value || '',
      details: message.details || [],
      isMajorChange: message.isMajorChange || false,
      actionRequiredByDateTime: message.actionRequiredByDateTime,
      severity: message.severity,
    }));
  } catch (error) {
    if (isDev) throw error;
    return [];
  }
}

export async function getMessage(id: string): Promise<Message | null> {
  if (!hasRequiredEnvVars) {
    if (isDev) throw new Error('Message not found');
    return null;
  }

  try {
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
      next: { revalidate: 86400 },
    });

    if (isApimMode && hasLocalCredentials && response.status === 401) {
      const errorText = await response.text();
      if (isEmptyAccessTokenGraphError(errorText)) {
        const token = await getToken();
        headers['Authorization'] = `Bearer ${token}`;
        requestBaseUrl = DIRECT_GRAPH_BASE_URL;
        response = await fetch(graphUrl(requestPath, 'v1.0', requestBaseUrl), {
          headers,
          next: { revalidate: 86400 },
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
      throw new Error(`Message not found: ${id}`);
    }

    const message = data.value[0];
    return {
      id: message.id,
      title: message.title,
      service: message.services,
      lastUpdated: message.lastModifiedDateTime,
      published: message.startDateTime,
      tags: message.tags,
      content: message.body.content,
      summary: message.details?.find(v => v.name === 'Summary')?.value || '',
      details:
        message.details?.filter(
          detail => !['RoadmapIds', 'FeatureStatusJson'].includes(detail.name)
        ) || [],
      isMajorChange: message.isMajorChange || false,
      actionRequiredByDateTime: message.actionRequiredByDateTime,
      severity: message.severity,
    };
  } catch (error) {
    if (isDev) throw error;
    return null;
  }
}

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
    { id: 'e30c6971-52c8-e911-a968-000d3a4f3883', name: 'Finance and Operations cross-app capabilities' },
    { id: 'e1a941d5-d3b7-e911-a992-000d3a4f3343', name: 'Dynamics 365 Supply Chain Management' },
    { id: '1304b79a-d3b7-e911-a992-000d3a4f3343', name: 'Dynamics 365 Project Operations' },
    { id: '92fdd980-d3b7-e911-a992-000d3a4f3343', name: 'Dynamics 365 Human Resources' },
    { id: '03283a34-cab7-e911-a963-000d3a4f3883', name: 'Dynamics 365 Commerce' },
    { id: 'c92f17ac-715d-e911-a968-000d3a4e32b5', name: 'Dynamics 365 Business Central' },
    { id: '1480bbd4-7256-ee11-be6f-000d3a574715', name: 'Dynamics 365 Customer Insights - Data' },
    { id: '940fa520-7756-ee11-be6f-000d3a574715', name: 'Dynamics 365 Customer Insights - Journeys' },
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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), RELEASE_PLANNER_TIMEOUT_MS);

        try {
          const url = `https://releaseplans.microsoft.com/releaseplanner-json/?langCode=${RELEASE_PLANNER_LANG}&productId=${product.id}`;
          const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            next: { revalidate: 3600 },
          });

          if (!response.ok) {
            return { product, plans: [], failed: true };
          }

          const body = await response.text();
          const payload = parseReleasePlannerPayload(body);
          const plans = Array.isArray(payload.results) ? payload.results : [];

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
          [mapped.product, mapped.title, mapped.publicPreviewDate, mapped.gaDate].join('|').toLowerCase();

        if (!deduped.has(dedupeKey)) {
          deduped.set(dedupeKey, mapped);
        }
      }
    }

    if (deduped.size > 0) {
      return Array.from(deduped.values());
    }

    // Last-resort fallback to the legacy endpoint.
    const legacyResponse = await fetch('https://releaseplans.microsoft.com/en-US/allreleaseplans/', {
      next: { revalidate: 3600 },
    });
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

export async function getM365Updates(): Promise<M365Update[]> {
  try {
    const response = await fetch('https://www.microsoft.com/releasecommunications/api/v2/m365', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value.map((update: any) => ({
      id: update.id.toString(),
      title: update.title,
      content: update.description,
      product: update.products?.[0] || '',
      status: update.status,
      published: update.created,
      lastUpdated: update.modified,
      tags: update.tags || [],
      service: update.products || [],
      generalAvailabilityDate: update.generalAvailabilityDate,
      previewAvailabilityDate: update.previewAvailabilityDate,
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
  try {
    const response = await fetch(
      `https://www.microsoft.com/releasecommunications/api/v2/m365/rss/${id}`,
      {
        cache: 'no-store',
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
