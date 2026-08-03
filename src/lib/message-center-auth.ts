import 'server-only';

import { getServerSession } from 'next-auth';
import { authOptions, isAuthConfigured } from '@/lib/auth';
import {
  parseMessageCenterPublicMode,
  resolveMessageCenterAccess,
  type MessageCenterAccess,
} from '@/lib/message-center-access';

export async function getMessageCenterAccess(): Promise<MessageCenterAccess> {
  const publicMode = parseMessageCenterPublicMode(process.env.MESSAGE_CENTER_PUBLIC);

  if (publicMode === 'enabled' || !isAuthConfigured) {
    return resolveMessageCenterAccess({
      publicMode,
      isAuthConfigured,
      hasAuthenticatedUser: false,
    });
  }

  const session = await getServerSession(authOptions);
  return resolveMessageCenterAccess({
    publicMode,
    isAuthConfigured,
    hasAuthenticatedUser: Boolean(session?.user),
  });
}
