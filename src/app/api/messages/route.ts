import { getMessages } from '@/lib/api';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in /api/messages:', error);
    return NextResponse.json(
      { error: 'Upstream service unavailable' },
      { status: 500 }
    );
  }
}
