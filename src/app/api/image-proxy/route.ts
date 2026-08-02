import { NextRequest, NextResponse } from 'next/server';
import { isAllowedImageHost, isSsrfHost } from '@/lib/imageProxySecurity';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/x-icon',
]);

function badRequest(message: string): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code: 'BAD_REQUEST', message, source: 'image-proxy' } },
    { status: 400 }
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
    { status: 502 }
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return badRequest('Missing required query parameter: url');
  if (url.length > 4096) return badRequest('Invalid url: value is too long');

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return badRequest('Invalid url: must be a valid absolute URL');
  }

  if (parsed.protocol !== 'https:') {
    return badRequest('Invalid url: only https:// URLs are permitted');
  }

  if (isSsrfHost(parsed.hostname) || !isAllowedImageHost(parsed.hostname)) {
    return badRequest('Invalid url: target host is not permitted');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'manual',
      headers: { 'User-Agent': 'Pulse360-ImageProxy/1.0' },
    });
  } catch {
    return upstreamUnavailable();
  } finally {
    clearTimeout(timeoutId);
  }

  if (!upstream.ok || !upstream.body) return upstreamUnavailable();

  const contentType = (upstream.headers.get('Content-Type') ?? '').split(';', 1)[0].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) return upstreamUnavailable();

  const contentLength = Number(upstream.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    return upstreamUnavailable();
  }

  let transferredBytes = 0;
  const limitedBody = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, streamController) {
        transferredBytes += chunk.byteLength;
        if (transferredBytes > MAX_IMAGE_BYTES) {
          streamController.error(new Error('Upstream image exceeded the size limit'));
          return;
        }
        streamController.enqueue(chunk);
      },
    })
  );

  return new NextResponse(limitedBody, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Content-Security-Policy': "default-src 'none'; script-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
