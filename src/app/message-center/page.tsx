import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { HomeContent } from '@/components/HomeContent';
import { FilterProvider } from '@/components/FilterContext';
import { getMessages, getMessageSyncMetadata } from '@/lib/api.server';
import { getMessageCenterAccess } from '@/lib/message-center-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Microsoft 365 Message Center',
  description: 'Tenant-specific Microsoft 365 service updates and changes.',
  robots: { index: false, follow: false },
};

export default async function MessageCenterPage() {
  const access = await getMessageCenterAccess();
  if (access === 'unconfigured') {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center" role="alert">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Message Center unavailable
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Anonymous access is disabled by MESSAGE_CENTER_PUBLIC=false. Configure tenant sign-in or
          remove the override to view Message Center data.
        </p>
      </section>
    );
  }
  if (access === 'authentication-required') {
    redirect('/api/auth/signin?callbackUrl=%2Fmessage-center');
  }

  const [messages, syncMetadata] = await Promise.all([getMessages(), getMessageSyncMetadata()]);
  const formattedSyncTime = syncMetadata.lastSyncAt
    ? `${new Date(syncMetadata.lastSyncAt).toLocaleString('en-US', {
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
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Source: Microsoft Graph Message Center for the configured tenant. Message Center posts
            vary by tenant; always use your tenant&apos;s Message Center as the source of truth.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Last successful sync:{' '}
            <time className="whitespace-nowrap" dateTime={syncMetadata.lastSyncAt ?? undefined}>
              {formattedSyncTime}
            </time>
            {syncMetadata.isStale ? ' - data may be stale.' : ''}
          </p>
        </div>
        <FilterProvider>
          <HomeContent messages={messages} />
        </FilterProvider>
      </div>
    </div>
  );
}
