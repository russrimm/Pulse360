import { getMessages } from '@/lib/api';
import { HomeContent } from '@/components/HomeContent';

export const revalidate = 604800; // Revalidate every 7 days (7 * 24 * 60 * 60)

export const metadata = {
  title: 'Microsoft Pulse 360° - Message Center',
  description: 'Stay informed about the latest updates and announcements from Microsoft.',
};

export default async function MessageCenterPage() {
  const messages = await getMessages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Message Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay informed about Microsoft 365 service updates and changes
          </p>
        </div>
        <HomeContent messages={messages} />
      </div>
    </div>
  );
} 