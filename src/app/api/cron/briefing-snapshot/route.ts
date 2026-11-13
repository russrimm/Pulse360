import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { snapshotBriefingWeek } from '@/lib/briefing/data.server';
import { defaultWeekKey, isoMondayOrNull } from '@/lib/briefing/week';

// Vercel Cron hits this on Mondays (see vercel.json) to archive the week's
// briefing items per product. Also callable manually with
// `Authorization: Bearer $CRON_SECRET` (optionally `?week=YYYY-MM-DD`). When
// `CRON_SECRET` is unset, refuses in production like /api/cron/sync-messages.
export const runtime = 'nodejs';
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
  } else if (!secretsMatch(request.headers.get('authorization'), `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503, headers });
  }

  const requestedWeek = request.nextUrl.searchParams.get('week');
  const weekKey = requestedWeek ? isoMondayOrNull(requestedWeek) : defaultWeekKey();
  if (!weekKey) {
    return NextResponse.json(
      { error: 'week must be a Monday as YYYY-MM-DD' },
      { status: 400, headers }
    );
  }

  const startedAt = Date.now();
  try {
    const snapshots = await snapshotBriefingWeek(weekKey);
    return NextResponse.json(
      {
        ok: true,
        weekKey,
        durationMs: Date.now() - startedAt,
        snapshots: snapshots.map(snapshot => ({
          product: snapshot.product,
          itemCount: snapshot.items.length,
        })),
      },
      { headers }
    );
  } catch (error) {
    console.error('Briefing snapshot cron failed:', error);
    return NextResponse.json(
      { ok: false, durationMs: Date.now() - startedAt, error: 'Briefing snapshot failed' },
      { status: 500, headers }
    );
  }
}
