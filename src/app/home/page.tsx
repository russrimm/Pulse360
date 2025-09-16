import React from "react";
import Link from "next/link";
import Image from "next/image";

// Home hub page: static card grid linking to key sections
export default function HomePage() {
  const cards = [
    { href: "/message-center", title: "Message Center", description: "Curated Microsoft 365 and Power Platform change notifications" },
    { href: "/release-plans", title: "Release Plans", description: "Track upcoming features & roadmap items" },
    { href: "/product-news", title: "Product News", description: "Latest product & platform announcements" },
    { href: "/security", title: "Security & Advisories", description: "Security, service health & incident posture" }
  ];

  // Central set of hero cards that use an image instead of a visible heading
  const HERO_CARD_PATHS = new Set(["/message-center","/release-plans","/product-news","/security"]);

  // Map for card images to eliminate repeated conditional blocks
  const heroImages: Record<string, { src: string; alt: string; priority?: boolean }> = {
    "/message-center": { src: "/images/m365messagecenter.png", alt: "Microsoft 365 Message Center", priority: true },
    "/release-plans": { src: "/images/releaseplans.png", alt: "Release Plans" },
    "/product-news": { src: "/images/productnews.png", alt: "Product News" },
    "/security": { src: "/images/securityadvisories.png", alt: "Security & Advisories" }
  };

  const cardBaseClasses = "flex flex-col rounded-3xl border border-gray-200/60 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/65 backdrop-blur-lg shadow-[0_4px_18px_-6px_rgba(0,0,0,0.20)] dark:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.70)] p-5 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/60 dark:focus-visible:ring-primary-800/60 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 hover:border-primary-300/50 dark:hover:border-primary-600/50 hover:bg-white/90 dark:hover:bg-gray-900/75 h-full";

  return (
    <main className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center overflow-hidden bg-white dark:bg-black pt-24 md:pt-28">
      {/* Floating icons removed per request */}
      <div className="relative w-full max-w-7xl px-4 md:px-10 flex flex-col z-0">
        {/* 2x2 Corner Grid (header removed per request) */}
        <section aria-labelledby="hub-navigation-heading" className="relative flex-1 flex items-center">
          <h2 id="hub-navigation-heading" className="sr-only">Primary navigation cards</h2>
          <div className="grid grid-cols-2 gap-5 md:gap-6 w-full max-w-4xl mx-auto h-full place-items-stretch content-center auto-rows-[13rem] md:auto-rows-[15rem] stagger-children">
            {cards.map((card, idx) => (
              <div key={card.href} className="relative group stagger-animate animate-fade-up will-change-transform">
                <Link
                  href={card.href}
                  className={cardBaseClasses}
                  aria-labelledby={HERO_CARD_PATHS.has(card.href) ? undefined : `card-${idx}-title`}
                >
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                  {heroImages[card.href] && (
                    <>
                      <Image
                        src={heroImages[card.href].src}
                        alt={heroImages[card.href].alt}
                        width={160}
                        height={90}
                        priority={heroImages[card.href].priority}
                        className="w-32 h-auto mb-4 rounded-md shadow-sm dark:shadow-none object-contain"
                      />
                      {/* Provide an off-screen heading for screen readers to ensure a clear accessible name */}
                      <h3 id={`card-${idx}-title`} className="sr-only">{card.title}</h3>
                    </>
                  )}
                  {!HERO_CARD_PATHS.has(card.href) && (
                    <h3 id={`card-${idx}-title`} className="text-[1.05rem] md:text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                      {card.title}
                    </h3>
                  )}
                  <p className={`mt-1.5 text-xs md:text-[0.8rem] text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4 ${HERO_CARD_PATHS.has(card.href) ? 'mt-0' : ''}`}> 
                     {card.description}
                   </p>
                   </div>
                  {/* CTA removed per request */}
                  {/* Glow effect */}
                  <span className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-transparent group-hover:ring-primary-300/50 dark:group-hover:ring-primary-700/40 transition" aria-hidden="true" />
                  <div className="pointer-events-none absolute -bottom-14 -right-14 h-44 w-44 rounded-full bg-primary-400/10 dark:bg-primary-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition duration-700" />
                  {/* Subtle gradient overlay accent */}
                  <div className="pointer-events-none absolute inset-px rounded-[calc(theme(borderRadius.3xl)-2px)] bg-gradient-to-br from-primary-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-700" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}