interface FeedGuidObject {
  '#text'?: unknown;
}

export function getFeedItemId(guid: unknown, link: string): string {
  if (typeof guid === 'string' && guid.trim()) return guid.trim();

  if (guid && typeof guid === 'object') {
    const text = (guid as FeedGuidObject)['#text'];
    if (typeof text === 'string' && text.trim()) return text.trim();
  }

  return link;
}

export function getFeedTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
