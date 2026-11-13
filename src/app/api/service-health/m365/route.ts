import { NextResponse } from 'next/server';
import { getServiceHealthAccess } from '@/lib/health/access';
import { describeHealthError, toHealthError, type HealthErrorKind } from '@/lib/health/errors';
import { getM365Health, isM365HealthConfigured } from '@/lib/health/m365';

export const dynamic = 'force-dynamic';

const STATUS_BY_KIND: Record<HealthErrorKind, number> = {
  'not-configured': 503,
  forbidden: 502,
  throttled: 429,
  quota: 429,
  'not-found': 404,
  unavailable: 503,
};

function errorResponse(kind: HealthErrorKind, status = STATUS_BY_KIND[kind]) {
  return NextResponse.json(
    { error: { kind, message: describeHealthError(kind).title } },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

/** Tenant-gated JSON snapshot of Microsoft 365 service health. */
export async function GET() {
  const access = await getServiceHealthAccess();
  if (access === 'authentication-required') {
    return NextResponse.json({ error: { message: 'Authentication required' } }, { status: 401 });
  }
  if (access === 'unconfigured') {
    return NextResponse.json({ error: { message: 'Access disabled' } }, { status: 403 });
  }
  if (!isM365HealthConfigured()) return errorResponse('not-configured');

  try {
    const snapshot = await getM365Health();
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'private, max-age=30' } });
  } catch (error) {
    const healthError = toHealthError(error);
    console.error('Service Health API failed:', healthError.kind, healthError.status ?? '');
    return errorResponse(healthError.kind);
  }
}
