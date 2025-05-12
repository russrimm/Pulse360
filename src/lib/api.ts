import { Message, MessageResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mc.merill.net/api';

export async function getMessages(page = 1, limit = 10): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/messages?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
}

export async function getMessage(id: string): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/messages/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch message');
  }
  return response.json();
} 