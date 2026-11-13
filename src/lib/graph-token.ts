/**
 * App-only Microsoft Graph access: base URL / APIM mode detection and
 * client-credentials token acquisition.
 *
 * Intentionally free of `server-only` so the pure pieces can be unit tested in
 * the Playwright Node runner. Only import this from server code: it reads
 * secrets from `process.env`, which are never exposed to client bundles.
 */

export const DIRECT_GRAPH_BASE_URL = 'https://graph.microsoft.com';
const TOKEN_REQUEST_TIMEOUT_MS = 10_000;

export type GraphApiVersion = 'v1.0' | 'beta';

export interface GraphConfig {
  /** Base URL without a version path; supports both /v1.0 and /beta. */
  baseUrl: string;
  clientSecret?: string;
  tenantId?: string;
  clientId?: string;
  hasLocalCredentials: boolean;
  /** True only when AZURE_API_URL points to a non-Graph host. APIM then owns auth. */
  isApimMode: boolean;
  /** APIM mode needs no local credentials; direct mode needs all three. */
  hasRequiredEnvVars: boolean;
}

type EnvSource = Record<string, string | undefined>;

export function normalizeApiBaseUrl(url?: string): string {
  const value = url || DIRECT_GRAPH_BASE_URL;
  const parsed = new URL(
    value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`
  );

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('AZURE_API_URL must use http or https');
  }

  parsed.hash = '';
  parsed.search = '';
  if (parsed.hostname.toLowerCase() === 'graph.microsoft.com') {
    parsed.pathname = parsed.pathname.replace(/\/(?:v1\.0|beta)\/?$/i, '');
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.toString().replace(/\/$/, '');
}

export function isGraphMicrosoftHost(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase() === 'graph.microsoft.com';
  } catch {
    return false;
  }
}

export function getGraphConfig(env: EnvSource = process.env): GraphConfig {
  const rawApiUrl = env.AZURE_API_URL?.trim();
  const baseUrl = normalizeApiBaseUrl(rawApiUrl);
  const clientSecret = env.AZURE_CLIENT_SECRET;
  const tenantId = env.AZURE_TENANT_ID;
  const clientId = env.AZURE_CLIENT_ID;
  const hasLocalCredentials = Boolean(clientSecret && tenantId && clientId);
  const isApimMode = Boolean(rawApiUrl) && !isGraphMicrosoftHost(baseUrl);

  return {
    baseUrl,
    clientSecret,
    tenantId,
    clientId,
    hasLocalCredentials,
    isApimMode,
    hasRequiredEnvVars: isApimMode || hasLocalCredentials,
  };
}

/** Build a Graph API URL with version. Defaults to v1.0. */
export function graphUrl(
  path: string,
  version: GraphApiVersion = 'v1.0',
  baseUrl: string = getGraphConfig().baseUrl
): string {
  return `${baseUrl}/${version}${path}`;
}

export function isEmptyAccessTokenGraphError(errorText: string): boolean {
  try {
    const parsed = JSON.parse(errorText) as {
      error?: { code?: string; message?: string };
    };
    const code = parsed.error?.code ?? '';
    const message = parsed.error?.message ?? '';
    return code === 'InvalidAuthenticationToken' && /access token is empty/i.test(message);
  } catch {
    return (
      /InvalidAuthenticationToken/i.test(errorText) && /access token is empty/i.test(errorText)
    );
  }
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

interface AzureTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
  error?: unknown;
  error_description?: unknown;
}

let cachedToken: CachedToken | null = null;

/** Test hook: drop the in-process token cache. */
export function resetGraphTokenCache(): void {
  cachedToken = null;
}

export interface GetGraphTokenOptions {
  env?: EnvSource;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

/** Acquire (and cache in-process) an app-only Graph token via client credentials. */
export async function getGraphToken(options: GetGraphTokenOptions = {}): Promise<string> {
  const { env = process.env, fetchImpl = fetch, now = Date.now } = options;
  const config = getGraphConfig(env);
  const { clientSecret, tenantId, clientId } = config;

  if (!config.hasRequiredEnvVars) {
    const missing = [];
    if (!clientSecret) missing.push('AZURE_CLIENT_SECRET');
    if (!tenantId) missing.push('AZURE_TENANT_ID');
    if (!clientId) missing.push('AZURE_CLIENT_ID');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (cachedToken && cachedToken.expiresAt > now()) {
    return cachedToken.value;
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  if (clientId) params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  if (clientSecret) params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');

  const response = await fetchImpl(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
    signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error_description) {
        errorDetails = errorJson.error_description;
      }
    } catch {
      // Keep original error text if not JSON
    }

    throw new Error(
      `Failed to get Azure AD token (${response.status}): ${errorDetails}. Please verify TENANT_ID, CLIENT_ID, and API_KEY in environment variables.`
    );
  }

  const data = (await response.json()) as AzureTokenResponse;

  if (typeof data.access_token !== 'string') {
    throw new Error(
      `Azure AD returned no access_token. Response: ${JSON.stringify({ error: data.error, error_description: data.error_description })}`
    );
  }

  const accessToken = data.access_token.trim();
  if (!accessToken) {
    throw new Error('Azure AD returned an empty access_token.');
  }

  const expiresInSeconds =
    typeof data.expires_in === 'number' && Number.isFinite(data.expires_in)
      ? data.expires_in
      : 3600;
  cachedToken = {
    value: accessToken,
    expiresAt: now() + Math.max(60, expiresInSeconds - 60) * 1000,
  };

  return cachedToken.value;
}
