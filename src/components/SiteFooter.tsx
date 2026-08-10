import Link from 'next/link';

const SOURCE_LINKS = [
  { label: 'Microsoft 365 Message Center', href: '/message-center' },
  { label: 'Release Plans', href: '/release-plans' },
  { label: 'Product News', href: '/product-news' },
  { label: 'MSRC security updates', href: '/msrc' },
  { label: 'Support Lifecycle', href: '/ms-lifecycle' },
];

const linkClass =
  'rounded text-ink-muted transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
        <div className="max-w-md">
          <p className="type-h3 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300">
            Pulse 360&deg;
          </p>
          <p className="type-body-sm mt-2 text-ink-muted">
            A product-agnostic news and update portal by{' '}
            <a
              href="mailto:russ.rimmerman@microsoft.com?subject=Feedback about Pulse 360"
              className="font-medium text-accent hover:text-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Russ Rimmerman
            </a>
            , Microsoft Cloud Solution Architect.
          </p>
          <p className="type-meta mt-3 text-ink-subtle">
            Data is aggregated from public Microsoft sources and your configured tenant. Always
            confirm against the official source before acting on a change.
          </p>
        </div>

        <nav aria-label="Footer" className="lg:justify-self-end">
          <p className="type-eyebrow text-ink-subtle">Sections</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {SOURCE_LINKS.map(link => (
              <li key={link.href}>
                <Link href={link.href} className={`type-body-sm ${linkClass}`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="type-meta text-ink-subtle">
            &copy; {new Date().getFullYear()} Pulse 360. Not affiliated with or endorsed by
            Microsoft.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/about" className={`type-meta ${linkClass}`}>
              About
            </Link>
            <a
              href="https://www.linkedin.com/in/russrimm"
              target="_blank"
              rel="noopener noreferrer"
              className={`type-meta ${linkClass}`}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
