import { Message, MessageResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-management-instance.azure-api.net';
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

export async function getMessages(): Promise<Message[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
    }

    const data: MessageResponse = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function getMessage(id: string): Promise<Message> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Message not found: ${id}`);
      }
      throw new Error(`Failed to fetch message: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching message:', error);
    throw error;
  }
} 