import { NextRequest, NextResponse } from 'next/server';
import { getMessageCenterAccess } from '@/lib/message-center-auth';
import { accessError } from '@/lib/briefing/access';
import { fetchBriefingSources } from '@/lib/briefing/data.server';
import {
  buildDigest,
  digestFilename,
  formatDigest,
  parseDigestParams,
} from '@/lib/briefing/digest';
import { rollingWindow } from '@/lib/briefing/week';

// One-click export of the last N days (default 7) of Power Platform and
// Copilot Studio Message Center posts, read from the synced Postgres copy.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const headers = {
    'Cache-Control': 'private, no-store, max-age=0',
    Vary: 'Cookie',
  };

  const denied = accessError(await getMessageCenterAccess());
  if (denied) {
    return NextResponse.json({ error: denied.error }, { status: denied.status, headers });
  }

  const params = parseDigestParams(request.nextUrl.searchParams);
  if (!params.ok) {
    return NextResponse.json({ error: params.error }, { status: 400, headers });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Message Center storage is not configured' },
      { status: 503, headers }
    );
  }

  try {
    const now = new Date();
    const sources = await fetchBriefingSources(rollingWindow(now, params.days));
    const digest = buildDigest(sources, now, params.days);
    const { body, contentType, extension } = formatDigest(digest, params.format);

    return new NextResponse(body, {
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${digestFilename(now, params.days, extension)}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error in /api/briefing/digest:', error);
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 503, headers });
  }
}
