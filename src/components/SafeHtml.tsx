'use client';

import sanitizeHtml from 'sanitize-html';
import { SANITIZE_CONFIG } from '@/lib/feed/sanitize';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const sanitized = sanitizeHtml(html, SANITIZE_CONFIG);
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
