import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { HomeContent } from '@/components/HomeContent';
import { FilterProvider } from '@/components/FilterContext';
import { MessageCenterStatus } from '@/components/MessageCenterStatus';
import {
  getMessages,
  getMessageSyncMetadata,
  isMessageCenterSyncConfigured,
} from '@/lib/api.server';
import { getMessageCenterAccess } from '@/lib/message-center-auth';
import { resolveMessageCenterViewState } from '@/lib/message-center-state';

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
        <h1 className="type-h1 text-ink">Message Center unavailable</h1>
        <p className="type-body mt-3 text-ink-muted">
          Anonymous access is disabled by MESSAGE_CENTER_PUBLIC=false. Configure tenant sign-in or
          remove the override to view Message Center data.
        </p>
      </section>
    );
  }
  if (access === 'authentication-required') {
    redirect('/api/auth/signin?callbackUrl=%2Fmessage-center');
  }

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const [messagesResult, syncMetadata] = hasDatabaseUrl
    ? await Promise.all([
        getMessages().then(
          messages => ({ messages, hasError: false }),
          (error: unknown) => {
            console.error('Message Center list query failed:', error);
            return { messages: [], hasError: true };
          }
        ),
        getMessageSyncMetadata(),
      ])
    : [{ messages: [], hasError: false }, { lastSyncAt: null, isStale: true }];
  const { messages, hasError } = messagesResult;
  const viewState = resolveMessageCenterViewState({
    hasDatabaseUrl,
    isSyncConfigured: isMessageCenterSyncConfigured(),
    hasQueryError: hasError,
    messageCount: messages.length,
  });
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
        <header className="mb-6">
          <p className="type-eyebrow text-accent">Tenant</p>
          <h1 className="type-h1 mt-1 text-ink">Microsoft 365 Message Center</h1>
          <p className="type-body mt-2 max-w-3xl text-ink-muted">
            Stay informed about Microsoft 365 service updates and changes.
          </p>
          <p className="type-meta mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-subtle">
            <span>Source: Microsoft Graph Message Center for the configured tenant.</span>
            {hasDatabaseUrl ? (
              <>
                <span aria-hidden="true" className="text-line-strong">
                  &middot;
                </span>
                <span>
                  Last successful sync:{' '}
                  <time
                    className="whitespace-nowrap"
                    dateTime={syncMetadata.lastSyncAt ?? undefined}
                  >
                    {formattedSyncTime}
                  </time>
                  {syncMetadata.isStale ? ' — data may be stale.' : ''}
                </span>
              </>
            ) : null}
          </p>
          <p className="type-meta mt-1 text-ink-subtle">
            Message Center posts vary by tenant; always use your tenant&apos;s Message Center as the
            source of truth.
          </p>
        </header>
        {viewState === 'ready' ? (
          <FilterProvider>
            <HomeContent messages={messages} />
          </FilterProvider>
        ) : (
          <MessageCenterStatus state={viewState} />
        )}
      </div>
    </div>
  );
}
