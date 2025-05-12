import { Message, MessageResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://graphapirim.azure-api.net/v1.0';

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
  const response = await fetch(`${API_BASE_URL}/admin/serviceAnnouncement/messages?$top=${limit}&$skip=${(page - 1) * limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
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
    total: messages.length // Note: This is just the current page count. You might want to get total count from headers
  };
}

export async function getMessage(id: string): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/admin/serviceAnnouncement/messages/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch message');
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