/**
 * Authorization gate for tenant-scoped routes and pages (Message Center and
 * any future feature that serves tenant data).
 *
 * The decision itself is pure and depends only on explicit inputs, never on
 * ambient environment such as NODE_ENV. `getTenantAccess` wires it to the
 * real session; it loads next-auth lazily so this module stays importable from
 * the Playwright Node runner.
 */

export type TenantAccess = 'allowed' | 'authentication-required' | 'unconfigured';

/**
 * Tri-state reading of a "public" environment flag (for Message Center,
 * MESSAGE_CENTER_PUBLIC).
 *
 * - 'enabled'  -> flag=true: anonymous access, even when interactive sign-in
 *                 is configured.
 * - 'disabled' -> flag=false: never serve anonymously. With sign-in configured
 *                 that means "sign in first"; without it there is nothing to
 *                 sign in to, so the route fails closed.
 * - 'unset'    -> defer to whether interactive sign-in is configured.
 */
export type TenantPublicMode = 'enabled' | 'disabled' | 'unset';

export interface TenantAccessContext {
  publicMode: TenantPublicMode;
  isAuthConfigured: boolean;
  hasAuthenticatedUser: boolean;
}

export function parseTenantPublicMode(value: string | undefined): TenantPublicMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'true') return 'enabled';
  if (normalized === 'false') return 'disabled';
  return 'unset';
}

export function resolveTenantAccess({
  publicMode,
  isAuthConfigured,
  hasAuthenticatedUser,
}: TenantAccessContext): TenantAccess {
  if (publicMode === 'enabled') {
    return 'allowed';
  }

  if (isAuthConfigured) {
    return hasAuthenticatedUser ? 'allowed' : 'authentication-required';
  }

  // No interactive sign-in provider exists, so a session can never be
  // established. Serve the route openly unless the owner explicitly opted out.
  return publicMode === 'disabled' ? 'unconfigured' : 'allowed';
}

export interface GetTenantAccessOptions {
  /** Name of the environment variable that holds the public flag. */
  publicEnvVar: string;
}

/** Resolve access for the current request from the environment and session. */
export async function getTenantAccess({
  publicEnvVar,
}: GetTenantAccessOptions): Promise<TenantAccess> {
  const publicMode = parseTenantPublicMode(process.env[publicEnvVar]);
  const { isAuthConfigured } = await import('./auth');

  if (publicMode === 'enabled' || !isAuthConfigured) {
    return resolveTenantAccess({
      publicMode,
      isAuthConfigured,
      hasAuthenticatedUser: false,
    });
  }

  const [{ getServerSession }, { authOptions }] = await Promise.all([
    import('next-auth'),
    import('./auth'),
  ]);
  const session = await getServerSession(authOptions);
  return resolveTenantAccess({
    publicMode,
    isAuthConfigured,
    hasAuthenticatedUser: Boolean(session?.user),
  });
}
