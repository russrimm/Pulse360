import { NextResponse } from 'next/server';
import { getMessageSyncMetadata } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(): Promise<NextResponse> {
  const checkedAt = new Date().toISOString();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        status: 'ok',
        checkedAt,
        services: {
          application: { status: 'ok' },
          messageCenter: { status: 'disabled', lastSyncAt: null },
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  try {
    const sync = await getMessageSyncMetadata();
    return NextResponse.json(
      {
        status: sync.isStale ? 'degraded' : 'ok',
        checkedAt,
        services: {
          application: { status: 'ok' },
          messageCenter: {
            status: sync.isStale ? 'stale' : 'ok',
            lastSyncAt: sync.lastSyncAt,
          },
        },
      },
      { status: sync.isStale ? 503 : 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'degraded',
        checkedAt,
        services: {
          application: { status: 'ok' },
          messageCenter: { status: 'unavailable', lastSyncAt: null },
        },
      },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }
}
