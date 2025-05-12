import { Message, MessageResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://graphapirim.azure-api.net/v1.0';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  'Ocp-Apim-Subscription-Key': API_KEY || '',
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
  body: {
    contentType: string;
    content: string;
  };
}

interface GraphApiResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string;
  value: GraphApiMessage[];
}

export async function getMessages(page = 1, limit = 10): Promise<MessageResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/serviceAnnouncement/messages?$top=${limit}&$skip=${(page - 1) * limit}`,
    { headers }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
  }
  const data: GraphApiResponse = await response.json();
  
  const messages: Message[] = data.value.map(msg => ({
    id: msg.id,
    title: msg.title,
    service: msg.services,
    lastUpdated: msg.lastModifiedDateTime,
    published: msg.startDateTime,
    tags: msg.tags,
    content: msg.body.content
  }));

  return {
    messages,
    total: messages.length
  };
}

export async function getMessage(id: string): Promise<Message> {
  const response = await fetch(
    `${API_BASE_URL}/admin/serviceAnnouncement/messages/${id}`,
    { headers }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch message: ${response.status} ${response.statusText}`);
  }
  const data: GraphApiMessage = await response.json();
  
  return {
    id: data.id,
    title: data.title,
    service: data.services,
    lastUpdated: data.lastModifiedDateTime,
    published: data.startDateTime,
    tags: data.tags,
    content: data.body.content
  };
} 