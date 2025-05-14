import { MessageList } from '@/components/MessageList';
import { getMessages } from '@/lib/api';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const messages = await getMessages();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
      <div className="relative">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to the Message Center
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Stay informed about the latest updates and announcements from Microsoft 365. Browse through our comprehensive archive of messages.
              </p>
            </div>
            <MessageList messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
} 