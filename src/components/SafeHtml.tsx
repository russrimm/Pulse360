'use client';

import DOMPurify from 'isomorphic-dompurify';
import { SANITIZE_CONFIG } from '@/lib/feed/sanitize';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const sanitized = String(DOMPurify.sanitize(html, SANITIZE_CONFIG));
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
