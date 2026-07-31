import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/api.server';

// This site is intentionally public/anonymous. Message Center data is fetched
// with app-only Graph credentials (AZURE_CLIENT_ID / AZURE_CLIENT_SECRET /
// AZURE_TENANT_ID) and served to unauthenticated visitors by design, so this
// route does not gate on a user session.
export async function GET() {
  try {
    const messages = await getMessages();
    return NextResponse.json(messages, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error in /api/messages:', error);
    return NextResponse.json(
      { error: 'Upstream service unavailable' },
      { status: 500 },
    );
  }
}
