import 'server-only';

import { getServerSession } from 'next-auth';
import { authOptions, isAuthConfigured } from '@/lib/auth';
import {
  resolveMessageCenterAccess,
  type MessageCenterAccess,
} from '@/lib/message-center-access';

export async function getMessageCenterAccess(): Promise<MessageCenterAccess> {
  const isPublic = process.env.MESSAGE_CENTER_PUBLIC === 'true';

  if (isPublic || !isAuthConfigured) {
    return resolveMessageCenterAccess({
      isPublic,
      isAuthConfigured,
      hasAuthenticatedUser: false,
    });
  }

  const session = await getServerSession(authOptions);
  return resolveMessageCenterAccess({
    isPublic,
    isAuthConfigured,
    hasAuthenticatedUser: Boolean(session?.user),
  });
}
