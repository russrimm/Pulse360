import { Message, M365Update } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://graphapirim.azure-api.net/v1.0';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

// Debug environment variables
console.log('Environment variables:', {
  hasApiUrl: !!API_BASE_URL,
  hasApiKey: !!API_KEY,
  hasTenantId: !!TENANT_ID,
  hasClientId: !!CLIENT_ID,
  tenantId: TENANT_ID,
  clientId: CLIENT_ID,
  environment: process.env.NODE_ENV
});

// Only throw in development
if (process.env.NODE_ENV === 'development' && (!API_KEY || !TENANT_ID || !CLIENT_ID)) {
  throw new Error('Missing required environment variables. Please check your .env.local file.');
}

// In production, return empty data instead of throwing
const hasRequiredEnvVars = API_KEY && TENANT_ID && CLIENT_ID;

async function getToken(): Promise<string> {
  if (!hasRequiredEnvVars) {
    throw new Error('Missing required environment variables');
  }

  try {
    const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    console.log('Getting token from:', tokenEndpoint);
    
    const params = new URLSearchParams();
    if (CLIENT_ID) params.append('client_id', CLIENT_ID);
    params.append('scope', 'https://graph.microsoft.com/.default');
    if (API_KEY) params.append('client_secret', API_KEY);
    params.append('grant_type', 'client_credentials');

    console.log('Token request params:', {
      client_id: CLIENT_ID,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
      has_client_secret: !!API_KEY
    });
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        endpoint: tokenEndpoint,
        params: Object.fromEntries(params.entries())
      });
      throw new Error(`Failed to get token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
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
    console.error('Missing required environment variables in production');
    return [];
  }

  try {
    const token = await getToken();
    let allMessages: GraphApiMessage[] = [];
    let nextLink: string | undefined = `${API_BASE_URL}/admin/serviceAnnouncement/messages`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': API_KEY || ''
    };

    console.log('Making API call to:', nextLink);
    console.log('With headers:', {
      ...headers,
      'Authorization': 'Bearer ***',
      'Ocp-Apim-Subscription-Key': '***'
    });

    while (nextLink) {
      const response = await fetch(nextLink, {
        headers: {
          ...headers,
          'Cache-Control': 'public, max-age=604800' // 7 days in seconds
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: nextLink,
          errorBody: errorText
        });
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText} - ${errorText}`);
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
      severity: message.severity
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function getMessage(id: string): Promise<Message> {
  if (!hasRequiredEnvVars) {
    throw new Error('Message not found');
  }

  try {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': API_KEY || '',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    };

    const response = await fetch(`${API_BASE_URL}/admin/serviceAnnouncement/messages?$filter=id eq '${id}'`, {
      headers,
      next: { revalidate: 86400 } // Enable Next.js cache for 24 hours
    });

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
      details: message.details?.filter(detail => !['RoadmapIds', 'FeatureStatusJson'].includes(detail.name)) || [],
      isMajorChange: message.isMajorChange || false,
      actionRequiredByDateTime: message.actionRequiredByDateTime,
      severity: message.severity
    };
  } catch (error) {
    console.error('Error fetching message:', error);
    throw error;
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
      service: [plan['Product name']]
    }));
  } catch (error) {
    console.error('Error fetching release plans:', error);
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
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error('Error fetching Azure updates:', error);
    throw error;
  }
}

export async function getM365Updates(): Promise<M365Update[]> {
  try {
    const response = await fetch('https://www.microsoft.com/releasecommunications/api/v2/m365', {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response products:', data.value[0]?.products); // Log the first update's products
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
    console.error('Error fetching Microsoft 365 updates:', error);
    throw error;
  }
}

export async function getM365Update(id: string): Promise<M365Update> {
  try {
    const response = await fetch(`https://www.microsoft.com/releasecommunications/api/v2/m365/${id}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.id.toString(),
      title: data.title,
      content: data.description,
      product: data.products?.[0] || '',
      status: data.status,
      published: data.created,
      lastUpdated: data.modified,
      tags: data.tags || [],
      service: data.products || [],
      generalAvailabilityDate: data.generalAvailabilityDate,
      previewAvailabilityDate: data.previewAvailabilityDate,
      cloudInstances: data.cloudInstances || [],
      platforms: data.platforms || [],
      releaseRings: data.releaseRings || [],
    };
  } catch (error) {
    console.error('Error fetching Microsoft 365 update:', error);
    throw error;
  }
} 