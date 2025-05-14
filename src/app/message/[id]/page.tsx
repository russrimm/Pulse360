import { getMessage } from '@/lib/api';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MessagePage({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const message = await getMessage(resolvedParams.id);
    if (!message) {
      return notFound();
    }
    return <MessageDetail message={message} />;
  } catch (error) {
    console.error('Error fetching message:', error);
    return notFound();
  }
}
