import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BriefingEditor } from '@/components/briefing/BriefingEditor';
import { loadBriefing } from '@/lib/briefing/data.server';
import {
  buildBriefingModel,
  parseScope,
  scopeLabel,
  type BriefingScope,
} from '@/lib/briefing/model';
import { loadReleasePlanSection } from '@/lib/briefing/release-plan';
import { releasePlannerProvider } from '@/lib/briefing/release-plan.server';
import { resolveWeekKey, shiftWeekKey, weekWindow, formatWindowLabel } from '@/lib/briefing/week';
import { getMessageCenterAccess } from '@/lib/message-center-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Weekly Customer Briefing',
  description:
    'Draft a weekly Power Platform and Copilot Studio briefing from Message Center, with action items first.',
  robots: { index: false, follow: false },
};

interface BriefingPageProps {
  searchParams: Promise<{ week?: string | string[]; scope?: string | string[] }>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const SCOPES: { value: BriefingScope; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'power-platform', label: 'Power Platform' },
  { value: 'copilot-studio', label: 'Copilot Studio' },
];

function briefingHref(week: string, scope: BriefingScope): string {
  return `/briefing?week=${week}&scope=${scope}`;
}

export default async function BriefingPage({ searchParams }: BriefingPageProps) {
  const access = await getMessageCenterAccess();
  if (access === 'unconfigured') {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center" role="alert">
        <h1 className="type-h1 text-ink">Weekly briefing unavailable</h1>
        <p className="type-body mt-3 text-ink-muted">
          The briefing uses Message Center data, and anonymous access is disabled by
          MESSAGE_CENTER_PUBLIC=false. Configure tenant sign-in or remove the override.
        </p>
      </section>
    );
  }
  if (access === 'authentication-required') {
    redirect('/api/auth/signin?callbackUrl=%2Fbriefing');
  }

  const params = await searchParams;
  const weekKey = resolveWeekKey(first(params.week));
  const scope = parseScope(first(params.scope));
  const previousWeek = shiftWeekKey(weekKey, -1);
  const nextWeek = shiftWeekKey(weekKey, 1);

  let loaded: Awaited<ReturnType<typeof loadBriefing>> | null = null;
  if (process.env.DATABASE_URL) {
    try {
      loaded = await loadBriefing(weekKey, scope);
    } catch (error) {
      console.error('Weekly briefing query failed:', error);
    }
  }

  const releasePlan = loaded
    ? await loadReleasePlanSection(releasePlannerProvider, weekKey, scope)
    : null;
  const model = loaded?.model ?? buildBriefingModel([], weekKey, scope);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <p className="type-eyebrow text-accent">Tenant</p>
          <h1 className="type-h1 mt-1 text-ink">Weekly Customer Briefing</h1>
          <p className="type-body mt-2 max-w-3xl text-ink-muted">
            A {scopeLabel(scope)} Message Center briefing for the week of {weekKey}, covering{' '}
            {formatWindowLabel(weekWindow(weekKey))} (UTC), with action-needed items first. Edit the
            draft, then copy it into Outlook.
          </p>
          <nav
            aria-label="Briefing week and scope"
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <Link
              href={briefingHref(previousWeek, scope)}
              className="type-body-sm inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-3 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              ← Previous week
            </Link>
            <span className="type-body-sm px-2 font-medium text-ink">Week of {weekKey}</span>
            <Link
              href={briefingHref(nextWeek, scope)}
              className="type-body-sm inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-3 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Next week →
            </Link>
            <span className="mx-2 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
            {SCOPES.map(option => (
              <Link
                key={option.value}
                href={briefingHref(weekKey, option.value)}
                aria-current={option.value === scope ? 'page' : undefined}
                className={`type-body-sm inline-flex min-h-9 items-center rounded-lg border px-3 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  option.value === scope
                    ? 'border-accent bg-accent-soft text-accent-ink'
                    : 'border-line-strong bg-surface text-ink hover:bg-surface-sunken'
                }`}
              >
                {option.label}
              </Link>
            ))}
          </nav>
          {loaded?.source === 'snapshot' ? (
            <p className="type-meta mt-3 text-ink-subtle">
              Showing the Monday snapshot saved for this week.
            </p>
          ) : null}
        </header>
        {loaded ? (
          <BriefingEditor key={`${weekKey}-${scope}`} model={model} releasePlan={releasePlan} />
        ) : (
          <div
            className="rounded-xl border border-line bg-surface px-6 py-8 text-center text-ink"
            role="status"
          >
            <h2 className="type-h3">Message Center data is unavailable</h2>
            <p className="type-body-sm mx-auto mt-2 max-w-xl">
              The briefing reads synced Message Center posts from Postgres. Set DATABASE_URL (see
              .env.example) and check the Message Center sync, or try again in a few seconds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
