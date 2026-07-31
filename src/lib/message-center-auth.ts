import 'server-only';

import { getServerSession } from 'next-auth';
import { authOptions, isAuthConfigured } from '@/lib/auth';

export type MessageCenterAccess = 'allowed' | 'authentication-required' | 'unconfigured';

export async function getMessageCenterAccess(): Promise<MessageCenterAccess> {
  if (process.env.MESSAGE_CENTER_PUBLIC === 'true') {
    return 'allowed';
  }

  if (!isAuthConfigured) {
    return process.env.NODE_ENV === 'production' ? 'unconfigured' : 'allowed';
  }

  const session = await getServerSession(authOptions);
  return session?.user ? 'allowed' : 'authentication-required';
}
