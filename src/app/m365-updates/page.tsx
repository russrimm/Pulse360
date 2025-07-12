import { M365UpdatesContent } from '@/components/M365UpdatesContent';
import { getM365Updates } from '@/lib/api';

export const revalidate = 3600;

export const metadata = {
  title: 'Microsoft 365 Updates | Microsoft 365 Message Center',
  description: 'Stay informed about the latest Microsoft 365 updates and changes.',
};

export default async function M365UpdatesPage() {
  const updates = await getM365Updates();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Microsoft 365 Release Plans
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay informed about the latest Microsoft 365 updates and changes.
          </p>
        </div>
        <M365UpdatesContent updates={updates} />
      </div>
    </div>
  );
} 