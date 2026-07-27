import { NextRequest, NextResponse } from 'next/server';
import { syncMessagesFromGraph } from '@/lib/api.server';

// Vercel Cron hits this daily (see vercel.json). Also callable manually with
// `Authorization: Bearer $CRON_SECRET`. When `CRON_SECRET` is unset, refuses
// in production so the endpoint isn't a public "burn my Graph quota" button.
export const runtime = 'nodejs';
// Give the Graph pull enough time; Vercel caps this at 60s on Pro and 300s on
// Enterprise. Reduce if you're on Hobby (10s max — but a full sync won't fit).
export const maxDuration = 60;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured' },
        { status: 503 },
      );
    }
    // In dev, allow unauthenticated invocation for easy manual testing.
  } else {
    const header = request.headers.get('authorization');
    const expected = `Bearer ${secret}`;
    if (header !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  try {
    await syncMessagesFromGraph();
    const durationMs = Date.now() - startedAt;
    return NextResponse.json({ ok: true, durationMs });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error('Cron sync failed:', error);
    return NextResponse.json(
      {
        ok: false,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
