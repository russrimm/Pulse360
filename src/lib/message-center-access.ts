export type MessageCenterAccess = 'allowed' | 'authentication-required' | 'unconfigured';

/**
 * Tri-state reading of MESSAGE_CENTER_PUBLIC.
 *
 * - 'enabled'  -> MESSAGE_CENTER_PUBLIC=true: anonymous access, even when
 *                 interactive sign-in is configured.
 * - 'disabled' -> MESSAGE_CENTER_PUBLIC=false: never serve anonymously. With
 *                 sign-in configured that means "sign in first"; without it
 *                 there is nothing to sign in to, so the route fails closed.
 * - 'unset'    -> defer to whether interactive sign-in is configured.
 */
export type MessageCenterPublicMode = 'enabled' | 'disabled' | 'unset';

interface MessageCenterAccessContext {
  publicMode: MessageCenterPublicMode;
  isAuthConfigured: boolean;
  hasAuthenticatedUser: boolean;
}

export function parseMessageCenterPublicMode(value: string | undefined): MessageCenterPublicMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'true') return 'enabled';
  if (normalized === 'false') return 'disabled';
  return 'unset';
}

export function resolveMessageCenterAccess({
  publicMode,
  isAuthConfigured,
  hasAuthenticatedUser,
}: MessageCenterAccessContext): MessageCenterAccess {
  if (publicMode === 'enabled') {
    return 'allowed';
  }

  if (isAuthConfigured) {
    return hasAuthenticatedUser ? 'allowed' : 'authentication-required';
  }

  // No interactive sign-in provider exists, so a session can never be
  // established. Serve the route openly unless the owner explicitly opted out
  // with MESSAGE_CENTER_PUBLIC=false.
  return publicMode === 'disabled' ? 'unconfigured' : 'allowed';
}
