/**
 * Access decision for tenant-scoped briefing routes. Message Center posts are
 * tenant data, so the digest export and the briefing page use the same gate as
 * /api/messages (MESSAGE_CENTER_PUBLIC plus sign-in).
 */

import type { TenantAccess } from '../tenant-access';

export interface AccessError {
  status: 401 | 503;
  error: string;
}

/** null when access is allowed. */
export function accessError(access: TenantAccess): AccessError | null {
  if (access === 'unconfigured') {
    return { status: 503, error: 'Message Center access is not configured' };
  }
  if (access === 'authentication-required') {
    return { status: 401, error: 'Authentication required' };
  }
  return null;
}
