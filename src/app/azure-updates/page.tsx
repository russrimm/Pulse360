import { getAzureUpdates } from '@/lib/api';
import { AzureUpdatesContent } from '@/components/AzureUpdatesContent';

export const revalidate = 3600; // Revalidate every hour

export const metadata = {
  title: 'Azure Updates | Microsoft 365 Message Center',
  description: 'Stay informed about the latest Azure updates and changes.',
};

export default async function AzureUpdatesPage() {
  const updates = await getAzureUpdates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Azure Updates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay informed about the latest Azure updates and changes.
          </p>
        </div>
        <AzureUpdatesContent updates={updates} />
      </div>
    </div>
  );
} 