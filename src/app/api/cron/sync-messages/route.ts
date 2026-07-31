import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { syncMessagesFromGraph } from '@/lib/api.server';

// Vercel Cron hits this daily (see vercel.json). Also callable manually with
// `Authorization: Bearer $CRON_SECRET`. When `CRON_SECRET` is unset, refuses
// in production so the endpoint isn't a public "burn my Graph quota" button.
export const runtime = 'nodejs';
// Give the Graph pull enough time; Vercel caps this at 60s on Pro and 300s on
// Enterprise. Reduce if you're on Hobby (10s max — but a full sync won't fit).
export const maxDuration = 60;

function secretsMatch(actual: string | null, expected: string): boolean {
  if (!actual) return false;

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const headers = { 'Cache-Control': 'private, no-store, max-age=0' };

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured' },
        { status: 503, headers }
      );
    }
    // In dev, allow unauthenticated invocation for easy manual testing.
  } else {
    const header = request.headers.get('authorization');
    const expected = `Bearer ${secret}`;
    if (!secretsMatch(header, expected)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
  }

  const startedAt = Date.now();
  try {
    await syncMessagesFromGraph();
    const durationMs = Date.now() - startedAt;
    return NextResponse.json({ ok: true, durationMs }, { headers });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error('Cron sync failed:', error);
    return NextResponse.json(
      {
        ok: false,
        durationMs,
        error: 'Message Center sync failed',
      },
      { status: 500, headers }
    );
  }
}
