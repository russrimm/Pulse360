import { getMessage } from '@/lib/api';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';

// Enable ISR for this page - revalidate every 24 hours
export const revalidate = 86400;

type PageProps = {
  params: { id: string };
}

export default async function MessagePage({ params }: PageProps) {
  try {
    const message = await getMessage(params.id);
    if (!message) {
      return notFound();
    }
    return <MessageDetail message={message} />;
  } catch (error) {
    console.error('Error fetching message:', error);
    return notFound();
  }
}
