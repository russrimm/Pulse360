import { Message } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://graphapirim.azure-api.net/v1.0';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'Ocp-Apim-Subscription-Key': API_KEY,
};

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
    const response = await fetch(`${API_BASE_URL}/admin/serviceAnnouncement/messages`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
    }

    const data: GraphApiResponse = await response.json();
    return data.value.map(message => ({
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
    const response = await fetch(`${API_BASE_URL}/admin/serviceAnnouncement/messages?$filter=id eq '${id}'`, {
      headers,
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