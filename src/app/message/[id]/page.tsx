import { getMessage } from '@/lib/api';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';

// Enable ISR for this page - revalidate every 24 hours
export const revalidate = 86400;

interface PageProps {
  params: {
    id: string;
  };
}

export default async function Page({ params }: PageProps) {
  const message = await getMessage(params.id);

  if (!message) {
    return <div>Message not found</div>;
  }

  return <MessageDetail message={message} />;
}
