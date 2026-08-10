import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Security & Advisories | Pulse 360",
  description: "Security posture, advisories & incident awareness (placeholder)."
};

export default function SecurityPage() {
  const cardBase = "group flex flex-col items-center justify-center text-center rounded-2xl border border-line bg-surface p-5 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/40 h-full relative";
  return (
    <main className="w-full flex flex-col items-center bg-canvas pt-10 pb-20">
      <div className="w-full max-w-5xl px-4 md:px-8">
        <header className="mb-10">
          <h1 className="type-h1 text-ink">Security &amp; Advisories</h1>
          <p className="type-body mt-3 max-w-2xl text-ink-muted">Central surface for service health, security advisories, vulnerability disclosures &amp; incident timelines.</p>
        </header>
        <section aria-labelledby="msrc-links" className="mb-14">
          <h2 id="msrc-links" className="sr-only">Microsoft Security Response Center Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[11rem] stagger-children">
            <div className="stagger-animate animate-fade-up will-change-transform">
              <Link href="/msrc" className={cardBase}>
                <h3 className="type-h3 text-ink">MSRC Portal</h3>
                <p className="type-body-sm mt-2 max-w-[26ch] text-ink-muted">Official Microsoft Security Response Center portal for vulnerability &amp; security update information.</p>
                <div className="pointer-events-none absolute -bottom-14 -right-14 h-44 w-44 rounded-full bg-accent/10 blur-3xl opacity-0 group-hover:opacity-100 transition duration-700" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <div className="mt-12">
          <Link href="/home" className="type-body-sm font-medium text-accent hover:underline">← Back to Hub</Link>
        </div>
      </div>
    </main>
  );
}