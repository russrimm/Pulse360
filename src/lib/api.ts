import { Message } from './types';

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
  clientId: CLIENT_ID
});

if (!API_KEY || !TENANT_ID || !CLIENT_ID) {
  throw new Error('Missing required environment variables. Please check your .env.local file.');
}

async function getToken(): Promise<string> {
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
      actionRequiredByDateTime: message.actionRequiredByDateTime
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function getMessage(id: string): Promise<Message> {
  try {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': API_KEY || ''
    };

    const response = await fetch(`${API_BASE_URL}/admin/serviceAnnouncement/messages?$filter=id eq '${id}'`, {
      headers
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
      actionRequiredByDateTime: message.actionRequiredByDateTime
    };
  } catch (error) {
    console.error('Error fetching message:', error);
    throw error;
  }
} 