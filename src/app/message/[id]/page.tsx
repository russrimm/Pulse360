import { getMessage } from '@/lib/api';
import { MessageDetail } from '@/components/MessageDetail';
import { notFound } from 'next/navigation';

// Enable ISR for this page - revalidate every 24 hours
export const revalidate = 86400;

/* This should stay like this
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  };
*/

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  };

/* This should stay like this
export default async function MessagePage({ params }: PageProps) {
  const resolvedParams = await params;
  const 
*/

export default async function MessagePage({ params }: PageProps) {
  const resolvedParams = await params;
  const message = await getMessage(resolvedParams.id);  

  if (!message) {
    return notFound();
  }

  return <MessageDetail message={message} />;
}
