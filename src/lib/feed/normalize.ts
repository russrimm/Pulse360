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

const NAMED_HTML_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: '\u00a0',
  quot: '"',
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith('#x')) {
      return decodeCodePoint(Number.parseInt(code.slice(2), 16), entity);
    }
    if (code.startsWith('#')) {
      return decodeCodePoint(Number.parseInt(code.slice(1), 10), entity);
    }
    return NAMED_HTML_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

function decodeCodePoint(codePoint: number, fallback: string): string {
  if (!Number.isSafeInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return fallback;
  return String.fromCodePoint(codePoint);
}
