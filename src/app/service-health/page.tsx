import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ServiceHealthEvents } from '@/components/ServiceHealthEvents';
import { ServiceHealthOverview } from '@/components/ServiceHealthOverview';
import { ServiceHealthStatusPanel } from '@/components/ServiceHealthStatusPanel';
import { getServiceHealthAccess } from '@/lib/health/access';
import { HealthError, toHealthError } from '@/lib/health/errors';
import { getM365Health, isM365HealthConfigured } from '@/lib/health/m365';
import { HEALTH_FACET_KEYS, healthListConfig, summarizeHealth } from '@/lib/health/query';
import { formatHealthDate } from '@/lib/health/status';
import type { HealthSnapshot } from '@/lib/health/types';
import { parseListParams, queryList } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Microsoft 365 Service Health | Pulse 360',
  description: 'Current status, incidents, and advisories for your Microsoft 365 tenant.',
  robots: { index: false, follow: false },
};

interface ServiceHealthPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type LoadResult =
  | { state: 'ready'; snapshot: HealthSnapshot }
  | { state: 'error'; error: HealthError };

async function loadSnapshot(): Promise<LoadResult> {
  if (!isM365HealthConfigured()) {
    return { state: 'error', error: new HealthError('not-configured', 'Graph is not configured') };
  }
  try {
    return { state: 'ready', snapshot: await getM365Health() };
  } catch (error) {
    const healthError = toHealthError(error);
    console.error('Service Health load failed:', healthError.kind, healthError.status ?? '');
    return { state: 'error', error: healthError };
  }
}

export default async function ServiceHealthPage({ searchParams }: ServiceHealthPageProps) {
  const access = await getServiceHealthAccess();
  if (access === 'unconfigured') {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center" role="alert">
        <h1 className="type-h1 text-ink">Service Health unavailable</h1>
        <p className="type-body mt-3 text-ink-muted">
          Anonymous access is disabled by SERVICE_HEALTH_PUBLIC=false. Configure tenant sign-in or
          remove the override to view Service Health data.
        </p>
      </section>
    );
  }
  if (access === 'authentication-required') {
    redirect('/api/auth/signin?callbackUrl=%2Fservice-health');
  }

  const [load, rawParams] = await Promise.all([loadSnapshot(), searchParams]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="type-eyebrow text-accent">Tenant</p>
          <h1 className="type-h1 mt-1 text-ink">Microsoft 365 Service Health</h1>
          <p className="type-body mt-2 max-w-3xl text-ink-muted">
            Current status, incidents, and advisories for the services your tenant uses.
          </p>
          <p className="type-meta mt-3 text-ink-subtle">
            Source: Microsoft Graph Service Health for the configured tenant
            {load.state === 'ready' ? (
              <>
                {' · '}
                Refreshed{' '}
                <time dateTime={load.snapshot.fetchedAt} className="whitespace-nowrap">
                  {formatHealthDate(load.snapshot.fetchedAt)}
                </time>
              </>
            ) : null}
            . Always use the Microsoft 365 admin center as the source of truth.
          </p>
        </header>

        {load.state === 'error' ? (
          <ServiceHealthStatusPanel kind={load.error.kind} />
        ) : (
          <ServiceHealthReady snapshot={load.snapshot} rawParams={rawParams} />
        )}
      </div>
    </div>
  );
}

function ServiceHealthReady({
  snapshot,
  rawParams,
}: {
  snapshot: HealthSnapshot;
  rawParams: Record<string, string | string[] | undefined>;
}) {
  const params = parseListParams(rawParams, [...HEALTH_FACET_KEYS]);
  const result = queryList(snapshot.events, params, healthListConfig);
  const summary = summarizeHealth(snapshot);

  return (
    <div className="flex flex-col gap-10">
      {snapshot.warnings.length > 0 ? (
        <div
          role="status"
          data-service-health-warnings
          className="type-body-sm rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-warn-ink"
        >
          <p className="font-semibold">Some data may be incomplete</p>
          <ul className="mt-1 list-disc pl-5">
            {snapshot.warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ServiceHealthOverview snapshot={snapshot} summary={summary} />

      <ServiceHealthEvents
        basePath="/service-health"
        params={params}
        result={result}
        eventsState={snapshot.sections.events}
        windowDays={snapshot.windowDays}
      />

      <p className="type-meta text-ink-subtle">
        Issues are limited to those that started in the last {snapshot.windowDays} days. Need
        something older?{' '}
        <a
          href="https://admin.microsoft.com/Adminportal/Home#/servicehealth"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Open the Microsoft 365 admin center
        </a>
        .
      </p>
    </div>
  );
}
