import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/api';

export async function GET() {
  try {
    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in /api/messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'Check that NEXT_PUBLIC_TENANT_ID, NEXT_PUBLIC_CLIENT_ID, and NEXT_PUBLIC_API_KEY are set correctly in your environment variables. The API_KEY should be the client secret from Azure AD app registration.'
      },
      { status: 500 }
    );
  }
} 