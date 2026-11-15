import Link from 'next/link';
import { LevelChip, SeverityChip } from '@/components/HealthBadges';
import { MetaRow } from '@/components/MetaRow';
import { StatusChip } from '@/components/StatusChip';
import { SurfaceCard, type SurfaceTone } from '@/components/SurfaceCard';
import { CLASSIFICATION_LABELS, formatHealthDate } from '@/lib/health/status';
import type { HealthEvent } from '@/lib/health/types';

const ACCENTS: Record<HealthEvent['severity'], SurfaceTone> = {
  critical: 'critical',
  warning: 'warn',
  informational: 'info',
};

export function HealthEventCard({ event }: { event: HealthEvent }) {
  const accent = event.isActive ? ACCENTS[event.severity] : 'ok';

  return (
    <li data-health-event-id={event.id} className="min-w-0">
      <Link
        href={`/service-health/${encodeURIComponent(event.id)}`}
        className="group block h-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <SurfaceCard interactive accent={accent} className="gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {event.isActive ? <SeverityChip severity={event.severity} /> : null}
            <StatusChip tone="neutral">{CLASSIFICATION_LABELS[event.classification]}</StatusChip>
            <LevelChip level={event.isActive ? event.level : 'operational'} label={event.statusLabel} />
          </div>

          <h3 className="type-card-title line-clamp-3 break-words text-ink transition-colors group-hover:text-accent">
            {event.title}
          </h3>

          <p className="type-body-sm text-ink-muted">
            {event.service}
            {event.feature ? ` · ${event.feature}` : ''}
          </p>

          {event.impact ? (
            <p className="type-body-sm line-clamp-3 text-ink-muted">{event.impact}</p>
          ) : null}

          <MetaRow
            className="mt-auto pt-1"
            items={[
              event.id,
              `Updated ${formatHealthDate(event.lastModifiedAt)}`,
              event.endedAt ? `Ended ${formatHealthDate(event.endedAt)}` : null,
            ]}
          />
        </SurfaceCard>
      </Link>
    </li>
  );
}
