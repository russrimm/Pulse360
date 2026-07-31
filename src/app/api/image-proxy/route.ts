import { NextRequest, NextResponse } from 'next/server';
import { isAllowedImageHost, isSsrfHost } from '@/lib/imageProxySecurity';

// Use the Node.js runtime: image streaming is reliable here and avoids the
// Edge runtime's 1 MB response-body limit, which could silently truncate
// larger images. Node also lets us add real DNS-resolution SSRF pinning in
// future without a runtime change.
export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// Error envelopes
// ---------------------------------------------------------------------------

function badRequest(message: string): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code: 'BAD_REQUEST', message, source: 'image-proxy' } },
    { status: 400 },
  );
}

function upstreamUnavailable(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'UPSTREAM_UNAVAILABLE',
        message: 'The upstream image could not be retrieved.',
        source: 'image-proxy',
      },
    },
    { status: 502 },
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  // 1. Presence check
  if (!url) {
    return badRequest('Missing required query parameter: url');
  }

  // 2. Parse
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return badRequest('Invalid url: must be a valid absolute URL');
  }

  // 3. HTTPS-only
  if (parsed.protocol !== 'https:') {
    return badRequest('Invalid url: only https:// URLs are permitted');
  }

  const { hostname } = parsed;

  // 4. SSRF: reject IP-literal private / loopback / link-local hosts
  if (isSsrfHost(hostname)) {
    return badRequest('Invalid url: target host is not permitted');
  }

  // 5. Allowlist: only Microsoft / known CDN hosts
  if (!isAllowedImageHost(hostname)) {
    return badRequest('Invalid url: host is not on the allowed list');
  }

  // 6. Fetch upstream with a 10 s timeout; do NOT follow redirects to avoid
  //    open-redirect SSRF bypass (redirects to un-checked hosts are treated
  //    as upstream failures; note this limitation in the decision log).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual',
      headers: { 'User-Agent': 'Pulse360-ImageProxy/1.0' },
    });
  } catch {
    return upstreamUnavailable();
  } finally {
    clearTimeout(timeoutId);
  }

  // 7. Require a successful (2xx) response — 3xx from redirect:'manual' is !ok
  if (!upstream.ok) {
    return upstreamUnavailable();
  }

  // 8. Validate the upstream actually returned an image
  const contentType = upstream.headers.get('Content-Type') ?? '';
  if (!contentType.startsWith('image/')) {
    return upstreamUnavailable();
  }

  if (!upstream.body) {
    return upstreamUnavailable();
  }

  // 9. Stream body to client, forwarding Content-Type + long-lived cache headers
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
