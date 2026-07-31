import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/api.server';
import { getMessageCenterAccess } from '@/lib/message-center-auth';

export async function GET() {
  const headers = {
    'Cache-Control': 'private, no-store, max-age=0',
    Vary: 'Cookie',
  };

  const access = await getMessageCenterAccess();
  if (access === 'unconfigured') {
    return NextResponse.json(
      { error: 'Message Center access is not configured' },
      { status: 503, headers }
    );
  }
  if (access === 'authentication-required') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers });
  }

  try {
    const messages = await getMessages();
    return NextResponse.json(messages, { headers });
  } catch (error) {
    console.error('Error in /api/messages:', error);
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 503, headers });
  }
}
