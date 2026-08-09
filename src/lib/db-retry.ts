/**
 * Transient-failure handling for Postgres reads and writes.
 *
 * Neon scales a compute to zero when idle. The first query after that returns
 * `XX000 Control plane request failed` (surfaced by Prisma as P2039) while the
 * compute wakes up, and pooled sockets opened before the suspend come back as
 * connection resets. Both clear within a second or two, so a short retry turns
 * a 500 into a slightly slower page load.
 *
 * Kept free of `server-only` and Prisma imports so it stays unit-testable.
 */

// Prisma error codes raised before any statement reaches Postgres.
const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

// Postgres SQLSTATE classes for connection loss / server unavailability.
const TRANSIENT_PG_CODES = new Set([
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '53300',
  '57P01',
  '57P02',
  '57P03',
]);

// Matched against the message rather than the code so that unrelated XX000
// internal errors, which may have partially applied, are never retried.
const TRANSIENT_MESSAGE_PATTERNS = [
  /control plane request failed/i,
  /connection terminated/i,
  /connection closed/i,
  /server has closed the connection/i,
  /terminating connection/i,
  /the database system is (?:starting up|shutting down|not yet accepting)/i,
  /econnreset/i,
  /econnrefused/i,
  /etimedout/i,
  /timeout expired/i,
  /socket hang up/i,
];

const MAX_CAUSE_DEPTH = 5;

export function isTransientDbError(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== 'object' || depth > MAX_CAUSE_DEPTH) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    cause?: unknown;
    meta?: { driverAdapterError?: unknown };
  };
  const code = typeof candidate.code === 'string' ? candidate.code : undefined;
  const message = typeof candidate.message === 'string' ? candidate.message : '';

  if (code && (TRANSIENT_PRISMA_CODES.has(code) || TRANSIENT_PG_CODES.has(code))) {
    return true;
  }
  if (TRANSIENT_MESSAGE_PATTERNS.some(pattern => pattern.test(message))) {
    return true;
  }

  return (
    isTransientDbError(candidate.meta?.driverAdapterError, depth + 1) ||
    isTransientDbError(candidate.cause, depth + 1)
  );
}

export const RETRY_DELAYS_MS = [250, 750];

/**
 * Runs a database operation, retrying only failures that happen before the
 * query reaches Postgres. Safe for reads and for the idempotent upserts the
 * Message Center sync performs.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  label: string,
  sleep: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms))
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_DELAYS_MS.length || !isTransientDbError(error)) {
        throw error;
      }

      const delay = RETRY_DELAYS_MS[attempt] + Math.floor(Math.random() * 100);
      console.warn(
        `Transient database error during ${label}; retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length})`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
