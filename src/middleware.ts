import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

/**
 * API key gate for /api/* routes.
 *
 * Behaviour:
 *   - Production (NODE_ENV === 'production'): API_AUTH_KEY MUST be set.
 *     If it is missing, every /api/* request is refused with 503. This is a
 *     fail-closed guard so a misconfigured deploy can never accidentally expose
 *     tenant-scoped Graph data (e.g. Message Center advisories).
 *   - Non-production: if API_AUTH_KEY is unset, requests are allowed so local
 *     dev doesn't require a key.
 *   - When API_AUTH_KEY is set, the incoming `x-api-key` header is compared
 *     with `crypto.timingSafeEqual` on equal-length buffers to prevent
 *     timing-based key recovery.
 *
 * Note: this file MUST live at `src/middleware.ts` (or the project root) and
 * export a function named `middleware` — Next.js does not pick up arbitrary
 * filenames such as the earlier `src/proxy.ts`.
 */
export const runtime = 'nodejs';

const AUTH_HEADER = 'x-api-key';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // timingSafeEqual throws on unequal lengths; short-circuit here so the
    // early return itself does not become a timing oracle for length.
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function middleware(request: NextRequest): NextResponse {
  const apiKey = process.env.API_AUTH_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      // Fail closed: refuse rather than silently exposing every /api/* route.
      return NextResponse.json(
        { error: 'API authentication is not configured' },
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  const requestKey = request.headers.get(AUTH_HEADER);
  if (!requestKey || !safeEqual(requestKey, apiKey)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
