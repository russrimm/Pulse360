import { getMessage } from '@/lib/api.server';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { buildDetailMetadata, buildMissingDetailMetadata } from '@/lib/detailMetadata';

// Enable ISR for this page - revalidate every 24 hours
export const revalidate = 86400;

interface MessagePageProps {
  params: Promise<{ id: string }>;
}

const getCachedMessage = cache(getMessage);

export async function generateMetadata({ params }: MessagePageProps): Promise<Metadata> {
  const { id } = await params;
  const message = await getCachedMessage(id);
  if (!message) return buildMissingDetailMetadata('Message');

  return buildDetailMetadata({
    title: message.title,
    description: message.summary || message.content,
    canonicalPath: `/message/${id}`,
  });
}

export default async function MessagePage({ params }: MessagePageProps) {
  const { id } = await params;
  const message = await getCachedMessage(id);

  if (!message) {
    return notFound();
  }

  return <MessageDetail message={message} />;
}
