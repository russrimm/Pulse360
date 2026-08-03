/**
 * tests/message-center-access.spec.ts
 *
 * Authorization gate for the tenant Message Center (Playwright runner, no
 * browser or server required — the decision function is pure).
 *
 * Background: the gate previously keyed its fail-closed behaviour off
 * `NODE_ENV === 'production'`. Any deployed environment where NODE_ENV was not
 * exactly "production" (preview/staging slots, container defaults, a custom
 * server start script) would serve tenant Message Center data ANONYMOUSLY while
 * still appearing gated in code review. `resolveMessageCenterAccess` was
 * extracted so the decision depends only on explicit inputs, never on ambient
 * environment, and so it can be exhaustively tested.
 *
 * Policy: when no interactive sign-in provider is configured there is no way
 * for a caller to authenticate, so the route is served openly. Owners lock it
 * down either by configuring sign-in or by setting MESSAGE_CENTER_PUBLIC=false.
 *
 * This file enumerates all 3 x 2 x 2 input combinations rather than sampling,
 * because this is an authorization boundary and a missed combination is an
 * exposure.
 *
 * Run: npx playwright test tests/message-center-access.spec.ts
 */
import { test, expect } from '@playwright/test';

// Relative import – the @/ alias is not guaranteed to resolve in the Playwright
// Node runner, matching the convention already used by tests/sanitize.spec.ts.
import {
  parseMessageCenterPublicMode,
  resolveMessageCenterAccess,
  type MessageCenterAccess,
  type MessageCenterPublicMode,
} from '../src/lib/message-center-access';

interface Combination {
  publicMode: MessageCenterPublicMode;
  isAuthConfigured: boolean;
  hasAuthenticatedUser: boolean;
  expected: MessageCenterAccess;
  why: string;
}

// All 3 x 2 x 2 combinations, exhaustive and explicit.
const COMBINATIONS: Combination[] = [
  {
    publicMode: 'enabled',
    isAuthConfigured: true,
    hasAuthenticatedUser: true,
    expected: 'allowed',
    why: 'explicit opt-in wins',
  },
  {
    publicMode: 'enabled',
    isAuthConfigured: true,
    hasAuthenticatedUser: false,
    expected: 'allowed',
    why: 'explicit opt-in wins without a session',
  },
  {
    publicMode: 'enabled',
    isAuthConfigured: false,
    hasAuthenticatedUser: true,
    expected: 'allowed',
    why: 'explicit opt-in wins without auth configured',
  },
  {
    publicMode: 'enabled',
    isAuthConfigured: false,
    hasAuthenticatedUser: false,
    expected: 'allowed',
    why: 'explicit opt-in with nothing to sign in to',
  },
  {
    publicMode: 'unset',
    isAuthConfigured: true,
    hasAuthenticatedUser: true,
    expected: 'allowed',
    why: 'authenticated user on a configured deployment',
  },
  {
    publicMode: 'unset',
    isAuthConfigured: true,
    hasAuthenticatedUser: false,
    expected: 'authentication-required',
    why: 'auth is configured and the caller is anonymous',
  },
  {
    publicMode: 'unset',
    isAuthConfigured: false,
    hasAuthenticatedUser: true,
    expected: 'allowed',
    why: 'no sign-in provider exists, so the route is open by default',
  },
  {
    publicMode: 'unset',
    isAuthConfigured: false,
    hasAuthenticatedUser: false,
    expected: 'allowed',
    why: 'no sign-in provider exists, so the route is open by default',
  },
  {
    publicMode: 'disabled',
    isAuthConfigured: true,
    hasAuthenticatedUser: true,
    expected: 'allowed',
    why: 'opt-out only blocks anonymous callers',
  },
  {
    publicMode: 'disabled',
    isAuthConfigured: true,
    hasAuthenticatedUser: false,
    expected: 'authentication-required',
    why: 'opt-out plus configured auth means sign in first',
  },
  {
    publicMode: 'disabled',
    isAuthConfigured: false,
    hasAuthenticatedUser: true,
    expected: 'unconfigured',
    why: 'a session cannot be trusted when auth is not configured',
  },
  {
    publicMode: 'disabled',
    isAuthConfigured: false,
    hasAuthenticatedUser: false,
    expected: 'unconfigured',
    why: 'explicit opt-out with no way to sign in fails closed',
  },
];

test.describe('resolveMessageCenterAccess – exhaustive input matrix', () => {
  for (const combination of COMBINATIONS) {
    const { publicMode, isAuthConfigured, hasAuthenticatedUser, expected, why } = combination;
    const label =
      `publicMode=${publicMode} isAuthConfigured=${isAuthConfigured} ` +
      `hasAuthenticatedUser=${hasAuthenticatedUser} -> ${expected} (${why})`;

    test(label, () => {
      expect(
        resolveMessageCenterAccess({ publicMode, isAuthConfigured, hasAuthenticatedUser }),
      ).toBe(expected);
    });
  }

  test('covers every input combination', () => {
    expect(COMBINATIONS).toHaveLength(3 * 2 * 2);
    const keys = new Set(
      COMBINATIONS.map(
        ({ publicMode, isAuthConfigured, hasAuthenticatedUser }) =>
          `${publicMode}|${isAuthConfigured}|${hasAuthenticatedUser}`,
      ),
    );
    expect(keys.size).toBe(COMBINATIONS.length);
  });
});

test.describe('resolveMessageCenterAccess – security invariants', () => {
  test('an anonymous caller is never allowed once sign-in is configured', () => {
    for (const publicMode of ['unset', 'disabled'] as const) {
      expect(
        resolveMessageCenterAccess({
          publicMode,
          isAuthConfigured: true,
          hasAuthenticatedUser: false,
        }),
      ).toBe('authentication-required');
    }
  });

  test('the explicit opt-out is never overridden into anonymous access', () => {
    for (const isAuthConfigured of [true, false]) {
      expect(
        resolveMessageCenterAccess({
          publicMode: 'disabled',
          isAuthConfigured,
          hasAuthenticatedUser: false,
        }),
      ).not.toBe('allowed');
    }
  });

  test('the decision does not read ambient environment state', () => {
    // The original defect was an implicit NODE_ENV dependency. Flipping NODE_ENV
    // must not change the outcome for identical inputs.
    const inputs = {
      publicMode: 'disabled',
      isAuthConfigured: false,
      hasAuthenticatedUser: false,
    } as const;
    const original = process.env.NODE_ENV;

    try {
      const seen = new Set<MessageCenterAccess>();
      for (const value of ['production', 'development', 'test', 'staging', '']) {
        // NODE_ENV is typed as a narrow union, so assign through the record form.
        (process.env as Record<string, string | undefined>).NODE_ENV = value;
        seen.add(resolveMessageCenterAccess(inputs));
      }

      expect([...seen]).toEqual(['unconfigured']);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = original;
    }
  });
});

test.describe('parseMessageCenterPublicMode', () => {
  const cases: [string | undefined, MessageCenterPublicMode][] = [
    ['true', 'enabled'],
    ['TRUE', 'enabled'],
    ['  true  ', 'enabled'],
    ['false', 'disabled'],
    ['False', 'disabled'],
    [undefined, 'unset'],
    ['', 'unset'],
    ['1', 'unset'],
    ['yes', 'unset'],
  ];

  for (const [value, expected] of cases) {
    test(`${JSON.stringify(value)} -> ${expected}`, () => {
      expect(parseMessageCenterPublicMode(value)).toBe(expected);
    });
  }
});
