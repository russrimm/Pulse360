import 'server-only';

import { getTenantAccess, type TenantAccess } from '@/lib/tenant-access';

/** Service Health is tenant data: gated like Message Center, with its own public override. */
export function getServiceHealthAccess(): Promise<TenantAccess> {
  return getTenantAccess({ publicEnvVar: 'SERVICE_HEALTH_PUBLIC' });
}
