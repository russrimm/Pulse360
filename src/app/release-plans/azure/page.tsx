import { getAzureUpdates } from '@/lib/api';
import { AzureUpdatesClient } from '@/components/AzureUpdatesClient';

export const revalidate = 3600;

export const metadata = { 
  title: 'Azure Updates | Pulse 360',
  description: 'Stay informed about the latest Azure platform changes and service feature updates.'
};

export default async function AzureUpdatesEmbeddedPage() {
  const updates = await getAzureUpdates();
  return (
    <main className="min-h-screen bg-white dark:bg-black pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="sr-only">Azure Updates</h1>
        <AzureUpdatesClient initialUpdates={updates} />
      </div>
    </main>
  );
}
