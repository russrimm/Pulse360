import { NextRequest, NextResponse } from 'next/server';

/**
 * Basic API key authentication middleware.
 * Set the API_AUTH_KEY environment variable and pass it via the
 * `x-api-key` header on every request to protected routes.
 *
 * When API_AUTH_KEY is not set (e.g. local dev), all requests are allowed.
 */
export function middleware(request: NextRequest) {
  const apiKey = process.env.API_AUTH_KEY;

  // If no key is configured, skip enforcement (local dev / staging)
  if (!apiKey) {
    return NextResponse.next();
  }

  const requestKey = request.headers.get('x-api-key');

  if (!requestKey || requestKey !== apiKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
