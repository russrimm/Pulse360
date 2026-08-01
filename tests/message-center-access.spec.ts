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
 * This file enumerates all 2^3 input combinations rather than sampling, because
 * this is an authorization boundary and a missed combination is an exposure.
 *
 * Run: npx playwright test tests/message-center-access.spec.ts
 */
import { test, expect } from '@playwright/test';

// Relative import – the @/ alias is not guaranteed to resolve in the Playwright
// Node runner, matching the convention already used by tests/sanitize.spec.ts.
import {
  resolveMessageCenterAccess,
  type MessageCenterAccess,
} from '../src/lib/message-center-access';

interface Combination {
  isPublic: boolean;
  isAuthConfigured: boolean;
  hasAuthenticatedUser: boolean;
  expected: MessageCenterAccess;
  why: string;
}

// All 2^3 combinations, exhaustive and explicit.
const COMBINATIONS: Combination[] = [
  {
    isPublic: true,
    isAuthConfigured: true,
    hasAuthenticatedUser: true,
    expected: 'allowed',
    why: 'explicit opt-in wins',
  },
  {
    isPublic: true,
    isAuthConfigured: true,
    hasAuthenticatedUser: false,
    expected: 'allowed',
    why: 'explicit opt-in wins without a session',
  },
  {
    isPublic: true,
    isAuthConfigured: false,
    hasAuthenticatedUser: true,
    expected: 'allowed',
    why: 'explicit opt-in wins without auth configured',
  },
  {
    isPublic: true,
    isAuthConfigured: false,
    hasAuthenticatedUser: false,
    expected: 'allowed',
    why: 'explicit opt-in is the ONLY path to anonymous access',
  },
  {
    isPublic: false,
    isAuthConfigured: true,
    hasAuthenticatedUser: true,
    expected: 'allowed',
    why: 'authenticated user on a configured deployment',
  },
  {
    isPublic: false,
    isAuthConfigured: true,
    hasAuthenticatedUser: false,
    expected: 'authentication-required',
    why: 'auth is configured and the caller is anonymous',
  },
  {
    isPublic: false,
    isAuthConfigured: false,
    hasAuthenticatedUser: true,
    expected: 'unconfigured',
    why: 'a session cannot be trusted when auth is not configured',
  },
  {
    isPublic: false,
    isAuthConfigured: false,
    hasAuthenticatedUser: false,
    expected: 'unconfigured',
    why: 'fail closed rather than serving tenant data',
  },
];

test.describe('resolveMessageCenterAccess – exhaustive input matrix', () => {
  for (const combination of COMBINATIONS) {
    const { isPublic, isAuthConfigured, hasAuthenticatedUser, expected, why } = combination;
    const label =
      `isPublic=${isPublic} isAuthConfigured=${isAuthConfigured} ` +
      `hasAuthenticatedUser=${hasAuthenticatedUser} -> ${expected} (${why})`;

    test(label, () => {
      expect(
        resolveMessageCenterAccess({ isPublic, isAuthConfigured, hasAuthenticatedUser }),
      ).toBe(expected);
    });
  }
});

test.describe('resolveMessageCenterAccess – security invariants', () => {
  test('anonymous access is reachable ONLY via the explicit public opt-in', () => {
    const anonymouslyAllowed = COMBINATIONS.filter(
      (combination) => !combination.hasAuthenticatedUser && combination.expected === 'allowed',
    );

    expect(anonymouslyAllowed.every((combination) => combination.isPublic)).toBe(true);
  });

  test('a non-public deployment never allows an unauthenticated caller', () => {
    for (const isAuthConfigured of [true, false]) {
      expect(
        resolveMessageCenterAccess({
          isPublic: false,
          isAuthConfigured,
          hasAuthenticatedUser: false,
        }),
      ).not.toBe('allowed');
    }
  });

  test('the decision does not read ambient environment state', () => {
    // The original defect was an implicit NODE_ENV dependency. Flipping NODE_ENV
    // must not change the outcome for identical inputs.
    const inputs = { isPublic: false, isAuthConfigured: false, hasAuthenticatedUser: false };
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
