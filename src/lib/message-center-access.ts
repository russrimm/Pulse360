export type MessageCenterAccess = 'allowed' | 'authentication-required' | 'unconfigured';

interface MessageCenterAccessContext {
  isPublic: boolean;
  isAuthConfigured: boolean;
  hasAuthenticatedUser: boolean;
}

export function resolveMessageCenterAccess({
  isPublic,
  isAuthConfigured,
  hasAuthenticatedUser,
}: MessageCenterAccessContext): MessageCenterAccess {
  if (isPublic) {
    return 'allowed';
  }

  if (!isAuthConfigured) {
    return 'unconfigured';
  }

  return hasAuthenticatedUser ? 'allowed' : 'authentication-required';
}
