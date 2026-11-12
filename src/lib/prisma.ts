import 'server-only';
import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

// Reuse a single PrismaClient across hot reloads in dev to avoid exhausting
// the connection pool. In production each serverless invocation gets its own.
declare global {
  var __pulse360Prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Configure a Postgres connection string (e.g. a Neon connection string) before importing the Prisma client.'
    );
  }
  const adapter = new PrismaPg({
    connectionString,
    // Serverless invocations are short-lived; a small pool that recycles
    // connections quickly avoids handing out sockets Neon already dropped
    // when the compute scaled to zero.
    max: 5,
    // Fail a stalled connect quickly and let withDbRetry (src/lib/db-retry.ts)
    // try again; a waking compute usually accepts connections within a few
    // seconds, so several short attempts beat one long wait.
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    // Detect half-open sockets left behind when the compute suspends, and
    // bound a hung query so a request never waits on it indefinitely.
    keepAlive: true,
    keepAliveInitialDelayMillis: 5_000,
    query_timeout: 20_000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export function getPrisma(): PrismaClient {
  if (!globalThis.__pulse360Prisma) {
    globalThis.__pulse360Prisma = createPrismaClient();
  }

  return globalThis.__pulse360Prisma;
}
