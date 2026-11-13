/**
 * tests/graph-token.spec.ts
 *
 * App-only Graph configuration and token acquisition, with env and fetch
 * injected so no network or credentials are needed.
 *
 * Run: pnpm exec playwright test tests/graph-token.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

import {
  getGraphConfig,
  getGraphToken,
  graphUrl,
  isEmptyAccessTokenGraphError,
  normalizeApiBaseUrl,
  resetGraphTokenCache,
} from '../src/lib/graph-token';

const CREDENTIALS = {
  AZURE_CLIENT_ID: 'client-id',
  AZURE_TENANT_ID: 'tenant-id',
  AZURE_CLIENT_SECRET: 'secret',
};

function tokenResponse(token: string, expiresIn: number = 3600): Response {
  return new Response(JSON.stringify({ access_token: token, expires_in: expiresIn }), {
    status: 200,
  });
}

test.beforeEach(() => resetGraphTokenCache());

test.describe('getGraphConfig', () => {
  test('direct mode requires all three credentials', () => {
    expect(getGraphConfig({}).hasRequiredEnvVars).toBe(false);
    expect(getGraphConfig({ AZURE_CLIENT_ID: 'a', AZURE_TENANT_ID: 'b' }).hasRequiredEnvVars).toBe(
      false
    );
    const config = getGraphConfig(CREDENTIALS);
    expect(config).toMatchObject({
      hasLocalCredentials: true,
      isApimMode: false,
      hasRequiredEnvVars: true,
      baseUrl: 'https://graph.microsoft.com',
    });
  });

  test('a non-Graph AZURE_API_URL enables APIM mode without credentials', () => {
    const config = getGraphConfig({ AZURE_API_URL: 'graphapirim.azure-api.net/' });
    expect(config).toMatchObject({
      isApimMode: true,
      hasLocalCredentials: false,
      hasRequiredEnvVars: true,
      baseUrl: 'https://graphapirim.azure-api.net',
    });
  });

  test('pointing AZURE_API_URL at Graph keeps direct mode and strips the version path', () => {
    const config = getGraphConfig({ AZURE_API_URL: 'https://graph.microsoft.com/v1.0' });
    expect(config.isApimMode).toBe(false);
    expect(config.baseUrl).toBe('https://graph.microsoft.com');
    expect(normalizeApiBaseUrl('https://graph.microsoft.com/beta/')).toBe(
      'https://graph.microsoft.com'
    );
  });

  test('graphUrl builds versioned URLs', () => {
    expect(graphUrl('/admin/serviceAnnouncement/messages', 'beta', 'https://x.test')).toBe(
      'https://x.test/beta/admin/serviceAnnouncement/messages'
    );
  });
});

test.describe('getGraphToken', () => {
  test('names every missing variable', async () => {
    await expect(getGraphToken({ env: { AZURE_CLIENT_ID: 'a' } })).rejects.toThrow(
      'Missing required environment variables: AZURE_CLIENT_SECRET, AZURE_TENANT_ID'
    );
  });

  test('posts client credentials and caches the token until near expiry', async () => {
    let calls = 0;
    let body = '';
    let url = '';
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1;
      url = String(input);
      body = String(init?.body);
      return tokenResponse(` token-${calls} `);
    }) as typeof fetch;
    let clock = 1_000_000;
    const options = { env: CREDENTIALS, fetchImpl, now: () => clock };

    expect(await getGraphToken(options)).toBe('token-1');
    expect(url).toBe('https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token');
    const params = new URLSearchParams(body);
    expect(params.get('grant_type')).toBe('client_credentials');
    expect(params.get('scope')).toBe('https://graph.microsoft.com/.default');
    expect(params.get('client_id')).toBe('client-id');

    clock += 3_000_000; // still inside the 3600s - 60s window
    expect(await getGraphToken(options)).toBe('token-1');
    expect(calls).toBe(1);

    clock += 600_000; // past expiry
    expect(await getGraphToken(options)).toBe('token-2');
    expect(calls).toBe(2);
  });

  test('surfaces the Azure AD error description on failure', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ error_description: 'bad secret' }), {
        status: 401,
      })) as typeof fetch;
    await expect(getGraphToken({ env: CREDENTIALS, fetchImpl })).rejects.toThrow(
      /Failed to get Azure AD token \(401\): bad secret/
    );
  });

  test('rejects a response without a usable access_token', async () => {
    const empty = (async () => tokenResponse('   ')) as typeof fetch;
    await expect(getGraphToken({ env: CREDENTIALS, fetchImpl: empty })).rejects.toThrow(
      'Azure AD returned an empty access_token.'
    );
    const missing = (async () => new Response('{}', { status: 200 })) as typeof fetch;
    await expect(getGraphToken({ env: CREDENTIALS, fetchImpl: missing })).rejects.toThrow(
      /returned no access_token/
    );
  });
});

test('isEmptyAccessTokenGraphError recognizes the APIM empty-token failure', () => {
  const body = JSON.stringify({
    error: { code: 'InvalidAuthenticationToken', message: 'Access token is empty.' },
  });
  expect(isEmptyAccessTokenGraphError(body)).toBe(true);
  expect(isEmptyAccessTokenGraphError('InvalidAuthenticationToken: access token is empty')).toBe(
    true
  );
  expect(isEmptyAccessTokenGraphError('{"error":{"code":"Other","message":"nope"}}')).toBe(false);
});
