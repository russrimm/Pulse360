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
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient =
  globalThis.__pulse360Prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pulse360Prisma = prisma;
}
