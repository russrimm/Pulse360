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
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Stay informed about Microsoft 365 service updates and changes
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <HomeContent messages={messages} />
        </div>
      </div>
    </div>
  );
} 