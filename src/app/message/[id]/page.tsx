import { getMessage } from '@/lib/api';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';

// Enable ISR for this page - revalidate every 24 hours
export const revalidate = 86400;

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const message = await getMessage(id);  

  if (!message) {
    return notFound();
  }

  return <MessageDetail message={message} />;
}
