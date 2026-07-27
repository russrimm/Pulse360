import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/api.server';
import { authOptions, isAuthConfigured } from '@/lib/auth';

export async function GET() {
  // Fail closed: /api/messages surfaces tenant-scoped Message Center data
  // (ServiceMessage.Read.All). If interactive auth isn't configured in prod,
  // refuse rather than serving anonymously.
  if (!isAuthConfigured) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication is not configured' },
        { status: 503 },
      );
    }
  } else {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in /api/messages:', error);
    return NextResponse.json(
      { error: 'Upstream service unavailable' },
      { status: 500 },
    );
  }
}
