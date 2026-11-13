import Link from 'next/link';
import { describeHealthError, type HealthErrorKind } from '@/lib/health/errors';

interface ServiceHealthStatusPanelProps {
  kind: HealthErrorKind;
  retryHref?: string;
}

/**
 * Full-page state for when no health data can be shown. Pages render this
 * instead of any status or list, so "unknown" is never presented as "healthy".
 */
export function ServiceHealthStatusPanel({
  kind,
  retryHref = '/service-health',
}: ServiceHealthStatusPanelProps) {
  const copy = describeHealthError(kind);
  const toneClass =
    copy.tone === 'warn'
      ? 'border-warn/30 bg-warn-soft text-warn-ink'
      : 'border-line bg-surface text-ink';

  return (
    <div
      className={`rounded-xl border px-6 py-8 text-center ${toneClass}`}
      role={copy.tone === 'warn' ? 'alert' : 'status'}
      data-service-health-state={kind}
    >
      <h2 className="type-h3">{copy.title}</h2>
      <p className="type-body-sm mx-auto mt-2 max-w-xl">{copy.body}</p>
      {copy.showRetry ? (
        <Link
          href={retryHref}
          prefetch={false}
          className="type-body-sm mt-4 inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Try again
        </Link>
      ) : null}
    </div>
  );
}
