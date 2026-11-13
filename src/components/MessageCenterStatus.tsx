import Link from 'next/link';
import type { MessageCenterViewState } from '@/lib/message-center-state';

type StatusState = Exclude<MessageCenterViewState, 'ready'>;

interface StatusCopy {
  title: string;
  body: string;
  tone: 'warn' | 'neutral';
  showRetry: boolean;
}

const STATUS_COPY: Record<StatusState, StatusCopy> = {
  'database-not-configured': {
    title: 'Message Center storage is not configured',
    body: 'Message Center stores synced posts in Postgres. Set DATABASE_URL (see .env.example) and restart to enable it.',
    tone: 'neutral',
    showRetry: false,
  },
  'sync-not-configured': {
    title: 'Message Center sync is not configured',
    body: 'The database is connected, but Microsoft Graph credentials are missing. Set AZURE_CLIENT_ID, AZURE_TENANT_ID and AZURE_CLIENT_SECRET, or point AZURE_API_URL at your API Management gateway.',
    tone: 'neutral',
    showRetry: false,
  },
  'database-unavailable': {
    title: 'Message Center is temporarily unavailable',
    body: 'We could not reach the database. It may be waking up from idle. Try again in a few seconds.',
    tone: 'warn',
    showRetry: true,
  },
  'empty-sync': {
    title: 'No Message Center posts have synced yet',
    body: 'The first sync has not returned any posts. Check back after the next scheduled sync.',
    tone: 'neutral',
    showRetry: true,
  },
};

interface MessageCenterStatusProps {
  state: StatusState;
}

export function MessageCenterStatus({ state }: MessageCenterStatusProps) {
  const copy = STATUS_COPY[state];
  const toneClass =
    copy.tone === 'warn'
      ? 'border-warn/30 bg-warn-soft text-warn-ink'
      : 'border-line bg-surface text-ink';

  return (
    <div
      className={`rounded-xl border px-6 py-8 text-center ${toneClass}`}
      role={copy.tone === 'warn' ? 'alert' : 'status'}
      data-message-center-state={state}
    >
      <h2 className="type-h3">{copy.title}</h2>
      <p className="type-body-sm mx-auto mt-2 max-w-xl">{copy.body}</p>
      {copy.showRetry ? (
        <Link
          href="/message-center"
          prefetch={false}
          className="type-body-sm mt-4 inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Try again
        </Link>
      ) : null}
    </div>
  );
}
