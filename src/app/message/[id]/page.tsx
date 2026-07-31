import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { MessageDetail } from '@/components/MessageDetail';
import { getMessage } from '@/lib/api.server';
import { getMessageCenterAccess } from '@/lib/message-center-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Message Center Update',
  robots: { index: false, follow: false },
};

interface MessagePageProps {
  params: Promise<{ id: string }>;
}

const getCachedMessage = cache(getMessage);

export default async function MessagePage({ params }: MessagePageProps) {
  const { id } = await params;
  const access = await getMessageCenterAccess();
  if (access === 'unconfigured') notFound();
  if (access === 'authentication-required') {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/message/${id}`)}`);
  }

  const message = await getCachedMessage(id);
  if (!message) notFound();

  return <MessageDetail message={message} />;
}
