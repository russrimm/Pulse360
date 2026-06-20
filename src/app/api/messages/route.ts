import { getMessages } from '@/lib/api.server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in /api/messages:', errorMessage);
    return NextResponse.json(
      { error: 'Upstream service unavailable', detail: errorMessage },
      { status: 500 }
    );
  }
}
