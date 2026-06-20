import { NextRequest, NextResponse } from 'next/server';

// Use the Node.js runtime: image streaming is reliable here and avoids the
// Edge runtime's 1 MB response-body limit, which could silently truncate
// larger images. Node also lets us add real DNS-resolution SSRF pinning in
// future without a runtime change.
export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// Allowlist — only images from Microsoft-owned or Microsoft-CDN domains
// Matching is suffix-based, anchored at a dot boundary, so "evilmicrosoft.com"
// does NOT satisfy the "microsoft.com" entry.
// ---------------------------------------------------------------------------
const ALLOWED_APEX_DOMAINS: readonly string[] = [
  'microsoft.com',
  'microsoftonline.com',
  'msftstatic.com',
  'akamaized.net',
  'akamai.net',
  'azureedge.net',
  'azure.com',
  'windows.net',
  'msecnd.net',
  'office.com',
  'office.net',
  'sharepointonline.com',
  'msft.net',
  's-microsoft.com',
  'microsoft365.com',
];

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_APEX_DOMAINS.some((apex) => h === apex || h.endsWith(`.${apex}`));
}

// ---------------------------------------------------------------------------
// SSRF protection — reject private / loopback / link-local IP literals
// ---------------------------------------------------------------------------

function isPrivateIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) return false;

  const a = Number(match[1] ?? '0');
  const b = Number(match[2] ?? '0');
  const c = Number(match[3] ?? '0');
  const d = Number(match[4] ?? '0');

  if ([a, b, c, d].some((n) => n > 255)) return false;

  return (
    a === 0 || // 0.0.0.0/8 — "this" network
    a === 10 || // 10.0.0.0/8 — RFC-1918 private
    a === 127 || // 127.0.0.0/8 — loopback
    (a === 169 && b === 254) || // 169.254.0.0/16 — link-local
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 — RFC-1918 private
    (a === 192 && b === 168) // 192.168.0.0/16 — RFC-1918 private
  );
}

function isPrivateIpv6(hostname: string): boolean {
  // WHATWG URL wraps IPv6 literals in brackets: [::1] — strip them.
  const h = (hostname.startsWith('[') ? hostname.slice(1, -1) : hostname).toLowerCase();

  if (h === '::1') return true; // loopback

  // Link-local fe80::/10 covers fe80:: through febf:: (first 10 bits = 1111111010)
  if (h.length >= 4) {
    const first4 = h.substring(0, 4);
    if (/^fe[89ab][0-9a-f]$/.test(first4)) {
      const val = parseInt(first4, 16);
      if (val >= 0xfe80 && val <= 0xfebf) return true;
    }
  }

  return false;
}

const BLOCKED_LITERAL_HOSTNAMES = new Set(['localhost', '0.0.0.0', '0', '::']);

function isSsrfHost(hostname: string): boolean {
  if (BLOCKED_LITERAL_HOSTNAMES.has(hostname.toLowerCase())) return true;
  if (isPrivateIpv4(hostname)) return true;
  if (isPrivateIpv6(hostname)) return true;
  return false;
}

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
  if (!isAllowedHost(hostname)) {
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
