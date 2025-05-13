import { getMessage } from '@/lib/api';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';

interface MessagePageProps {
  params: {
    id: string;
  };
}

export default async function MessagePage({ params }: MessagePageProps) {
  try {
    const message = await getMessage(params.id);
    return <MessageDetail message={message} />;
  } catch (error) {
    console.error('Failed to fetch message:', error);
    notFound();
  }
} 