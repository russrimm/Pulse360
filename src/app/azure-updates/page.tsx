import { getAzureUpdates } from '@/lib/api';
import { AzureUpdatesClient } from '@/components/AzureUpdatesClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Azure Updates | Microsoft 365 Message Center',
  description: 'Stay informed about the latest Azure updates and changes.',
};

export default async function AzureUpdatesPage() {
  const updates = await getAzureUpdates();

  return <AzureUpdatesClient initialUpdates={updates} />;
} 