import type { Metadata } from 'next';
import { getMessage } from '@/lib/api.server';
import { MessageDetail } from '@/components/MessageDetail';
import { getMessageCenterAccess } from '@/lib/message-center-auth';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Message Center Update',
  robots: { index: false, follow: false },
};

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await getMessageCenterAccess();
  if (access === 'unconfigured') {
    notFound();
  }
  if (access === 'authentication-required') {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/message/${id}`)}`);
  }

  const message = await getMessage(id);

  if (!message) {
    notFound();
  }

  return <MessageDetail message={message} />;
}
