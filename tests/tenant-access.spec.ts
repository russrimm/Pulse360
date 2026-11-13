/**
 * tests/tenant-access.spec.ts
 *
 * The shared tenant gate must stay in lockstep with the Message Center names
 * that existing callers import. The exhaustive matrix lives in
 * message-center-access.spec.ts; this covers the generalized entry points.
 *
 * Run: pnpm exec playwright test tests/tenant-access.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

import {
  parseTenantPublicMode,
  resolveTenantAccess,
  type TenantPublicMode,
} from '../src/lib/tenant-access';
import {
  parseMessageCenterPublicMode,
  resolveMessageCenterAccess,
} from '../src/lib/message-center-access';

const MODES: TenantPublicMode[] = ['enabled', 'disabled', 'unset'];

test('Message Center names delegate to the shared tenant decision for every input', () => {
  for (const publicMode of MODES) {
    for (const isAuthConfigured of [true, false]) {
      for (const hasAuthenticatedUser of [true, false]) {
        const context = { publicMode, isAuthConfigured, hasAuthenticatedUser };
        expect(resolveMessageCenterAccess(context)).toBe(resolveTenantAccess(context));
      }
    }
  }
  for (const value of ['true', 'FALSE', ' true ', '', undefined, 'maybe']) {
    expect(parseMessageCenterPublicMode(value)).toBe(parseTenantPublicMode(value));
  }
});

test('an anonymous caller is denied when sign-in is configured and the route is not public', () => {
  expect(
    resolveTenantAccess({
      publicMode: 'unset',
      isAuthConfigured: true,
      hasAuthenticatedUser: false,
    })
  ).toBe('authentication-required');
});

test('an explicit opt-out fails closed when no sign-in provider exists', () => {
  expect(
    resolveTenantAccess({
      publicMode: parseTenantPublicMode('false'),
      isAuthConfigured: false,
      hasAuthenticatedUser: true,
    })
  ).toBe('unconfigured');
});
