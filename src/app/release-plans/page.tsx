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
    <main className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center overflow-hidden bg-white dark:bg-black pt-20 md:pt-24 pb-20">
      <div className="relative w-full max-w-6xl px-4 md:px-8 flex flex-col z-0 items-center text-center">
        <header className="mb-10 md:mb-14 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Release Plans</h1>
          <p className="mt-3 text-sm md:text-base text-gray-600 dark:text-gray-400">Central hub for roadmap browsing and future feature insights.</p>
        </header>
        <section aria-labelledby="release-plans-hub-heading" className="flex-1 w-full flex flex-col items-center">
          <h2 id="release-plans-hub-heading" className="sr-only">Release Plans navigation cards</h2>
          <div className="grid grid-cols-2 gap-5 md:gap-6 w-full max-w-4xl h-full place-items-stretch auto-rows-[13rem] md:auto-rows-[15rem]">
            {cards.map((card, idx) => (
              <div key={card.href} className="relative group animate-fade-up will-change-transform">
                <Link
                  href={card.href}
                  className="flex flex-col rounded-3xl border border-gray-200/60 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/65 backdrop-blur-lg shadow-[0_4px_18px_-6px_rgba(0,0,0,0.20)] dark:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.70)] p-5 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/60 dark:focus-visible:ring-primary-800/60 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 hover:border-primary-300/50 dark:hover:border-primary-600/50 hover:bg-white/90 dark:hover:bg-gray-900/75 h-full"
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
                      <h3 id={`hub-card-${idx}-title`} className="text-[1.05rem] md:text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                        {card.title}
                      </h3>
                    )}
                    <p className={`mt-1.5 text-xs md:text-[0.8rem] text-gray-700 dark:text-gray-300 leading-relaxed ${card.hideTitle ? 'mt-0' : ''}`}>{card.description}</p>
                  </div>
                  <span className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-transparent group-hover:ring-primary-300/50 dark:group-hover:ring-primary-700/40 transition" aria-hidden="true" />
                  <div className="pointer-events-none absolute -bottom-14 -right-14 h-44 w-44 rounded-full bg-primary-400/10 dark:bg-primary-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition duration-700" />
                  <div className="pointer-events-none absolute inset-px rounded-[calc(theme(borderRadius.3xl)-2px)] bg-gradient-to-br from-primary-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-700" />
                </Link>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-14 text-center">
          <Link href="/home" className="text-xs md:text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">← Back to Hub</Link>
        </div>
      </div>
    </main>
  );
}

