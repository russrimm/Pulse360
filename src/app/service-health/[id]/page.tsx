import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { LevelChip, SeverityChip } from '@/components/HealthBadges';
import { SafeHtml } from '@/components/SafeHtml';
import { ServiceHealthStatusPanel } from '@/components/ServiceHealthStatusPanel';
import { StatusChip } from '@/components/StatusChip';
import { getServiceHealthAccess } from '@/lib/health/access';
import { HealthError, toHealthError } from '@/lib/health/errors';
import { getM365HealthIssue, isM365HealthConfigured } from '@/lib/health/m365';
import { CLASSIFICATION_LABELS, formatHealthDate, isValidHealthIssueId } from '@/lib/health/status';
import type { HealthEvent } from '@/lib/health/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Service Health Issue | Pulse 360',
  robots: { index: false, follow: false },
};

interface ServiceHealthIssuePageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceHealthIssuePage({ params }: ServiceHealthIssuePageProps) {
  const { id } = await params;
  if (!isValidHealthIssueId(id)) notFound();

  const access = await getServiceHealthAccess();
  if (access === 'unconfigured') notFound();
  if (access === 'authentication-required') {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/service-health/${id}`)}`);
  }

  let event: HealthEvent | null = null;
  let error: HealthError | null = null;
  if (!isM365HealthConfigured()) {
    error = new HealthError('not-configured', 'Graph is not configured');
  } else {
    try {
      event = await getM365HealthIssue(id);
    } catch (caught) {
      error = toHealthError(caught);
      console.error('Service Health issue load failed:', error.kind, error.status ?? '');
    }
  }
  if (!error && !event) notFound();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/service-health"
          className="type-body-sm inline-flex items-center gap-2 font-medium text-ink-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true">←</span>
          Back to Service Health
        </Link>

        <div className="mt-6">
          {error ? (
            <ServiceHealthStatusPanel kind={error.kind} retryHref={`/service-health/${id}`} />
          ) : event ? (
            <IssueDetail event={event} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function IssueDetail({ event }: { event: HealthEvent }) {
  const posts = [...event.posts].reverse();

  return (
    <article data-service-health-issue={event.id}>
      <div className="flex flex-wrap items-center gap-1.5">
        {event.isActive ? <SeverityChip severity={event.severity} /> : null}
        <StatusChip tone="neutral">{CLASSIFICATION_LABELS[event.classification]}</StatusChip>
        <LevelChip level={event.isActive ? event.level : 'operational'} label={event.statusLabel} />
        <StatusChip tone="accent">{event.isActive ? 'Active' : 'Resolved'}</StatusChip>
      </div>

      <h1 className="type-h1 mt-3 break-words text-ink">{event.title}</h1>
      <p className="type-body mt-2 text-ink-muted">
        {event.service}
        {event.feature ? ` · ${event.feature}` : ''}
        {event.featureGroup ? ` (${event.featureGroup})` : ''}
      </p>

      <dl className="type-body-sm mt-6 grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
        <Field label="Issue ID" value={event.id} />
        <Field label="Started" value={formatHealthDate(event.startedAt)} />
        <Field label="Last updated" value={formatHealthDate(event.lastModifiedAt)} />
        <Field label="Ended" value={event.endedAt ? formatHealthDate(event.endedAt) : 'Not ended'} />
        {event.origin ? <Field label="Origin" value={event.origin} /> : null}
        {event.details.map(detail => (
          <Field key={detail.name} label={detail.name} value={detail.value} />
        ))}
      </dl>

      {event.impact ? (
        <section className="mt-8" aria-labelledby="impact-heading">
          <h2 id="impact-heading" className="type-h3 text-ink">
            User impact
          </h2>
          <p className="type-body mt-2 whitespace-pre-line text-ink-muted">{event.impact}</p>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="updates-heading">
        <h2 id="updates-heading" className="type-h3 text-ink">
          Updates
        </h2>
        {posts.length === 0 ? (
          <p className="type-body-sm mt-2 rounded-xl border border-line bg-surface px-4 py-4 text-ink-muted" role="status">
            Microsoft has not published any updates for this issue yet.
          </p>
        ) : (
          <ol className="mt-3 flex flex-col gap-4">
            {posts.map((post, index) => (
              <li key={`${post.createdAt}-${index}`} className="rounded-xl border border-line bg-surface p-4">
                <p className="type-meta text-ink-subtle">
                  {formatHealthDate(post.createdAt)}
                  {post.kind && post.kind !== 'regular' ? ` · ${post.kind}` : ''}
                </p>
                {post.contentType === 'html' ? (
                  <SafeHtml
                    html={post.content}
                    className="type-body-sm prose prose-sm dark:prose-invert mt-2 max-w-none break-words text-ink-muted"
                  />
                ) : (
                  <p className="type-body-sm mt-2 whitespace-pre-line break-words text-ink-muted">
                    {post.content}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="type-meta font-semibold uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 break-words text-ink">{value}</dd>
    </div>
  );
}
