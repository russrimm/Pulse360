import { getMessages } from '@/lib/api';
import { MessageCard } from '@/components/MessageCard';
import { ProductFilter } from '@/components/ProductFilter';
import { Message } from '@/lib/types';
import { MessageList } from '@/components/MessageList';

export default async function Home() {
  let messages: Message[] = [];
  let error = null;

  try {
    messages = await getMessages();
  } catch (e) {
    console.error('Failed to fetch messages:', e);
    error = e instanceof Error ? e.message : 'Failed to fetch messages';
  }

  return (
    <main>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Message Center</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Stay informed about the latest updates and announcements from Microsoft 365.
          </p>
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading messages</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No messages</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by checking back later for new announcements.</p>
          </div>
        ) : (
          <MessageList initialMessages={messages} />
        )}
      </div>
    </main>
  );
} 