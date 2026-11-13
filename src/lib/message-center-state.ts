export type MessageCenterViewState =
  | 'ready'
  | 'database-not-configured'
  | 'sync-not-configured'
  | 'database-unavailable'
  | 'empty-sync';

interface MessageCenterViewInput {
  hasDatabaseUrl: boolean;
  isSyncConfigured: boolean;
  hasQueryError: boolean;
  messageCount: number;
}

/**
 * Collapses the situations that used to share one vague message into
 * distinct states so each one can explain what the visitor (or operator)
 * should do next. "Filtered to zero" is a client-side concern and is not
 * represented here.
 */
export function resolveMessageCenterViewState({
  hasDatabaseUrl,
  isSyncConfigured,
  hasQueryError,
  messageCount,
}: MessageCenterViewInput): MessageCenterViewState {
  if (!hasDatabaseUrl) return 'database-not-configured';
  if (hasQueryError) return 'database-unavailable';
  if (messageCount > 0) return 'ready';
  return isSyncConfigured ? 'empty-sync' : 'sync-not-configured';
}
