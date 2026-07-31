import type { Metadata } from 'next';
import { HomeContent } from '@/components/HomeContent';
import { getMessages, getMessageSyncMetadata } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Microsoft 365 Message Center | Pulse 360',
  description: 'Search Microsoft 365 service announcements published from the configured tenant.',
};

export default async function MessageCenterPage() {
  const messages = await getMessages();
  const { lastSyncAt, isStale } = await getMessageSyncMetadata();
  const formattedSyncTime = lastSyncAt
    ? `${new Date(lastSyncAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      })} UTC`
    : 'not available';

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Microsoft 365 Message Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Stay informed about Microsoft 365 service updates and changes
          </p>
          <p className={`text-xs ${isStale ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Source: Microsoft Graph Message Center for the configured tenant. Last successful sync:{' '}
            <time dateTime={lastSyncAt ?? undefined}>{formattedSyncTime}</time>
            {isStale ? ' — data may be stale.' : ''}
          </p>
        </div>
        <HomeContent messages={messages} />
      </div>
    </div>
  );
}