import { getMessage } from '@/lib/api';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function MessagePage({ params }: Props) {
  try {
    const message = await getMessage(params.id);
    return <MessageDetail message={message} />;
  } catch (error) {
    console.error('Failed to fetch message:', error);
    notFound();
  }
} 