import 'server-only';

import { getTenantAccess } from '@/lib/tenant-access';
import type { MessageCenterAccess } from '@/lib/message-center-access';

export async function getMessageCenterAccess(): Promise<MessageCenterAccess> {
  return getTenantAccess({ publicEnvVar: 'MESSAGE_CENTER_PUBLIC' });
}
