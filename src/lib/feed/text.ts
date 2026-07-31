import { decodeHtmlEntities } from './normalize';
import { stripHtml } from './sanitize';

export function normalizeFeedText(value: string): string {
  return decodeHtmlEntities(stripHtml(value));
}
