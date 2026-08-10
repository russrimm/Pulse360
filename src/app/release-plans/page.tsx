import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HubCard {
  href: string;
  title: string;
  description: string;
  image?: { src: string; alt: string; };
  hideTitle?: boolean;
}

export const metadata = {
  title: 'Release Plans Hub | Pulse 360',
  description: 'Navigation hub for Dynamics 365 & Power Platform roadmap and related resources.'
};

export default function ReleasePlansHubPage() {
  const cards: HubCard[] = [
    {
      href: '/release-plans/dynamics-power',
      title: 'Power Platform & Dynamics',
      description: 'Power Platform & Dynamics',
      image: { src: '/icons/PowerPlatform_scalable.svg', alt: 'Power Platform & Dynamics' },
      hideTitle: true
    },
    {
      href: '/release-plans/azure',
      title: 'Azure',
      description: 'Azure',
      image: { src: '/icons/Azure.svg', alt: 'Azure' },
      hideTitle: true
    },
    {
      href: '/release-plans/m365',
      title: 'Microsoft 365',
      description: 'Microsoft 365',
      image: { src: '/icons/m365.svg', alt: 'Microsoft 365' },
      hideTitle: true
    },
    {
      href: '/release-plans/fabric',
      title: 'Fabric',
      description: 'Fabric',
      image: { src: '/icons/fabric_48_color.svg', alt: 'Microsoft Fabric' },
      hideTitle: true
    }
  ];

  return (
    <main className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center overflow-hidden bg-canvas pt-10 md:pt-12 pb-16">
      <div className="relative w-full max-w-6xl px-4 md:px-8 flex flex-col z-0 items-center text-center">
        <header className="mb-10 md:mb-12 max-w-2xl">
          <h1 className="type-h1 text-ink">Release Plans</h1>
          <p className="type-body mt-3 text-ink-muted">Central hub for roadmap browsing and future feature insights.</p>
        </header>
        <section aria-labelledby="release-plans-hub-heading" className="flex-1 w-full flex flex-col items-center">
          <h2 id="release-plans-hub-heading" className="sr-only">Release Plans navigation cards</h2>
          <div className="grid grid-cols-2 gap-5 md:gap-6 w-full max-w-4xl h-full place-items-stretch auto-rows-[11rem] md:auto-rows-[13rem] lg:grid-cols-4">
            {cards.map((card, idx) => (
              <div key={card.href} className="relative group animate-fade-up will-change-transform">
                <Link
                  href={card.href}
                  className="flex flex-col rounded-2xl border border-line bg-surface p-5 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/40 h-full"
                  aria-labelledby={card.hideTitle ? undefined : `hub-card-${idx}-title`}
                >
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    {card.image && (
                      <Image
                        src={card.image.src}
                        alt={card.image.alt}
                        width={160}
                        height={90}
                        className="w-32 h-auto mb-4 rounded-md shadow-sm dark:shadow-none object-contain"
                      />
                    )}
                    {!card.hideTitle && (
                      <h3 id={`hub-card-${idx}-title`} className="type-h3 text-ink">
                        {card.title}
                      </h3>
                    )}
                    <p className={`type-body-sm text-ink-muted ${card.hideTitle ? 'mt-0' : 'mt-1.5'}`}>{card.description}</p>
                  </div>
                  <div className="pointer-events-none absolute -bottom-14 -right-14 h-44 w-44 rounded-full bg-accent/10 blur-3xl opacity-0 group-hover:opacity-100 transition duration-700" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-12 text-center">
          <Link href="/home" className="type-body-sm font-medium text-accent hover:underline">← Back to Hub</Link>
        </div>
      </div>
    </main>
  );
}

