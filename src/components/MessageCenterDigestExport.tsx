import Link from 'next/link';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const LINK_CLASS =
  'type-body-sm inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-3 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/** One-click 7-day Power Platform and Copilot Studio digest download. */
export function MessageCenterDigestExport() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="digest-export">
      <a
        href="/api/briefing/digest?days=7&format=csv"
        download
        className="type-body-sm inline-flex min-h-9 items-center gap-2 rounded-lg bg-accent px-4 font-medium text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
        Export 7-day digest (CSV)
      </a>
      <a href="/api/briefing/digest?days=7&format=md" download className={LINK_CLASS}>
        Markdown
      </a>
      <a href="/api/briefing/digest?days=7&format=json" download className={LINK_CLASS}>
        JSON
      </a>
      <Link href="/briefing" className={LINK_CLASS}>
        Weekly briefing
      </Link>
      <span className="type-meta text-ink-subtle">
        Power Platform &amp; Copilot Studio posts from the last 7 days.
      </span>
    </div>
  );
}
