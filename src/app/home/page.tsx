import { ArrowUpRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAzureUpdateSummaries, getM365UpdateSummaries } from '@/lib/update-summaries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pulse 360° | Microsoft updates, one view',
  description:
    'Microsoft cloud news, roadmaps, lifecycle dates, security updates, and tenant Message Center changes in one place.',
};

interface LatestItem {
  id: string;
  title: string;
  href: string;
  date: string;
}

const LATEST_COUNT = 5;

async function loadLatest(
  load: () => Promise<Array<{ id: string; title: string; date: string }>>,
  hrefFor: (id: string) => string
): Promise<LatestItem[]> {
  try {
    const items = await load();
    return items
      .toSorted((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, LATEST_COUNT)
      .map(item => ({ ...item, href: hrefFor(item.id) }));
  } catch {
    return [];
  }
}

function formatDay(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Home hub page: card grid linking to key sections plus a "what changed" strip
export default async function HomePage() {
  const [latestM365, latestAzure] = await Promise.all([
    loadLatest(
      async () =>
        (await getM365UpdateSummaries()).map(update => ({
          id: update.id,
          title: update.title,
          date: update.published,
        })),
      id => `/m365-update/${id}`
    ),
    loadLatest(
      async () =>
        (await getAzureUpdateSummaries()).map(update => ({
          id: update.id,
          title: update.title,
          date: update.modified,
        })),
      id => `/azure-update/${id}`
    ),
  ]);
  const latestSections = [
    { heading: 'Latest AI at Work roadmap updates', href: '/release-plans/m365', items: latestM365 },
    { heading: 'Latest Azure updates', href: '/release-plans/azure', items: latestAzure },
  ].filter(section => section.items.length > 0);

  const cards = [
    {
      href: '/message-center',
      title: 'Message Center',
      description: 'Curated Microsoft 365 and Power Platform change notifications',
    },
    {
      href: '/release-plans',
      title: 'Release Plans',
      description: 'Track upcoming features on the AI at Work roadmap, Azure, and Fabric',
    },
    {
      href: '/product-news',
      title: 'Product News',
      description: 'Latest product & platform announcements',
    },
    {
      href: '/security',
      title: 'Security & Advisories',
      description: 'Security, service health & incident posture',
    },
    {
      href: '/ms-lifecycle',
      title: 'Microsoft Support Lifecycle',
      description: 'Plan ahead with Microsoft product support dates and Azure feature retirements.',
    },
  ];

  // Map for card images to eliminate repeated conditional blocks
  const heroImages: Record<string, { src: string; alt: string; priority?: boolean }> = {
    '/message-center': {
      src: '/images/m365messagecenter.png',
      alt: 'Microsoft 365 Message Center',
      priority: true,
    },
    '/release-plans': { src: '/images/releaseplans.png', alt: 'Release Plans' },
    '/product-news': { src: '/images/productnews.png', alt: 'Product News' },
    '/security': { src: '/images/securityadvisories.png', alt: 'Security & Advisories' },
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-canvas text-ink">
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <header className="mb-8 max-w-3xl sm:mb-10">
          <p className="type-eyebrow mb-3 text-accent">Microsoft updates, one view</p>
          <h1 className="type-display text-ink">Pulse 360&deg;</h1>
          <p className="type-body mt-3 max-w-2xl text-ink-muted">
            Follow service changes, product roadmaps, security advisories, and support milestones
            across the Microsoft cloud.
          </p>
        </header>

        <section aria-labelledby="hub-navigation-heading">
          <h2 id="hub-navigation-heading" className="sr-only">
            Explore Pulse 360
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(card => (
              <Link
                key={card.href}
                href={card.href}
                className={`group relative flex min-h-64 flex-col overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:shadow-none ${
                  card.href === '/ms-lifecycle' ? 'sm:col-span-2 lg:col-span-4 lg:min-h-52' : ''
                }`}
              >
                <span
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
                    card.href === '/ms-lifecycle'
                      ? 'from-primary-600 to-primary-400'
                      : 'from-ink to-accent'
                  }`}
                  aria-hidden="true"
                />

                <div
                  className={`flex flex-1 ${
                    card.href === '/ms-lifecycle' ? 'items-center gap-6' : 'flex-col'
                  }`}
                >
                  {card.href === '/ms-lifecycle' ? (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                      <CalendarDaysIcon className="h-7 w-7" aria-hidden="true" />
                    </div>
                  ) : (
                    <Image
                      src={heroImages[card.href].src}
                      alt=""
                      width={160}
                      height={90}
                      priority={heroImages[card.href].priority}
                      className="mt-5 h-16 w-auto max-w-full object-contain object-left dark:brightness-110"
                    />
                  )}

                  <div className={card.href === '/ms-lifecycle' ? 'max-w-2xl' : 'pt-6'}>
                    <h3 className="type-h3 text-ink">
                      {card.title}
                    </h3>
                    <p className="type-body-sm mt-2 text-ink-muted">{card.description}</p>
                  </div>
                </div>

                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Explore
                  <ArrowUpRightIcon
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {latestSections.length > 0 ? (
          <section aria-labelledby="latest-heading" className="mt-12">
            <h2 id="latest-heading" className="type-h2 mb-4 text-ink">
              What changed recently
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {latestSections.map(section => (
                <div
                  key={section.href}
                  className="rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <h3 className="type-h3 text-ink">{section.heading}</h3>
                    <Link
                      href={section.href}
                      className="type-body-sm font-medium text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      View all
                    </Link>
                  </div>
                  <ul className="divide-y divide-line">
                    {section.items.map(item => (
                      <li key={item.id} className="py-2.5">
                        <Link
                          href={item.href}
                          className="type-body-sm line-clamp-2 font-medium text-ink hover:text-accent-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {item.title}
                        </Link>
                        <p className="type-meta mt-0.5 text-ink-subtle">{formatDay(item.date)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
