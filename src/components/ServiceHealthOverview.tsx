import Link from 'next/link';
import { LevelChip } from '@/components/HealthBadges';
import { SurfaceCard } from '@/components/SurfaceCard';
import type { HealthSummary } from '@/lib/health/query';
import type { HealthSnapshot } from '@/lib/health/types';

interface ServiceHealthOverviewProps {
  snapshot: HealthSnapshot;
  summary: HealthSummary;
}

function plural(count: number, noun: string): string {
  return `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`;
}

function headlineCopy(
  summary: HealthSummary,
  snapshot: HealthSnapshot
): { text: string; tone: 'ok' | 'warn' | 'neutral' } {
  switch (summary.headline) {
    case 'healthy':
      return { text: 'All services are operational and no issues are active.', tone: 'ok' };
    case 'impact':
      return {
        text: `${plural(summary.affectedServiceCount, 'service')} reporting problems, ${plural(summary.activeEventCount, 'active issue')}.`,
        tone: 'warn',
      };
    case 'advisories-only':
      return {
        text: `${plural(summary.activeEventCount, 'active issue')}. Services otherwise report operational.`,
        tone: 'warn',
      };
    case 'unknown':
      return {
        text:
          snapshot.sections.services === 'unavailable'
            ? 'Current service status is unknown.'
            : 'Service status loaded, but issue history is incomplete, so overall health is not confirmed.',
        tone: 'neutral',
      };
  }
}

const bannerTone = {
  ok: 'border-ok/30 bg-ok-soft text-ok-ink',
  warn: 'border-warn/30 bg-warn-soft text-warn-ink',
  neutral: 'border-line bg-surface text-ink',
} as const;

/** Headline plus one tile per service, worst first. Tiles link to that service's issues. */
export function ServiceHealthOverview({ snapshot, summary }: ServiceHealthOverviewProps) {
  const headline = headlineCopy(summary, snapshot);
  const eventCounts = new Map<string, number>();
  for (const event of snapshot.events) {
    eventCounts.set(event.service, (eventCounts.get(event.service) ?? 0) + 1);
  }

  return (
    <section aria-labelledby="service-overview-heading" data-service-health-section="overview">
      <h2 id="service-overview-heading" className="type-h3 mb-3 text-ink">
        Service status
      </h2>

      <p
        role="status"
        data-service-health-headline={summary.headline}
        className={`type-body-sm mb-4 rounded-xl border px-4 py-3 font-medium ${bannerTone[headline.tone]}`}
      >
        {headline.text}
      </p>

      {snapshot.sections.services === 'unavailable' ? (
        <div
          role="alert"
          data-service-health-section-state="services-unavailable"
          className="type-body-sm rounded-xl border border-warn/30 bg-warn-soft px-4 py-4 text-warn-ink"
        >
          Current status for each service could not be loaded. Issues below may still be listed.
        </div>
      ) : snapshot.services.length === 0 ? (
        <p className="type-body-sm rounded-xl border border-line bg-surface px-4 py-4 text-ink-muted" role="status">
          Microsoft Graph returned no services for this tenant.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {snapshot.services.map(service => {
            const eventCount = eventCounts.get(service.name) ?? 0;
            const accent =
              service.level === 'operational'
                ? 'ok'
                : service.level === 'interruption' || service.level === 'extended'
                  ? 'critical'
                  : 'warn';
            const body = (
              <SurfaceCard as="div" accent={accent} interactive={eventCount > 0} flush>
                <div className="flex flex-col gap-1.5 py-3 pr-3 pl-2">
                  <p className="type-card-title break-words text-ink">{service.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <LevelChip level={service.level} label={service.statusLabel} />
                    {service.activeEventCount > 0 ? (
                      <span className="type-meta text-ink-subtle">
                        {plural(service.activeEventCount, 'active issue')}
                      </span>
                    ) : null}
                  </div>
                </div>
              </SurfaceCard>
            );
            return (
              <li key={service.id} data-service-name={service.name}>
                {eventCount > 0 ? (
                  <Link
                    href={`/service-health?${new URLSearchParams({ service: service.name }).toString()}#issues`}
                    className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`${service.name}: ${service.statusLabel}. View ${plural(eventCount, 'issue')}`}
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
