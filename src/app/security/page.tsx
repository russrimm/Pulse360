import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Security & Advisories | Pulse 360",
  description: "Security posture, advisories & incident awareness (placeholder)."
};

export default function SecurityPage() {
  return (
    <main className="w-full flex flex-col items-center bg-white dark:bg-black pt-10 pb-24">
      <div className="w-full max-w-5xl px-4 md:px-8">
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Security & Advisories</h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-gray-600 dark:text-gray-400">Central surface for service health, security advisories, vulnerability disclosures & incident timelines.</p>
        </header>
        <section aria-labelledby="msrc-links" className="mb-14">
          <h2 id="msrc-links" className="sr-only">Microsoft Security Response Center Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link
              href="/msrc"
              className="group flex flex-col rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/50 dark:focus-visible:ring-primary-800/50"
            >
               <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">MSRC Portal</h3>
               <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Official Microsoft Security Response Center portal for vulnerability & security update information.</p>
               <span className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 inline-flex items-center">Open<span className="ml-1">→</span></span>
            </Link>
            <Link
              href="/msrc/blog"
              className="group flex flex-col rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/50 dark:focus-visible:ring-primary-800/50"
            >
               <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">MSRC Blog</h3>
               <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Deep dives, disclosures & insights from the Microsoft Security Response Center team.</p>
               <span className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 inline-flex items-center">Open<span className="ml-1">→</span></span>
            </Link>
          </div>
        </section>
        <div className="mt-12">
          <Link href="/home" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">← Back to Hub</Link>
        </div>
      </div>
    </main>
  );
}