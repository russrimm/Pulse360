import { getMessage } from '@/lib/api';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';

export default async function MessagePage({
  params,
}: {
  params: { id: string }
}) {
  try {
    const message = await getMessage(params.id);
    return <MessageDetail message={message} />;
  } catch (error) {
    console.error('Failed to fetch message:', error);
    notFound();
  }
} 