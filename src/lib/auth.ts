import 'server-only';
import type { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

/**
 * next-auth configuration.
 *
 * Uses a dedicated Entra ID (Azure AD) app registration for INTERACTIVE user
 * sign-in. Deliberately separate from the app-only Graph credentials in
 * AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_TENANT_ID (those are for
 * daemon-style Graph reads and must not be reused as a user OAuth client).
 *
 * Required env vars for the sign-in flow:
 *   - AUTH_AZURE_AD_CLIENT_ID
 *   - AUTH_AZURE_AD_CLIENT_SECRET
 *   - AUTH_AZURE_AD_TENANT_ID   (defaults to 'common')
 *   - NEXTAUTH_SECRET           (used to sign JWT session cookies)
 *   - NEXTAUTH_URL              (public base URL in production)
 *
 * When these are unset, next-auth is left unconfigured and API routes that
 * call `requireSession()` will fail closed.
 */

const clientId = process.env.AUTH_AZURE_AD_CLIENT_ID;
const clientSecret = process.env.AUTH_AZURE_AD_CLIENT_SECRET;
const tenantId = process.env.AUTH_AZURE_AD_TENANT_ID ?? 'common';

export const isAuthConfigured = Boolean(
  clientId && clientSecret && process.env.NEXTAUTH_SECRET,
);

export const authOptions: NextAuthOptions = {
  providers: isAuthConfigured
    ? [
        AzureADProvider({
          clientId: clientId!,
          clientSecret: clientSecret!,
          tenantId,
        }),
      ]
    : [],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
