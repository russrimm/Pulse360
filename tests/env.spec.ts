/**
 * tests/env.spec.ts
 *
 * Validated environment parsing.
 *
 * Run: pnpm exec playwright test tests/env.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

import { EnvValidationError, parseEnv } from '../src/lib/env';

test('an empty environment is valid and blank values count as unset', () => {
  expect(parseEnv({})).toEqual({});
  expect(parseEnv({ AZURE_API_URL: '  ', DATABASE_URL: '' }).DATABASE_URL).toBeUndefined();
});

test('accepts the documented configuration shapes', () => {
  const env = parseEnv({
    AZURE_API_URL: 'graphapirim.azure-api.net',
    AZURE_CLIENT_ID: '00000000-0000-0000-0000-000000000000',
    DATABASE_URL: 'postgresql://user:pw@host:5432/db?sslmode=require',
    NEXTAUTH_URL: 'http://localhost:3011',
    CRON_SECRET: 'a-sufficiently-long-secret',
    MESSAGE_CENTER_PUBLIC: 'maybe',
  });
  expect(env.AZURE_API_URL).toBe('graphapirim.azure-api.net');
  expect(env.MESSAGE_CENTER_PUBLIC).toBe('maybe');
});

test('reports every invalid variable by name without echoing secret values', () => {
  const secret = 'short';
  try {
    parseEnv({
      AZURE_CLIENT_ID: 'not-a-guid',
      DATABASE_URL: 'mysql://host/db',
      CRON_SECRET: secret,
    });
    throw new Error('expected parseEnv to throw');
  } catch (error) {
    expect(error).toBeInstanceOf(EnvValidationError);
    const { issues, message } = error as EnvValidationError;
    expect(issues.map(issue => issue.split(':')[0]).sort()).toEqual([
      'AZURE_CLIENT_ID',
      'CRON_SECRET',
      'DATABASE_URL',
    ]);
    expect(message).not.toContain(secret);
    expect(message).not.toContain('mysql://');
  }
});
