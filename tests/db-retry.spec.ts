/**
 * tests/db-retry.spec.ts
 *
 * Regression gate for the Neon cold-start failure that surfaced as
 * `P2039 / XX000 Control plane request failed` on /message-center.
 *
 * Run: pnpm exec playwright test tests/db-retry.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

// Relative import – the @/ alias is not guaranteed to resolve in the Playwright
// Node runner, so we use a concrete relative path instead.
import { isTransientDbError, withDbRetry, RETRY_DELAYS_MS } from '../src/lib/db-retry';

/** Rebuilds the nested error shape Prisma 7 produced in the reported failure. */
function makeControlPlaneError(): Error {
  const driverAdapterError = new Error('Control plane request failed');
  driverAdapterError.name = 'DriverAdapterError';

  const prismaError = new Error(
    'Invalid `prisma.messageCenterUpdate.findMany()` invocation:\n\n\nDatabase error. Code: `XX000`. Message: `Control plane request failed`'
  );
  Object.assign(prismaError, {
    code: 'P2039',
    meta: { modelName: 'MessageCenterUpdate', driverAdapterError },
    clientVersion: '7.9.1',
  });
  return prismaError;
}

const noSleep = async (): Promise<void> => undefined;

test.describe('isTransientDbError', () => {
  test('detects the Neon control plane failure', () => {
    expect(isTransientDbError(makeControlPlaneError())).toBe(true);
  });

  test('detects it through meta.driverAdapterError alone', () => {
    const error = Object.assign(new Error('Database error.'), {
      code: 'P2039',
      meta: { driverAdapterError: new Error('Control plane request failed') },
    });
    expect(isTransientDbError(error)).toBe(true);
  });

  test('detects dropped pooled connections', () => {
    expect(isTransientDbError(new Error('Connection terminated unexpectedly'))).toBe(true);
    expect(isTransientDbError(Object.assign(new Error('boom'), { code: '57P01' }))).toBe(true);
    expect(isTransientDbError(Object.assign(new Error('boom'), { code: 'P1017' }))).toBe(true);
  });

  test('follows the cause chain', () => {
    const error = new Error('outer', { cause: new Error('read ECONNRESET') });
    expect(isTransientDbError(error)).toBe(true);
  });

  test('does not retry genuine query errors', () => {
    const unique = Object.assign(new Error('Unique constraint failed on the fields: (`id`)'), {
      code: 'P2002',
    });
    expect(isTransientDbError(unique)).toBe(false);

    const internal = Object.assign(new Error('Database error. Code: `XX000`. Message: `boom`'), {
      code: 'P2039',
    });
    expect(isTransientDbError(internal)).toBe(false);

    expect(isTransientDbError(null)).toBe(false);
    expect(isTransientDbError('Control plane request failed')).toBe(false);
  });

  test('stops walking a self-referencing cause chain', () => {
    const error: Error & { cause?: unknown } = new Error('outer');
    error.cause = error;
    expect(isTransientDbError(error)).toBe(false);
  });
});

test.describe('withDbRetry', () => {
  test('recovers once the compute wakes up', async () => {
    let calls = 0;
    const result = await withDbRetry(
      async () => {
        calls++;
        if (calls === 1) throw makeControlPlaneError();
        return ['MC123'];
      },
      'test',
      noSleep
    );

    expect(calls).toBe(2);
    expect(result).toEqual(['MC123']);
  });

  test('gives up after the configured attempts and rethrows the original error', async () => {
    let calls = 0;
    await expect(
      withDbRetry(
        async () => {
          calls++;
          throw makeControlPlaneError();
        },
        'test',
        noSleep
      )
    ).rejects.toThrow(/Control plane request failed/);

    expect(calls).toBe(RETRY_DELAYS_MS.length + 1);
  });

  test('fails fast on a non-transient error', async () => {
    let calls = 0;
    await expect(
      withDbRetry(
        async () => {
          calls++;
          throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
        },
        'test',
        noSleep
      )
    ).rejects.toThrow(/Unique constraint failed/);

    expect(calls).toBe(1);
  });

  test('does not retry a successful call', async () => {
    let calls = 0;
    await withDbRetry(
      async () => {
        calls++;
        return 1;
      },
      'test',
      noSleep
    );
    expect(calls).toBe(1);
  });
});
