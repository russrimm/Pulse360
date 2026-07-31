import type { Message } from './types';

export function matchesMessageSearch(message: Message, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    message.id,
    message.title,
    message.content,
    message.summary,
    ...message.service,
    ...message.tags,
  ].some(value => value.toLowerCase().includes(normalizedQuery));
}
