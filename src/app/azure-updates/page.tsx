import { getAzureUpdates } from '@/lib/api';
import { AzureUpdatesClient } from '@/components/AzureUpdatesClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Azure Updates | Microsoft 365 Message Center',
  description: 'Stay informed about the latest Azure updates and changes.',
};

export default async function AzureUpdatesPage() {
  const updates = await getAzureUpdates();

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AzureUpdatesClient initialUpdates={updates} />
      </div>
    </div>
  );
} 