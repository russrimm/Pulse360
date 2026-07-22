import { ArrowUpRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

// Home hub page: static card grid linking to key sections
export default function HomePage() {
  const cards = [
    {
      href: '/message-center',
      title: 'Message Center',
      description: 'Curated Microsoft 365 and Power Platform change notifications',
    },
    {
      href: '/release-plans',
      title: 'Release Plans',
      description: 'Track upcoming features & roadmap items',
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

  // Central set of hero cards that use an image instead of a visible heading
  const HERO_CARD_PATHS = new Set([
    '/message-center',
    '/release-plans',
    '/product-news',
    '/security',
  ]);

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
    <main className="relative min-h-full overflow-hidden bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-white">
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
            Microsoft updates, one view
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Follow service changes, product roadmaps, security advisories, and support milestones
            across the Microsoft cloud.
          </p>
        </header>

        <section aria-labelledby="hub-navigation-heading">
          <h2 id="hub-navigation-heading" className="sr-only">
            Explore Pulse 360
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, idx) => (
              <Link
                key={card.href}
                href={card.href}
                aria-labelledby={`card-${idx}-title`}
                className={`group relative flex min-h-64 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/60 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 ${
                  card.href === '/ms-lifecycle' ? 'sm:col-span-2 lg:col-span-4 lg:min-h-52' : ''
                }`}
              >
                <span
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
                    card.href === '/ms-lifecycle'
                      ? 'from-blue-600 to-sky-400'
                      : 'from-slate-800 to-sky-500 dark:from-slate-400 dark:to-sky-400'
                  }`}
                  aria-hidden="true"
                />

                <div
                  className={`flex flex-1 ${
                    card.href === '/ms-lifecycle' ? 'items-center gap-6' : 'flex-col'
                  }`}
                >
                  {card.href === '/ms-lifecycle' ? (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
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
                    <h3
                      id={`card-${idx}-title`}
                      className="text-lg font-semibold tracking-normal text-slate-950 dark:text-white"
                    >
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {card.description}
                    </p>
                  </div>
                </div>

                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
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
      </div>
    </main>
  );
}
