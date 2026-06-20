import 'server-only';
import { M365Update, Message } from './types';
import { XMLParser } from 'fast-xml-parser';

// Base URL without version path — supports both /v1.0 and /beta
const GRAPH_BASE_URL = process.env.AZURE_API_URL || 'https://graph.microsoft.com';
const API_KEY = process.env.AZURE_CLIENT_SECRET;
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;

// When AZURE_API_URL is set, APIM handles auth — no local credentials needed
const isApimMode = !!process.env.AZURE_API_URL;

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
const hasRequiredEnvVars = isApimMode || (API_KEY && TENANT_ID && CLIENT_ID);

/** Build a Graph API URL with version. Defaults to v1.0. */
function graphUrl(path: string, version: 'v1.0' | 'beta' = 'v1.0'): string {
  return `${GRAPH_BASE_URL}/${version}${path}`;
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

    return data.access_token;
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
    // In APIM mode, no token needed — APIM policy handles auth
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
    const MAX_PAGES = 10;
    let nextLink: string | undefined =
      graphUrl(`/admin/serviceAnnouncement/messages?$top=500&$orderby=lastModifiedDateTime desc`);

    let pageCount = 0;
    while (nextLink && pageCount < MAX_PAGES) {
      pageCount++;
      const response = await fetch(nextLink, {
        headers,
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        const errorText = await response.text();
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

    const response = await fetch(
      graphUrl(`/admin/serviceAnnouncement/messages?$filter=id eq '${id}'`),
      {
        headers,
        next: { revalidate: 86400 },
      }
    );

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
  try {
    const response = await fetch('https://releaseplans.microsoft.com/en-US/allreleaseplans/');
    if (!response.ok) {
      throw new Error('Failed to fetch release plans');
    }
    const data = await response.json();
    return data.results.map((plan: any) => ({
      id: plan['Release Plan ID'],
      title: plan['Feature name'],
      content: plan['Feature details'],
      product: plan['Product name'],
      investmentArea: plan['Investment area'],
      businessValue: plan['Business value'],
      enabledFor: plan['Enabled for'],
      publicPreviewDate: plan['Public preview date'],
      gaDate: plan['GA date'],
      publicPreviewWave: plan['Public Preview Release Wave'],
      gaWave: plan['GA Release Wave'],
      published: plan['Last Gitcommit date'],
      lastUpdated: plan['Last Gitcommit date'],
      tags: [plan['Investment area']],
      service: [plan['Product name']],
    }));
  } catch (error) {
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
