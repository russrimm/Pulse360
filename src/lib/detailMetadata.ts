import type { Metadata } from 'next';
import { normalizeFeedText } from './feed/text';

interface DetailMetadataInput {
  title: string;
  description: string;
  canonicalPath: string;
}

const MAX_DESCRIPTION_LENGTH = 160;

export function buildDetailMetadata({
  title,
  description,
  canonicalPath,
}: DetailMetadataInput): Metadata {
  const cleanTitle = normalizeFeedText(title);
  const cleanDescription = truncateDescription(normalizeFeedText(description));
  const fullTitle = `${cleanTitle} | Pulse 360`;

  return {
    title: fullTitle,
    description: cleanDescription,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'article',
      title: fullTitle,
      description: cleanDescription,
      url: canonicalPath,
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description: cleanDescription,
    },
  };
}

export function buildMissingDetailMetadata(label: string): Metadata {
  return {
    title: `${label} not found | Pulse 360`,
    robots: { index: false, follow: false },
  };
}

function truncateDescription(description: string): string {
  if (description.length <= MAX_DESCRIPTION_LENGTH) return description;
  return `${description.slice(0, MAX_DESCRIPTION_LENGTH - 3).trimEnd()}...`;
}
